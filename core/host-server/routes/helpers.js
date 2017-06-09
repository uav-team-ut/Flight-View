'use strict';

module.exports = {
    QueryChecker(req) {
        return (field, callback) => {
            let value = req.query[field];

            return value === undefined ? undefined : callback(value);
        };
    },
    sendError(res) {
        return (err) => res.status(500).send(err.stack);
    }
};
