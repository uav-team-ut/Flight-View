'use strict';

const EventEmitter = require('events');

const express = require('express');
const bodyParser = require('body-parser');

const whilst = require('async/whilst');

const AUVSIClient = require('../net/auvsi-client');
const Telemetry = require('./telemetry');
const Targets = require('./targets');

const DEFAULT_PORT = 25005;

module.exports = class HostServer extends EventEmitter {
    constructor(coreServer, coreSocket, allowListeners, port) {
        super();

        this._port = port || DEFAULT_PORT;

        this._httpServer = null;
        this._app = express();

        this._app.locals.hostServer = this;
        this._app.locals.coreServer = coreServer;
        this._app.locals.coreSocket = coreSocket;
        this._app.locals.auvsiClient = new AUVSIClient();
        this._app.locals.telemetry = Telemetry(this);
        this._app.locals.targets = Targets(this, this.auvsiClient);

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

                    let broadcastTargets = (callback) => {
                        if (typeof callback != 'function') {
                            callback = () => {};
                        }

                        this.auvsiClient.getTargets((error, targets) => {
                            if (error) {
                                callback(error);
                                return;
                            }

                            this.broadcast({
                                type: 'targets',
                                message: targets
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

                    whilst(() => this.auvsiClient.loggedIn, (callback) => {
                        broadcastTargets();

                        setTimeout(() => callback(null, callback), 500);
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

        this.telemetry.close();
        this.targets.close();

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

    get auvsiClient() {
        return this._app.locals.auvsiClient;
    }

    get telemetry() {
        return this._app.locals.telemetry;
    }

    get targets() {
        return this._app.locals.targets;
    }
}
