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

    /**
     * Build a new field properties object from defaultField.
     *
     * @private
     * @param {String} field        The name of the field.
     * @param {Object} defaultField The default properties for the
     *                              BaseType object.
     */
    _buildFieldProperties(field, defaultField) {
        let fieldProperties = {};

        // Copy values from defaultField into fieldProperties
        (function copy(fieldProperties, defaultField) {
            for (let key in defaultField) {
                if (defaultField.hasOwnProperty(key)) {
                    if (key == 'type' &&
                            typeof defaultField.type == 'object') {
                        copy(fieldProperties, defaultField[key]);
                    } else if (typeof defaultField[key] == 'object') {
                        if (!fieldProperties.hasOwnProperty(key)) {
                            fieldProperties[key] = {};
                        }

                        copy(fieldProperties[key], defaultField[key]);
                    } else {
                        fieldProperties[key] = defaultField[key];
                    }
                }
            }
        })(fieldProperties, defaultField);

        if (fieldProperties.hasOwnProperty('default')) {
            fieldProperties.value = fieldProperties.default;
        } else {
            fieldProperties.value = null;
        }

        this._fieldProperties[field] = fieldProperties;
    }

    /**
     * Build a new field from its properties.
     *
     * @private
     * @param {String} field           The name of the field.
     * @param {Object} fieldProperties The field properties for the
     *                                 field.
     */
    _buildField(field, fieldProperties) {
        if (fieldProperties.hasOwnProperty('unit')) {
            let newField = {};

            for (let key in fieldProperties.unit) {
                if (fieldProperties.unit.hasOwnProperty(key)) {
                    Object.defineProperty(newField, key, {
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

            this[field] = newField;
        } else {
            Object.defineProperty(this, key, {
                get: () => {
                    return fieldProperties.value;
                },
                enumerable: true
            });
        }
    }

    /**
     * Get the conversion function for a field and its unit.
     *
     * @private
     * @throws Will throw an error if unit not found.
     * @param  {String}   field           The name of the field.
     * @param  {Object}   fieldProperties The field properties for
     *                                    the field.
     * @param  {Object}   options         The unit options.
     * @return {Function}                 The conversion function.
     */
    _getConvertFunction(field, fieldProperties, options) {
        let unit;

        if (options === undefined) {
            return null;
        } else if (fieldProperties.type != 'number') {
            return null;
        } else if (!fieldProperties.hasOwnProperty('unit')) {
            return null;
        } else if (options.hasOwnProperty(field)) {
            unit = options[field];
        } else if (fieldProperties.hasOwnProperty('name') &&
                options.hasOwnProperty(fieldProperties.name)) {
            unit = options[fieldProperties.name];
        } else {
            return null;
        }

        if (!fieldProperties.unit.hasOwnProperty(unit)) {
            throw new Error('Unit \'' + unit + '\' not found for \'' + field +
                    '\'');
        }

        if (fieldProperties.unit[unit].default) {
            return null;
        }

        return fieldProperties.unit[unit].convertFrom;
    }

    /**
     * Get the format function for a field and its unit.
     *
     * @private
     * @throws Will throw an error if unit not found or for
     *         non-number.
     * @param  {String}   field           The name of the field.
     * @param  {Object}   fieldProperties The field properties for
     *                                    the field.
     * @param  {String}   unit            The unit desired.
     * @return {Function}                 The format function.
     */
    _getFormatFunction(field, fieldProperties, unit) {
        if (fieldProperties.type != 'number') {
            if (unit === undefined) {
                return null;
            } else {
                throw new Error('Cannot specify unit for non-number');
            }
        } else if (!fieldProperties.hasOwnProperty('unit')) {
            if (unit === undefined) {
                return null;
            } else {
                throw new Error('Cannot specify unit for \'' + field + '\'');
            }
        }

        if (!fieldProperties.unit.hasOwnProperty(unit)) {
            throw new Error('Unit \'' + unit + '\' not found for \'' + field +
                    '\'');
        }

        return fieldProperties.unit[unit].format;
    }

    /**
     * Add fields to the BaseType object.
     *
     * fields is an Object with keys of the fields to be added, for
     * each field key there is the value of that field. options
     * contains the units for the fields by global unit names and by
     * specific fields. Units given for specific fields take priority
     * over the global units.
     *
     * @example <caption>Adding all speeds in m/s but groundspeed in
     * kt </caption>
     * telemetry.add({airspeed: 20, groundspeed: 30},
     *         {speed: 'metersPerSecond', groundspeed: 'knots'});
     *
     * @throws Will throw an error if unit not found.
     * @param {Object} fields  The fields to be added.
     * @param {Object} options The units of the fields.
     */
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

    /**
     * Returns a formatted string containing a field.
     *
     * The format string accepts the standard formatted string as
     * [spintf-js]{@link https://www.npmjs.com/package/sprintf-js}
     * does. The correct unit will automatically be appended to the
     * end of the format string.
     *
     * Units are only required for numerical fields that need a unit
     * to be accessed.
     *
     * Both field and unit are both the string names of the desired
     * field and unit, respectively.
     *
     * @example <caption>Getting airspeed in m/s</caption>
     * telemetry.format('%.3f', 'airspeed', 'metersPerSecond');
     *
     * @throws Will throw an error if unit not found or for
     *         non-number.
     * @param  {String} format The spintf-js format string.
     * @param  {String} field  The field to be used.
     * @param  {String} unit   The unit for the field.
     * @return {String}        The formatted string with the field
     *                         and unit.
     */
    format(format, field, unit) {
        let newFormat = this._getFormatFunction(field,
                this._fieldProperties[field], unit);

        if (newFormat) {
            format = newFormat.replace('{}', format);
        }

        if (unit !== undefined) {
            field = this[field][unit];
        } else {
            field = this[field];
        }

        return sprintf(format, field);
    }

    /**
     * Returns an object that represents a BaseType object.
     *
     * This allows for a BaseType object to be stored in a NeDB
     * Datastore.
     *
     * @see {@link fromDocument}
     * @return {Object} The document representing the BaseType.
     */
    toDocument() {
        return JSON.parse(this.serialize());
    }

    /**
     * Returns a BaseType object from a document.
     *
     * This converts the string that was turned into a document back
     * into its original form. When this class is called from a
     * subclass of BaseType with a constructor with the signature
     * (fields, options), an instance of the subclass is returned. If
     * not called on a subclass pass the defaults into the function
     * as well.
     *
     * @see {@link toDocument}
     * @param  {String}   document The document to recover.
     * @param  {Object}   defaults The BaseType defaults if needed.
     * @return {BaseType}          The BaseType created from the
     *                             document.
     */
    static fromDocument(document, defaults) {
        return this.deserialize(JSON.stringify(document), defaults);
    }

    /**
     * Returns a string that represents a BaseType object.
     *
     * This allows for a BaseType object to be passed as a string as
     * opposed to an object so that information is not lost. The
     * string is a readable JSON string.
     *
     * @see {@link deserialize}
     * @return {String} The serialized BaseType.
     */
    serialize() {
        let object = {};

        for (let key in this._fieldProperties) {
            if (this._fieldProperties.hasOwnProperty(key)) {
                object[key] = this._fieldProperties[key].value;
            }
        }

        return JSON.stringify(object);
    }

    /**
     * Returns a BaseType object from a serialized string.
     *
     * This converts the string that was serialized back into its
     * original form. When this class is called from a subclass of
     * BaseType with a constructor with the signature (fields,
     * options), an instance of the subclass is returned. If not
     * called on a subclass pass the defaults into the function as
     * well.
     *
     * @see {@link serialize}
     * @param  {String}   string   The string to deserialize.
     * @param  {Object}   defaults The BaseType defaults if needed.
     * @return {BaseType}          The BaseType created from the
     *                             string.
     */
    static deserialize(string, defaults) {
        let fields = JSON.parse(string);

        if (defaults !== undefined) {
            return new BaseType(defaults, fields);
        } else {
            return new this(fields);
        }
    }
}

module.exports = BaseType;
