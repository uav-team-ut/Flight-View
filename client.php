<?php
/**
 *
 */
abstract class BaseClient {
    const HOST = '127.0.0.1';
    const PORT = 25000;

    private $socket;
    private $closed;

    private $receivingLength;
    private $receivingMessage;
    private $lengthInProgress;
    private $messageInProgress;

    /**
     *
     */
    public function __construct() {
        $this->closed = false;

        $this->receivingLength = false;
        $this->receivingMessage = false;
        $this->lengthInProgress = 0;
        $this->messageInProgress = '';

        do {
            $this->socket = socket_create(AF_INET, SOCK_STREAM,
                getprotobyname('tcp'));
            $connected = @socket_connect($this->socket, self::HOST,
                self::PORT);

            $errorNumber = socket_last_error($this->socket);

            if ($errorNumber == 61) {

                echo 'Could not connect to core... trying again.' . PHP_EOL;
                sleep(5);
            } elseif (!$connected) {
                exit('Socket error: ' . $errorNumber . ' ' .
                    socket_strerror($errorNumber) . PHP_EOL);
            }
        } while ($errorNumber == 61);

        socket_clear_error($this->socket);
        socket_set_nonblock($this->socket);
    }

    /**
     *
     */
    abstract protected function handleMessage($message);

    /**
     *
     *
     * @return bool
     */
    public function handleNewMessages() {
        while (!$this->closed) {
            $message = $this->receive();

            if ($message === null) {
                return false;
            } elseif (!$message) {
                return true;
            }

            $succeeded = $this->handleMessage($message);

            if (!$succeeded) {
                return false;
            }
        }

        return true;
    }

    /**
     * Sends a string through the socket.
     *
     * send() will first send the length of $string and then $string
     * itself. The full string will be sent.
     *
     * false is returned if there was an error sending the string.
     *
     * @param string $string String to be sent through the socket
     *
     * @return bool true if the message was sent, false on error
     */
    protected function send($string) {
        // If the client is closed return false.
        if ($this->closed) {
            return false;
        }

        // Format the length of $string in an 8 chacter string and
        // form the message by concatenating it with the string.
        $length = sprintf('%8d', strlen($string));

        if (strlen($length) > 8) {
            exit('Cannot send message. Too long.');
        }

        $message = $length . $string;

        // Keep sending the message if not all of it has been sent.
        while ($message) {
            $written = socket_write($this->socket, $message,
                min(1024, strlen($message)));

            if ($written === false) {
                return false;
            }

            $message = substr($message, $written);
        }

        return true;
    }

    /**
     * Returns the next string sent through the socket.
     *
     * receive() will not block if a full string hasn't been
     * received. If no string or a partial string has been sent by
     * the other end of the socket at the time receive() is called
     * the function will return an empty string. If a partial string
     * has been sent, the next time receive() is called it will try
     * to get the rest of the string.
     *
     * null is returned if there was an error receiving the string.
     *
     * @return string|null Next full string in socket, empty string
     *                     if there is none, null on error
     */
    protected function receive() {
        // If the client is closed return null.
        if ($this->closed) {
            return null;
        }

        // Set the message length intially to the length of the
        // message that is still being received.
        $length = $this->lengthInProgress;

        // If not in the process of receiving the message content,
        // get the length of the message.
        if (!$this->receivingMessage) {
            $this->receivingLength = true;
            $length = $this->receiveLength(8);

            if (!$length) {
                return $length;
            }

            $this->receivingLength = false;
            $length = intval($length);
        }

        // Get the message content.
        $this->receivingMessage = true;
        $message = $this->receiveLength($length);

        if (!$message) {
            return $message;
        }

        $this->receivingMessage = false;
        return $message;
    }

    /**
     * Returns the next $length characters sent through the socket.
     *
     * receiveLength() will not block if $length characters haven't
     * been sent by the other end of the socket at the time
     * receiveLength() is called the function will return an empty
     * string. If only part of the $length chacaracter string has
     * been sent the function will store that partial message for the
     * next time receiveLength() is called.
     *
     * null is returned if there was an error receiving the string.
     *
     * @param int $length Length of the full string to be received
     *
     * @return string|null Next $length character string in socket,
     *                     empty string if there is none, null on
     *                     error
     */
    private function receiveLength($length) {
        // Set the message intially to what has been received so far.
        $message = $this->messageInProgress;

        // Loop while there are still more characters to get in
        // message.
        while (strlen($message) < $length) {
            $received = socket_read($this->socket,
                min(1024, $length - strlen($message)));

            // If there was an error return false.
            if ($received === false) {
                return null;
            // If an empty string was returned, set the message
            // received so far and return an empty string.
            } elseif (!$received) {
                $this->lengthInProgress = $length;
                $this->messageInProgress = $message;

                return '';
            }

            $message .= $received;
        }

        $this->messageInProgress = '';

        return $message;
    }

    /**
     * Returns whether or not the client has been closed.
     *
     * @return bool true if the socket is closed, otherwise false
     */
    public function isClosed() {
        return $this->closed;
    }

    /**
     * Closes the client. No messages will be read or sent after
     * close() is called.
     */
    public function close() {
        $this->closed = true;

        socket_shutdown($this->socket, 2);
        socket_close($this->socket);
    }
}

final class Client extends BaseClient {
    private $connected;

    /**
     *
     */
    public function __construct() {
        parent::__construct();

        echo 'Connected to core.' . PHP_EOL;

        $this->connected = false;

        while (!$this->connected) {
            $this->handleNewMessages();

            usleep(1000);
        }

        // TODO Connect to the database, add private methods for
        // database calls.
    }

    /**
     *
     */
    protected function handleMessage($message) {
        $message = json_decode($message, true);

        $type = $message['type'];
        $message = $message['message'];

        if ($message !== null) {
            $type .= '.' . $message['type'];
        }

        switch ($type) {
            case 'connect.request':
                $this->send(json_encode(array(
                    'type' => 'connect',
                    'message' => array(
                        'type' => 'data',
                        'program' => 'flight-view'
                    )
                )));

                $this->connected = true;

                break;
            case 'ping':
                $this->send(json_encode(array(
                    'type' => 'ping',
                    'message' => null
                )));

                break;
            case 'rate.data':
                // TODO rate.data

                break;
            // TODO add more cases
            default:
                echo 'Message type \'' . $type . '\' not handled.'
                    . PHP_EOL;

                return false;
        }

        return true;
    }
}

// //Temporary testing code for client.
// $client = new Client();
//
// $client->close()
?>
