'use strict'

const spawn = require('child_process').spawn;

module.exports = function getTargets(image) {
    return new Promise((resolve, reject) => {
        let targets = spawn('python3', ['-m', 'process_image_wrapper', image]);

        let data = '';
        let error = '';

        targets.stdout.on('data', (newData) => {
            data += newData;
        });

        targets.stderr.on('data', (newData) => {
            error += newData;
        });

        targets.on('close', (code) => {
            if (error) reject(error);
            else resolve(JSON.parse(data));
        });
    });
};
