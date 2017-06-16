'use strict';

const express = require('express');

const parsers = require('../parsers');
const helpers = require('./helpers');

const Telemetry = require('../../../util/types').Telemetry;

let router = express.Router();

router.post('/', parsers.json, (req, res) => {
    let telem = new Telemetry(req.body);

    req.app.locals.telemetry.add(telem);

    res.sendStatus(201);
});

router.get('/:time', (req, res) => {
    let time = parseFloat(req.params.time);

    req.app.locals.telemetry.get(time).then((telem) => {
        if (telem !== null) {
            res.send(telem.toDocument());
        } else {
            res.send({});
        }
    }).catch(helpers.sendError(res));
});

router.get('/recent', (req, res) => {
    res.send(req.app.locals.telemetry.get().toDocument());
});

module.exports = router;
