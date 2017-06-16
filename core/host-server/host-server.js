'use strict';

const EventEmitter = require('events');

const express = require('express');
const bodyParser = require('body-parser');

const whilst = require('async/whilst');

const AUVSIClient = require('../net/auvsi-client');
const Database = require('../db');

const Images = require('./images');
const Targets = require('./targets');
const Telemetry = require('./telemetry');

const imagesRouter = require('./routes/images-router');
const targetsRouter = require('./routes/targets-router');
const telemetryRouter = require('./routes/telemetry-router');
const timeRouter = require('./routes/time-router');

const DEFAULT_PORT = 25005;

module.exports = class HostServer extends EventEmitter {
    constructor(coreServer, coreSocket, allowListeners, port) {
        super();

        this._port = port || DEFAULT_PORT;

        this._httpServer = null;
        this._app = express();

        this._app.use('/api/images', imagesRouter);
        this._app.use('/api/targets', targetsRouter);
        this._app.use('/api/telemetry', telemetryRouter);
        this._app.use('/api/time', timeRouter);

        this._app.locals.hostServer = this;
        this._app.locals.coreServer = coreServer;
        this._app.locals.coreSocket = coreSocket;
        this._app.locals.db = new Database(false);
        this._app.locals.auvsiClient = new AUVSIClient();

        this._app.locals.images = Images(this);
        this._app.locals.targets = Targets(this);
        this._app.locals.telemetry = Telemetry(this);

        this._listeners = {};

        this._listeners.handleLogin = (message, socket) => {
            // FIXME: Currently pulling login details from
            // environment variables since GUI cannot specify.

            message.url = process.env.FV_INTEROP_URL;
            message.username = process.env.FV_INTEROP_USERNAME;
            message.password = process.env.FV_INTEROP_PASSWORD;

            this.auvsiClient.login(message.url, message.username,
                    message.password, (error) => {
                if (error !== null) {
                    this.coreSocket.send({
                        type: 'login.fail',
                        message: error
                    });
                } else {
                    this.broadcast({
                        type: 'login.success',
                        message: {
                            url: message.url,
                            username: message.username
                        }
                    });

                    let broadcastMission = (callback) => {
                        if (typeof callback != 'function') {
                            callback = () => {};
                        }

                        this.auvsiClient.getMissions((error, missions) => {
                            if (error) {
                                callback(error);
                                return;
                            }

                            for (let i = 0; i < missions.length; i++) {
                                let mission = missions[i];

                                if (mission.active === true) {
                                    this.broadcast({
                                        type: 'interop-mission',
                                        message: mission
                                    });

                                    break;
                                }
                            }

                            callback(null);
                        });
                    };

                    let broadcastObstacles = (callback) => {
                        if (typeof callback != 'function') {
                            callback = () => {};
                        }

                        this.auvsiClient.getObstacles((error, obstacles) => {
                            if (error) {
                                callback(error);
                                return;
                            }

                            this.broadcast({
                                type: 'obstacles',
                                message: obstacles
                            });

                            callback(null);
                        });
                    }

                    whilst(() => this.auvsiClient.loggedIn, (callback) => {
                        broadcastMission();

                        setTimeout(() => callback(null, callback), 500);
                    });

                    whilst(() => this.auvsiClient.loggedIn, (callback) => {
                        broadcastObstacles();

                        setTimeout(() => callback(null, callback), 100);
                    });
                }
            });
        };

        this.coreServer.onMessage('login.request',
                this._listeners.handleLogin);
    }

    listen() {
        this._httpServer = this._app.listen(this._port);
    }

    close() {
        this._httpServer.close();

        this.auvsiClient.logout();

        this.coreSocket.removeListener('login.request',
                this._listeners.handleLogin);
    }

    broadcast(message) {
        this.coreSocket.send(message);
    }

    get coreServer() {
        return this._app.locals.coreServer;
    }

    get coreSocket() {
        return this._app.locals.coreSocket;
    }

    get db() {
        return this._app.locals.db;
    }

    get auvsiClient() {
        return this._app.locals.auvsiClient;
    }

    get images() {
        return this._app.locals.images;
    }

    get targets() {
        return this._app.locals.targets;
    }

    get telemetry() {
        return this._app.locals.telemetry;
    }
}
