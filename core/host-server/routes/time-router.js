'use strict';

const express = require('express');

let router = express.Router();

router.get('/', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(String(Date.now() / 1000));
});

module.exports = router;
