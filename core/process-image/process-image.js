const CLibrary = require('ffi').Library;
const CStruct = require('ref-struct');
const CArray = require('ref-array');

let Coordinate = CStruct({
    'x': 'int',
    'y': 'int'
});

let Target = CStruct({
    'originalImage': 'string',
    'topLeft': Coordinate,
    'bottomRight': Coordinate,
    'orientation': 'string',
    'shape': 'string',
    'backgroundColor': 'string',
    'alphanumeric': 'string',
    'alphanumericColor': 'string'
});

let TargetArray = CArray(Target);

const ProcessImage = CLibrary(
    './cpp/node-library/build/Release/process-image',
    {
    'getTargets': [TargetArray, ["string"]]
    }
);

exports.getTargets = ProcessImage.getTargets.async;
