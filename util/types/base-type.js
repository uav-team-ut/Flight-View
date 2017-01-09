'use strict';

const sprintf = require('sprintf-js').sprintf;

class BaseType {
    constructor(defaultFields, fields, options) {
        this._fieldProperties = {};

        for (let key in defaultFields) {
            if (defaultFields.hasOwnProperty(key)) {
                this._buildFieldProperties(key, defaultFields[key]);
                this._buildField(key, this._fieldProperties[key]);
            }
        }

        this.add(fields, options);
    }

    _copyFieldProperties(fieldProperties, defaultField) {
        for (let key in defaultField) {
            if (defaultField.hasOwnProperty(key)) {
                if (key == 'type' && typeof defaultField.type == 'object') {
                    this._copyFieldProperties(fieldProperties,
                            defaultField[key]);
                } else if (typeof defaultField[key] == 'object') {
                    if (!fieldProperties.hasOwnProperty(key)) {
                        fieldProperties[key] = {};
                    }

                    this._copyFieldProperties(fieldProperties[key],
                            defaultField[key]);
                } else {
                    fieldProperties[key] = defaultField[key];
                }
            }
        }
    }

    _buildFieldProperties(key, defaultField) {
        let fieldProperties = {};

        this._copyFieldProperties(fieldProperties, defaultField);

        if (fieldProperties.hasOwnProperty('default')) {
            fieldProperties.value = fieldProperties.default;
        } else {
            fieldProperties.value = null;
        }

        this._fieldProperties[key] = fieldProperties;
    }

    _buildField(key, fieldProperties) {
        if (fieldProperties.hasOwnProperty('unit')) {
            let field = {};

            for (let key in fieldProperties.unit) {
                if (fieldProperties.unit.hasOwnProperty(key)) {
                    Object.defineProperty(field, key, {
                        get: () => {
                            if (fieldProperties.unit[key].default) {
                                return fieldProperties.value;
                            } else {
                                return fieldProperties.unit[key].convertTo(
                                    fieldProperties.value);
                            }
                        },
                        enumerable: true
                    })
                }
            }

            this[key] = field;
        } else {
            Object.defineProperty(this, key, {
                get: () => {
                    return fieldProperties._value;
                },
                enumerable: true
            });
        }
    }

    _getConvertFunction(key, fieldProperties, options) {
        let unit;

        if (options === undefined) {
            return null;
        } else if (fieldProperties.type != 'number') {
            return null;
        } else if (!fieldProperties.hasOwnProperty('unit')) {
            return null;
        } else if (options.hasOwnProperty(key)) {
            unit = options[key];
        } else if (fieldProperties.hasOwnProperty('name') &&
                options.hasOwnProperty(fieldProperties.name)) {
            unit = options[fieldProperties.name];
        } else {
            return null;
        }

        if (!fieldProperties.unit.hasOwnProperty(unit)) {
            throw new Error('Unit \'' + unit + '\' not found for \'' + key +
                    '\'');
        }

        if (fieldProperties.unit[unit].default) {
            return null;
        }

        return fieldProperties.unit[unit].convertFrom;
    }

    add(fields, options) {
        for (let key in fields) {
            if (fields.hasOwnProperty(key)) {
                if (!this._fieldProperties.hasOwnProperty(key)) {
                    throw new Error('Unknown field \'' + key + '\'');
                }

                let newValue = fields[key];

                if (this._fieldProperties[key].type == 'number') {
                    let convertFunction = this._getConvertFunction(key,
                            this._fieldProperties[key], options);

                    if (convertFunction) {
                        newValue = convertFunction(newValue);
                    }
                }

                this._fieldProperties[key].value = newValue;
            }
        }
    }

    serialize() {
        let object = {};

        for (let key in this._fieldProperties) {
            if (this._fieldProperties.hasOwnProperty(key)) {
                object[key] = this._fieldProperties[key].value;
            }
        }

        return JSON.stringify(object);
    }

    static deserialize(string) {
        let fields = JSON.parse(string);

        return new this(fields);
    }
}

module.exports = BaseType;
