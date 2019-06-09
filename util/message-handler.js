'use strict';

/**
 * Contains the MessageHandler class.
 *
 * @module util/message-handler
 */

const EventEmitter = require('events');

/**
 * Registers functions to run when messages are passed in.
 *
 * <p>This class is meant to be subclassed and so it extends
 * EventEmitter so that the subclasses of this do not have to use
 * mixins to subclass multiple things.
 *
 * @extends EventEmitter
 */
class MessageHandler extends EventEmitter {
  /**
   * Create a MessageHandler.
   */
  constructor() {
    super();

    this._callbacks = {};
  }

  /**
   * Register a function to run on a given message.
   *
   * The message will be a string representing the message type.
   * Normally, they will look like <code>'test'</code> or
   * <code>'hello.world'</code>.
   *
   * <p>The callback will take in an message object and a socket.
   * Any properties that should be in the message object can be
   * assumed.
   *
   * @param {String} message  The name of the message
   * @param {Object} callback
   */
  onMessage(message, callback) {
    this._callbacks[message] = (message, socket) => {
      return new Promise((resolve, reject) => {
        callback(message, socket);

        resolve();
      });
    };
  }

  /**
   * Handles a message given that a function has been registered
   * for that message.
   *
   * <p>Messages must have a <code>type</code> and
   * <code>message</code> property. The <code>message</code>
   * property can contain any property and this will be passed into
   * the handler function. If the <code>message</code> property
   * also contains a <code>type</code> property it will append that
   * to the type with a period in between.
   *
   * @example
   * <caption>
   * Handling a generic message
   * </caption>
   * handler = new MessageHandler();
   *
   * handler.onMessage('test', () => console.log('Hello World'));
   * handler.handleMessage({type:'test', message:null});
   *
   * @param  {Object}  message The message to be handled.
   * @param  {Object}  socket  The socket that send the message.
   *                           (Optional)
   * @return {Promise}         The wrapped handler function. Does
   *                           not return a value, but can have an
   *                           an error.
   */
  handleMessage(message, socket) {
    message = JSON.parse(JSON.stringify(message));

    if (message.message && message.message.type) {
      message.type += '.' + message.message.type;
      delete message.message.type;
    }

    if (this._callbacks.hasOwnProperty(message.type)) {
      return this._callbacks[message.type](message.message, socket);
    } else {
      return Promise.reject(
        new Error("Unhandled message type: '" + message.type + "'")
      );
    }
  }
}

module.exports = MessageHandler;
