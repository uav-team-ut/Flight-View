'use strict';

const express = require('express');

let router = express.Router();

router.get('/:time', (req, res) => {
    // return close time, option for splining.
});

router.get('/recent', (req, res) => {
    // Return most recently telem
});

module.exports = router;
