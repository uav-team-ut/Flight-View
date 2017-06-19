'use strict';

module.exports = function Images(server) {
    let images = {};

    images.add = (image) => {
        const Image = require('../../util/types').Image;

        image = image.toDocument();

        let old_data = image.data_warped;

        const tmp = require('tmp');
        const path = require('path');
        const fs = require('fs');

        let templ = path.join('/tmp/fv-image-XXXXXX');

        return new Promise(function(resolve, reject) {
            tmp.tmpName({ template: templ }, (err, path) => {
                if (err) throw err;

                image.data_warped = path;
                image = Image.fromDocument(image);

                fs.writeFile(path, old_data, (err) => {
                    if (err) throw err;

                    return server.db.images.insert(image).then((id) => {
                        resolve();

                        // TODO: when the front end can display images they
                        // should be send there

                        // server.broadcast({
                        //     type: 'image',
                        //     message: image.serialize()
                        // });
                    });
                });
            });
        });
    };

    images.update = (id, image) => {
        return server.db.images.update({_id: id}, image);
    };

    images.getID = (id) => {
        return server.db.images.findOne({_id: id});
    };

    images.get = (limit) => {
        const fs = require('fs');

        return server.db.images.find({}, limit).then((images) => {
            let list = [];

            for (let i = 0; i < images.length; i++) {
                list.push(new Promise(function(resolve, reject) {
                    fs.readFile(images[i].data_warped, 'utf-8', (err, data) => {
                        images[i].data_warped = data;
                        resolve();
                    });
                }));
            }

            return Promise.all(list).then(() => images);
        });
    };

    images.getUnprocessed = (limit) => {
        const fs = require('fs');

        return server.db.images.find({processed: false}, limit).then((images) => {
            let list = [];

            for (let i = 0; i < images.length; i++) {
                list.push(new Promise(function(resolve, reject) {
                    fs.readFile(images[i].data_warped, 'utf-8', (err, data) => {
                        images[i].data_warped = data;
                        resolve();
                    });
                }));
            }

            return Promise.all(list).then(() => images);
        });
    };

    images.getUnprocessedManual = (limit) => {
        const fs = require('fs');
        
        return server.db.images.find({processed_manual: false}, limit).then((images) => {
            let list = [];

            for (let i = 0; i < images.length; i++) {
                list.push(new Promise(function(resolve, reject) {
                    fs.readFile(images[i].data_warped, 'utf-8', (err, data) => {
                        images[i].data_warped = data;
                        resolve();
                    });
                }));
            }

            return Promise.all(list).then(() => images);
        });
    };

    return images;
};
