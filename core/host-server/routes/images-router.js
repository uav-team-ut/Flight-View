'use strict';

const express = require('express');

const parsers = require('../parsers');
const helpers = require('./helpers');

const Image = require('../../../util/types').Image;

let router = express.Router();

router.get('/', (req, res) => {
    let checkQuery = helpers.QueryChecker(req);

    let limit = checkQuery('limit', (value) => parseInt(value));
    let processed = checkQuery('processed', (value) => value == 'true');
    let processedManual = checkQuery('processed_manual',
            (value) => value == 'true');

    let func;
    let imagesFunc = req.app.locals.images;

    if (processed === false) {
        func = imagesFunc.getUnprocessed;
    } else if (processedManual === false) {
        func = imagesFunc.getUnprocessedManual;
    } else {
        func = imagesFunc.get;
    }

    func(limit).then((images) => res.send(images))
        .catch(helpers.sendError(res));
});

router.post('/', parsers.json, (req, res) => {
    req.body.data_original = '';

    let image = new Image(req.body);

    req.app.locals.images.add(image).then(() => res.sendStatus(201))
        .catch(helpers.sendError(res));
});

router.get('/:id', (req, res) => {
    // Return image with id
});

router.put('/:id', parsers.json, (req, res) => {
    let image = new Image(req.body);
    let id = req.params.id;

    req.app.locals.images.update(id, image).then(() => res.sendStatus(200))
        .catch(helpers.sendError(res));
});

router.patch('/:id', parsers.json, (req, res) => {
    let image = new Image(req.body);
    let id = req.params.id;

    req.app.locals.images.update(id, image).then(() => res.sendStatus(200))
        .catch(helpers.sendError(res));
});

module.exports = router;
