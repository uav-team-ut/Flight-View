'use strict';

const bodyParser = require('body-parser');

module.exports = {
    json: bodyParser.json({limit: '1gb'}),
    urlencoded: bodyParser.urlencoded({extended: false})
};
