'use strict';

const request = require('request');

// Make the request module store cookies by default
let req = request.defaults({ jar: true });

const STANDARD_TELEMETRY = {
  latitude: 'number',
  longitude: 'number',
  altitude_msl: 'number',
  uas_heading: 'number'
};

const STANDARD_TARGETS = {
  type: 'string',
  latitude: 'number',
  longitude: 'number',
  orientation: 'string',
  shape: 'string',
  background_color: 'string',
  alphanumeric: 'string',
  alphanumeric_color: 'string',
  description: 'string',
  autonomous: 'boolean'
};

const NOT_LOGGED_IN = 'Not logged in';

class AUVSIClient {
  constructor() {
    this._loggedIn = false;
    this._url = NOT_LOGGED_IN;
  }

  get loggedIn() {
    return this._loggedIn;
  }

  get url() {
    return this._url;
  }

  logout() {
    this._loggedIn = false;
    this._url = NOT_LOGGED_IN;

    req = request.defaults({ jar: true });
  }

  _request(options, action, callback) {
    if (callback === undefined) {
      callback = action;
      action = null;
    }

    let returns = options.returns;

    let sendError = (error) => {
      if (returns) {
        callback(error, null);
      } else {
        callback(error);
      }
    };

    if (!options.hasOwnProperty('url') && !this.loggedIn) {
      sendError(new Error('Not logged in'));
    }

    if (typeof callback !== 'function') {
      sendError(new Error('Missing callback'));
    }

    options.url =
      (options.hasOwnProperty('url') ? options.url : this.url) + options.uri;

    delete options.returns;
    delete options.uri;

    req(options, (error, response, body) => {
      if (!error) {
        if (response.statusCode === 200 || response.statusCode === 201) {
          if (typeof action === 'function') {
            let newBody = action(body);

            body = newBody !== undefined ? newBody : body;
          }

          if (returns) {
            callback(null, body);
          } else {
            callback(null);
          }
        } else if (!this.loggedIn && response.statusCode == 400) {
          sendError(new Error('Invalid login'));
        } else {
          sendError(new Error(body));
        }
      } else if (error.message.startsWith('Invalid')) {
        sendError(new Error('Invalid URL'));
      } else if (error.message.startsWith('connect ECONNREFUSED')) {
        sendError(new Error('Connection refused'));
      } else {
        sendError(error);
      }
    });
  }

  login(url, username, password, callback) {
    this._request(
      {
        url: url,
        method: 'POST',
        uri: '/api/login',
        form: {
          username: username,
          password: password
        },
        timeout: 1000,
        returns: false
      },
      (body) => {
        this._loggedIn = true;
        this._url = url;
      },
      callback
    );
  }

  getMissions(callback) {
    this._request(
      {
        method: 'GET',
        uri: '/api/missions',
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  getMission(id, callback) {
    this._request(
      {
        method: 'GET',
        uri: '/api/missions/' + id.toString(),
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  getObstacles(callback) {
    this._request(
      {
        method: 'GET',
        uri: '/api/obstacles',
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  postTelemetry(telemetry, callback) {
    let keys = Object.keys(telemetry);
    let standardKeys = Object.keys(STANDARD_TELEMETRY);

    if (keys.length > standardKeys.length) {
      callback(Error('Telemetry contains too many keys'));
      return;
    }

    for (let i = 0; i < standardKeys.length; i++) {
      if (!telemetry.hasOwnProperty(standardKeys[i])) {
        callback(
          new Error("Telemetry is missing key '" + standardKeys[i] + "'")
        );
        return;
      } else if (
        typeof telemetry[standardKeys[i]] !==
        STANDARD_TELEMETRY[standardKeys[i]]
      ) {
        callback(new Error("key '" + standardKeys[i] + "' is the wrong type"));
        return;
      }
    }

    this._request(
      {
        method: 'POST',
        uri: '/api/telemetry',
        form: telemetry,
        returns: false
      },
      callback
    );
  }

  postTarget(target, callback) {
    let keys = Object.keys(target);
    let standardKeys = Object.keys(STANDARD_TARGETS);

    for (let i = 0; i < keys.length; i++) {
      if (!STANDARD_TARGETS.hasOwnProperty(keys[i])) {
        callback(
          new Error("Target contains extra key '" + keys[i] + "'"),
          null
        );
        return;
      } else if (typeof target[keys[i]] !== STANDARD_TARGETS[keys[i]]) {
        callback(new Error("key '" + keys[i] + "' is the wrong type"));
        return;
      }
    }

    this._request(
      {
        method: 'POST',
        uri: '/api/targets',
        json: target,
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  getTargets(callback) {
    this._request(
      {
        method: 'GET',
        uri: '/api/targets',
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  getTarget(id, callback) {
    this._request(
      {
        method: 'GET',
        uri: '/api/targets/' + id.toString(),
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  putTarget(id, target, callback) {
    let keys = Object.keys(target);
    let standardKeys = Object.keys(STANDARD_TARGETS);

    for (let i = 0; i < keys.length; i++) {
      if (!STANDARD_TARGETS.hasOwnProperty(keys[i])) {
        callback(
          new Error("Target contains extra key '" + keys[i] + "'"),
          null
        );
        return;
      } else if (typeof target[keys[i]] !== STANDARD_TARGETS[keys[i]]) {
        callback(new Error("key '" + keys[i] + "' is the wrong type"));
        return;
      }
    }

    this._request(
      {
        method: 'PUT',
        uri: '/api/targets/' + id.toString(),
        json: target,
        returns: true
      },
      (body) => {
        return this._convertToObject(body);
      },
      callback
    );
  }

  deleteTarget(id, callback) {
    this._request(
      {
        method: 'DELETE',
        uri: '/api/targets/' + id.toString(),
        returns: true
      },
      callback
    );
  }

  postTargetImage(id, imageBase64, callback) {
    let image = Buffer.from(imageBase64, 'base64');

    this._request(
      {
        method: 'POST',
        uri: '/api/targets/' + id.toString() + '/image',
        headers: {
          'content-type': 'image/png'
        },
        body: image,
        returns: false
      },
      callback
    );
  }

  getTargetImage(id, callback) {
    this._request(
      {
        method: 'GET',
        uri: '/api/targets/' + id.toString() + '/image',
        returns: true
      },
      (body) => {
        // FIXME: Decode image back to base64
        // return Buffer.from(body,'binary').toString('base64');
        return body;
      },
      callback
    );
  }

  putTargetImage(id, imageBase64, callback) {
    let image = Buffer.from(imageBase64, 'base64');

    this._request(
      {
        method: 'PUT',
        uri: '/api/targets/' + id.toString() + '/image',
        headers: {
          'content-type': 'image/png'
        },
        body: image,
        returns: false
      },
      callback
    );
  }

  deleteTargetImage(id, callback) {
    this._request(
      {
        method: 'DELETE',
        uri: '/api/targets/' + id.toString() + '/image',
        returns: false
      },
      callback
    );
  }

  _convertToObject(string) {
    return typeof string !== 'object' ? JSON.parse(string) : string;
  }
}

module.exports = AUVSIClient;
