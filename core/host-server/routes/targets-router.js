'use strict';

const express = require('express');

const parsers = require('../parsers');

let router = express.Router();

router.get('/', (req, res) => {
    // Return all targets
    //
    // TODO: USE OPTION FOR NOT SENDING THE TARGET IMAGE TOO.
});

router.post('/', parsers.json, (req, res) => {
    // Add a new target
});

router.get('/:id', (req, res) => {
    // Get a target with id
});

router.put('/:id', parsers.json, (req, res) => {
    // Update a target
});

router.delete('/:id', (req, res) => {

});

module.exports = router;
