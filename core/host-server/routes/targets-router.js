'use strict';

const express = require('express');

const parsers = require('../parsers');

let router = express.Router();

router.get('/', (req, res) => {
    req.app.locals.auvsiClient.getTargets((error, targets) => {
        if (error) res.sendStatus(500);
        else res.send(targets);
    });
});

router.post('/', parsers.json, (req, res) => {
    let targetNoData = req.body;

    let targetData=req.body.data;

    if (targetNoData.hasOwnProperty('data')) {
        delete targetNoData.data;
    }

    console.log('Posting:\n')
    console.log(req.body);
    console.log('\n')

    req.app.locals.auvsiClient.postTarget(targetNoData, (error, target) => {
        if (error) {
            console.log(error);
            res.sendStatus(500);
        } else if (targetData!=undefined) {
            req.app.locals.auvsiClient.putTargetImage(target.id, targetData,
                    (error) => {
                if (error) res.sendStatus(500);
                else res.sendStatus(200);
            });
        } else {
            res.sendStatus(200);
        };
    });
});

router.get('/:id', (req, res) => {
    req.app.locals.auvsiClient.getTarget((error, target) => {
        if (error) res.sendStatus(500);
        else res.send(targets);
    });
});

router.patch('/:id', parsers.json, (req, res) => {
    let targetNoData = req.body;

    if (targetNoData.hasOwnProperty('data')) {
        delete targetNoData.data;
    }

    req.app.locals.auvsiClient.putTarget(id, targetNoData, (error) => {
        if (error) {
            res.sendStatus(500);
        } else if (req.body.hasOwnProperty('data')) {
            req.app.locals.auvsiClient.putTargetImage(id, req.body.data,
                    (error) => {
                if (error) res.sendStatus(500);
                else res.sendStatus(200);
            });
        } else {
            res.sendStatus(200);
        };
    });
});

router.delete('/:id', (req, res) => {
    req.app.locals.auvsiClient.deleteTarget(id, (error) => {
        if (error) res.sendStatus(500);
        else res.sendStatus(200);
    });
});

module.exports = router;
