'use strict';

const express = require('express');

const parsers = require('../parsers');

const angular = require('angular');
let router = express.Router();

router.get('/', (req, res) => {
    // Return all images
    // add some options, like unprocessed
    let img_limit=req.query.count;
    let processed=req.query.processed;
    let processed_manual=req.query.processed_manual;
    if(angular.equals({},processed)==false&&processed==true){
      if(angular.equals({},img_limit)==false){
        res.send(req.app.locals.images.getUnprocessed(img_limit);
      }
      else
      {
        res.send(req.app.locals.images.getUnprocessed();
      }
    }
    else if(angular.equals({},processed_manual)==false&&processed_manual==true){
        if(angular.equals({},img_limit)==false){
          res.send(req.app.locals.images.getUnprocessed(img_limit);
        }
        else
        {
          res.send(req.app.locals.images.getUnprocessed();
        }
    }
    else{
        if(angular.equals({},img_limit)==false){
          res.send(req.app.locals.images.getUnprocessed(img_limit);
        }
        else
        {
          res.send(req.app.locals.images.getUnprocessed();
        }
    }
});

router.post('/', parsers.json, (req, res) => {
    // Post a new image
    let img = new Image(req.body);

    req.app.locals.image.add(img);

    res.sendStatus(201);
});

router.get('/:id', (req, res) => {
    // Return image with id
});

router.put('/:id', parsers.json, (req, res) => {
    // Update image with id
});

module.exports = router;
