'use strict';

const fs = require('fs');
const path = require('path');

const download = require('download-git-repo');

let dir = path.join(__dirname, '..',
        'core/process-image/process_image_wrapper/image_processing_files');

download('uav-team-ut/Image_Recognition#v0.1-beta.1', dir, (error) => {
    if (error) {
        console.error(error);
    }

    fs.closeSync(fs.openSync(path.join(dir, '__init__.py'), 'w'));
});
