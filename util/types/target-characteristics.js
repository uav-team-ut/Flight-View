'use strict';

exports.SHAPE = {
    type: 'string',
    verify: (shape) => {
        return [
            'circle',
            'semicircle',
            'quarter-circle',
            'triangle',
            'square',
            'rectangle',
            'trapezoid',
            'pentagon',
            'hexagon',
            'heptagon',
            'octagon',
            'star',
            'cross'
        ].includes(shape);
    },
    default: null
};

exports.COLOR = {
    type: 'string',
    verify: (color) => {
        return [
            'white',
            'black',
            'gray',
            'red',
            'blue',
            'green',
            'yellow',
            'purple',
            'brown',
            'orange'
        ].includes(color)
    },
    default: null
};

exports.ORIENTATION = {
    type: 'string',
    verify: (orientation) => {
        return [
            'N',
            'NE',
            'E',
            'SE',
            'S',
            'SW',
            'W',
            'NW'
        ].includes(orientation)
    }
}

exports.ALPHANUMERIC = {
    type: 'string',
    verify: (alphanumeric) => {
        return alphameric.search(/^[a-z0-9]$/i) !== -1;
    }
}
