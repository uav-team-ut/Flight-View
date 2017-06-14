'use strict';

module.exports = function Images(server) {
    let images = {};

    images.add = (image) => {
        return server.db.images.insert(image).then((id) => {
            // TODO: when the front end can display images they
            // should be send there

            // server.broadcast({
            //     type: 'image',
            //     message: image.serialize()
            // });
        });
    };

    images.update = (id, image) => {
        return server.db.images.update({_id: id}, image);
    };

    images.getID = (id) => {
        return server.db.images.findOne({_id: id});
    };

    images.get = (limit) => {
        return server.db.images.find({}, limit);
    };

    images.getUnprocessed = (limit) => {
        return server.db.images.find({processed: false}, limit);
    };

    images.getUnprocessedManual = (limit) => {
        return server.db.images.find({processed_manual: false}, limit);
    };

    return images;
};
