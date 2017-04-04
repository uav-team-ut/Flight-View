'use strict';

const EventEmitter = require('events');

const express = require('express');
const bodyParser = require('body-parser');

const Database = require('../db');

const Images = require('./images');
const Targets = require('./targets');
const Telemetry = require('./telemetry');

const imagesRouter = require('./routes/images-router');
const targetsRouter = require('./routes/targets-router');
const telemetryRouter = require('./routes/telemetry-router');
const timeRouter = require('./routes/time-router');

const DEFAULT_PORT = 25005

module.exports = class HostServer extends EventEmitter {
    constructor(coreServer, coreSocker, allowListeners, port) {
        super();

        let serverPort = port || DEFAULT_PORT;

        this._app = express();

        this._app.use('/api/images', imagesRouter);
        this._app.use('/api/targets', targetsRouter);
        this._app.use('/api/telemetry', telemetryRouter);
        this._app.use('/api/time', timeRouter);

        this._app.locals.hostServer = this;
        this._app.locals.coreServer = coreServer;
        this._app.locals.coreSocker = coreSocket;
        this._app.locals.db = new Database();

        this._app.locals.images = Images(this);
        this._app.locals.targets = Targets(this);
        this._app.locals.telemetry = Telemetry(this);

        this._app.listen(serverPort);
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

    get Images() {
        return this._app.locals.images;
    }

    get Targets() {
        return this._app.locals.targets;
    }

    get Telemetry() {
        return this._app.locals.telemetry;
    }
}
