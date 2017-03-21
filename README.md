Flight&nbsp;View
==

[![Build Status](
    https://travis-ci.org/uav-team-ut/Flight-View.svg?branch=master)](
    https://travis-ci.org/uav-team-ut/Flight-View)

> Unmanned Aerial Vehicle Team | The University of Texas at Austin

Main GUI used to display telemetry and other flight information built on
[Electron](http://electron.atom.io) by GitHub.

Multiples instances of Flight&nbsp;View can be connected together so that
single connections to other programs can be shared between them. All the
connected instances show the same information.

Installation
--
Ensure you have [Git](https://git-scm.com/downloads) installed on your system
first in order to clone the repository. Alternatively, the files may be simply
downloaded from GitHub for installation.

Node.js and npm are needed to install and run Flight&nbsp;View. Install
[Node.js](https://nodejs.org/en/download/) (the package manager npm is
included with it as well).

Navigate to the directory where you want to install Flight&nbsp;View and run
the following to clone the repository and install all needed dependencies:

```
git clone https://github.com/uav-team-ut/Flight-View.git
cd Flight-View
npm install
```

Usage
--
To run the program, navigate to the Flight&nbsp;View and run the following:
```
npm start
```

Afterwords you will be prompted to either run Flight&nbsp;View in Host or
Listen mode. If this is the only instance to be opened simply run it in Host
mode.

Otherwise, run Flight&nbsp;View in Host mode on one instance, and in Listen
mode on the others. Enter the local IP address of the hosting computer to
connect to it. The local IP address can be found on the instance in Host mode
at the top right.

<!-- TODO: Include information on connecting to Image Corrector and
Telemetry Sender. -->

AUVSI&nbsp;SUAS Competition Server
--
Flight&nbsp;View can connect to the
[AUVSI&nbsp;SUAS Competition Server](https://github.com/auvsi-suas/interop) to
upload telemetry, upload targets, download mission data, etc.

The server is released as a Docker image. To run the server, install
[Docker](https://docs.docker.com/engine/installation/) and then run the
following to have the server run in the Docker daemon:
```
docker run -d -i -t -p 8000:80 --name interop-server auvsisuas/interop-server
```
The following can be used to start and stop the server:
```
sudo docker start interop-server
sudo docker stop interop-server
```

To connect to the server in Flight&nbsp;View click on "Log in" in the top right
corner after Flight&nbsp;View is in either Host or Listen mode. The URL is
the IP address of the computer the server is running on and the port 8000
(unless the port has been changed), such as `192.168.0.150:8000`.

The default server username and password combinations are:
- `testuser` and `testpass`
- `testadmin` and `testpass`

Only one instance of Flight&nbsp;View needs to logged in to the server for the
system to be connected.

Repository Contents
--
The program is divided into two processes: the main and renderer processes.

The main process handles creating the main window and window events, server and
client connections to other programs, and managing the database,
etc.

The renderer process runs in the Chromium browser and manages the GUI
accessible to the user. An IPC connection between the main and renderer process
connects the two processes.

- `/flight-view`: Files for the renderer process.
- `/core`: Files for the main process.
- `/util`: Files shared by both the renderer and main processes.
- `/scripts`: Scripts needed for installation, building, etc.
- `/tests`: Tests for various files.
- `/LICENSE`: The license for this repository.
