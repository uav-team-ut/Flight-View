'use strict';

const fs = require('fs');
const path = require('path');

const jimp = require('jimp');

const MAX_ZOOM = 16;

fs.mkdir(path.join(__dirname, '..', '.data'), (err) => {
    if (err && err.code !== 'EEXIST') {
        throw err;
    }

    fs.mkdir(path.join(__dirname, '..', '.data/map-cache-images'), (err) => {
        if (err && err.code !== 'EEXIST') {
            throw err;
        }
    });
});

function getTile(zoom, lat, lon) {
    let col = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    let row = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 /
            Math.cos(lat * Math.PI / 180)) / Math.PI) * Math.pow(2, zoom - 1));

    return [col, row];
}

function downloadImage(zoom, col, row, callback) {
    let url = 'https://api.mapbox.com/v4/mapbox.satellite/' + zoom + '/' +
            col + '/' + row + '@2x.png128?access_token=' +
            process.env.FV_MAPBOX_KEY

    let imagePath = path.join(__dirname, '..', '.data/map-cache-images/map-cache-' +
            zoom + '-' + col + '-' + row +  '.jpg');

    jimp.read(url, (err, image) => {
        if (err) callback(err);

        image.write(imagePath, (err) => {
            if (err) callback(err);
            else callback(null);
        });
    });
}

function downloadRange(zoom, lat_1, lon_1, lat_2, lon_2, callback) {
    if (zoom < 14) throw new Error('Zoom must be 14 or higher');

    let requests = [];

    for (let z = Math.floor(zoom) - 1; z <= MAX_ZOOM; z++) {
        let topLeft = getTile(z, lat_1, lon_1);
        let bottomRight = getTile(z, lat_2, lon_2);

        let numTiles = Math.abs((bottomRight[0] - topLeft[0] + 1) *
                (bottomRight[0] - topLeft[0] + 1));

        for (let c = topLeft[0]; c <= bottomRight[0]; c++) {
            for (let r = topLeft[1]; r <= bottomRight[1]; r++) {
                requests.push(new Promise((resolve, reject) => {
                    downloadImage(z, c, r, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }));
            }
        }
    }

    Promise.all(requests).then(() => {
        callback(null);
    }).catch(callback);
}

exports.downloadImage = downloadImage;
exports.downloadRange = downloadRange;
