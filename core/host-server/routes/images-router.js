'use strict';

const express = require('express');

const parsers = require('../parsers');

let router = express.Router();

router.get('/', (req, res) => {
    // Return all images
    // add some options, like unprocessed
});

router.post('/', parsers.json, (req, res) => {
    // Post a new image
});

router.get('/:id', (req, res) => {
    // Return image with id
});

router.put('/:id', parsers.json, (req, res) => {
    // Update image with id
});

module.exports = router;
