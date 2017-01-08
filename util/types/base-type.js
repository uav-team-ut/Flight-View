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
                            if (fieldProperties.unit.default) {
                                return fieldProperties._value;
                            } else {
                                return fieldProperties.unit.convertTo(
                                    fieldProperties._value);
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

    serialize() {
        let object = {};

        for (let key in this._fieldProperties) {
            if (this._fieldProperties.hasOwnProperty(key)) {
                object[key] = this._fieldProperties[key].value;
            }
        }

        return JSON.stringify(object);
    }

    static deserialize(defaultFields, string) {
        let fields = JSON.parse(string);

        return new BaseType(defaultFields, fields);
    }
}

module.exports = BaseType;
