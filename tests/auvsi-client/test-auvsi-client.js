'use strict';

/**
 * Test suite for core/net/auvsi-client:AUVSIClient.
 *
 * Mocha and Docker are required for the suite to run. A testing
 * AUVSI Competition Server will be hosted on port 8080 for the
 * duration of the testing.
 *
 * Some tests are dependent on tests before. Assumptions are made
 * that tests before changed the status of the server. The suite
 * will bail if a test fails.
 *
 * @example <caption>Example use in terminal</caption>
 * mocha run test-auvsi-client.js
 */

const assert = require('assert');

describe('AUVSIClient', function () {
    const AUVSIClient = require('../../core/net/auvsi-client');
    const fork = require('child_process').fork;

    this.bail(true);

    before(function (done) {
        this.timeout(0);

        const spawn = require('child_process').spawnSync;
        const request = require('request');

        let docker = spawn('docker', ['rm', 'test-auvsi', '-f']);
        docker = spawn('docker', ['run', '-d', '-i', '-t', '-p', '8080:80',
                '--name', 'test-auvsi', 'auvsisuas/interop-server']);

        if (docker.stderr.toString()) {
            throw Error('Could not start docker server: ' +
                    docker.stderr.toString());
        }

        let connect = () => {
            (new Promise((resolve, reject) => {
                let options = {
                    url: 'http://localhost:8080/api/login',
                    form: {
                        username: '',
                        password: ''
                    }
                }

                request.post(options, (error, response, body) => {
                    if (!error && response.statusCode === 400) {
                        resolve();
                    } else {
                        reject();
                    }
                });
            })).then(() => {
                done();
            }, () => {
                setTimeout(connect, 1000);
            });
        };

        connect();
    });

    after(function () {
        this.timeout(0);

        const spawn = require('child_process').spawnSync;

        let docker = spawn('docker', ['rm', 'test-auvsi', '-f']);

        if (docker.stderr.toString()) {
            throw Error('Could not stop docker server: ' +
                    docker.stderr.toString());
        }
    });

    describe('#login()', function () {
        it('should return an error if URL is invalid', function (done) {
            let client = new AUVSIClient();

            client.login('invalid url', '', '', (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Invalid URL');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            let client = new AUVSIClient();

            client.login('http://localhost:8001', '', '', (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        })

        it('should return an error if username and password are invalid',
                function (done) {
            let client = new AUVSIClient();

            client.login('http://localhost:8080', 'wronguser', 'wrongpass',
                    (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Invalid login');

                done();
            });
        });

        it('should return null with valid URL and default user credentials',
                function (done) {
            let client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    done);
        });

        it('should return null with valid URL and default admin credentials',
                function (done) {
            let client = new AUVSIClient();

            client.login('http://localhost:8080', 'testadmin', 'testpass',
                    done);
        });
    });

    describe('#getMissions()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        })

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.getMissions((error, missions) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.getMissions((error, missions) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return a list with one mission', function (done) {
            client.getMissions((error, missions) => {
                assert.ifError(error);
                assert.strictEqual(missions.length, 1);
                assert.equal(missions[0].hasOwnProperty('mission_waypoints'),
                        true);

                done();
            });
        });
    });

    describe('#getMission()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        })

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.getMission(1, (error, mission) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.getMission(1, (error, mission) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return a mission with id 1', function (done) {
            client.getMission(1, (error, mission) => {
                assert.ifError(error);
                assert.strictEqual(mission.id, 1);
                assert.strictEqual(mission.hasOwnProperty('mission_waypoints'),
                        true);

                done();
            });
        });
    });

    describe('#getObstacles()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.getObstacles((error, obstacles) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.getObstacles((error, obstacles) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return a set of obstacles', function (done) {
            client.getObstacles((error, obstacles) => {
                assert.ifError(error);
                assert.equal(obstacles.hasOwnProperty('stationary_obstacles'),
                        true);

                done();
            });
        });
    });

    describe('#postTelemetry()', function () {
        let client;
        let telemetry;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                telemetry = {
                    latitude: 12.123456789,
                    longitude: 12.123456789,
                    altitude_msl: 12.123456789,
                    uas_heading: 12.123456789
                }

                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.postTelemetry(telemetry, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.postTelemetry(telemetry, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return an error if telemetry is missing keys',
                function (done) {
            delete telemetry.latitude;

            client.postTelemetry(telemetry, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'Telemetry is missing key \'latitude\'');

                done();
            });
        });

        it('should return an error if telemetry has extra keys',
                function (done) {
            telemetry.extra = 0;

            client.postTelemetry(telemetry, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'Telemetry contains too many keys');

                done();
            });
        });

        it('should return an error if telemetry has a key of the wrong type',
                function (done) {
            telemetry.latitude = 'string';

            client.postTelemetry(telemetry, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'key \'latitude\' is the wrong type');

                done();
            });
        });

        it('should return null with valid telemetry', function (done) {
            client.postTelemetry(telemetry, done);
        });
    });

    describe('#postTarget()', function () {
        let client;
        let target;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                target = {
                    type: 'standard',
                    latitude: 12.23456789,
                    longitude: 12.23456789,
                    orientation: 'n',
                    shape: 'square',
                    background_color: 'blue',
                    alphanumeric: 'A',
                    alphanumeric_color: 'white',
                    description: 'desc',
                    autonomous: true
                }

                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.postTarget(target, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.postTarget(target, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return an error if target has extra keys', function (done) {
            target.extra = 0;

            client.postTarget(target, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'Target contains extra key \'extra\'');

                done();
            });
        });

        it('should return an error if target has a key of the wrong type',
                function (done) {
            target.description = 0;

            client.postTarget(target, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'key \'description\' is the wrong type');

                done();
            });
        });

        it('should return a target if target is missing keys',
                function (done) {
            delete target.description;

            client.postTarget(target, (error, target) => {
                assert.ifError(error);
                assert.equal(target.hasOwnProperty('description'), true);

                done();
            });
        });

        it('should return a target with valid target', function (done) {
            client.postTarget(target, (error, target) => {
                assert.ifError(error);
                assert.equal(target.hasOwnProperty('description'), true);

                done();
            });
        });
    });

    describe('#getTargets()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.getTargets((error, targets) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.getTargets((error, targets) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return a list with two targets', function (done) {
            client.getTargets((error, targets) => {
                assert.ifError(error);

                assert.strictEqual(targets.length, 2);
                assert.equal(targets[0].hasOwnProperty('description'), true);

                done();
            });
        });
    });

    describe('#getTarget()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.getTarget(1, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.getTarget(1, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return a target with id 1', function (done) {
            client.getTarget(1, (error, target) => {
                assert.ifError(error);
                assert.strictEqual(target.id, 1);
                assert.strictEqual(target.hasOwnProperty('description'), true);

                done();
            });
        });
    });

    describe('#putTarget()', function () {
        let client;
        let target;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                target = {
                    type: 'standard',
                    latitude: 12.23456789,
                    longitude: 12.23456789,
                    orientation: 'n',
                    shape: 'square',
                    background_color: 'blue',
                    alphanumeric: 'A',
                    alphanumeric_color: 'white',
                    description: 'desc',
                    autonomous: true
                }

                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.putTarget(1, target, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.putTarget(1, target, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return an error if target has extra keys', function (done) {
            target.extra = 0;

            client.putTarget(1, target, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'Target contains extra key \'extra\'');

                done();
            });
        });

        it('should return an error if target has a key of the wrong type',
                function (done) {
            target.description = 0;

            client.putTarget(1, target, (error, target) => {
                assert.ok(error);
                assert.strictEqual(error.message,
                        'key \'description\' is the wrong type');

                done();
            });
        });

        it('should return a target if target is missing keys',
                function (done) {
            delete target.description;

            client.putTarget(1, target, (error, target) => {
                assert.ifError(error);
                assert.strictEqual(target.id, 1);
                assert.equal(target.hasOwnProperty('description'), true);

                done();
            });
        });

        it('should return a target with valid target', function (done) {
            client.putTarget(1, target, (error, target) => {
                assert.ifError(error);
                assert.strictEqual(target.id, 1);
                assert.equal(target.hasOwnProperty('description'), true);

                done();
            });
        });
    });

    describe('#deleteTarget()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.deleteTarget(1, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.deleteTarget(1, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return null with id 1', function (done) {
            client.deleteTarget(1, done);
        });
    });

    describe('#postTargetImage()', function () {
        let client;
        let image;

        beforeEach(function (done) {
            const fs = require('fs');

            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });

            image = Buffer.from(
                    fs.readFileSync(__dirname + '/test-image-1.png'))
                    .toString('base64');
        })

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.postTargetImage(2, image, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.postTargetImage(2, image, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return null with id 2 and valid base 64 png',
                function (done) {
            client.postTargetImage(2, image, done);
        });
    });

    describe('#getTargetImage()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.getTargetImage(2, (error, image) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.getTargetImage(2, (error, image) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return a valid base 64 png with id 2', function (done) {
            const fs = require('fs');

            client.getTargetImage(2, (error, image) => {
                assert.ifError(error);
                assert.strictEqual(image, Buffer.from(
                    fs.readFileSync(__dirname + '/test-image-1.png'))
                    .toString('base64'));

                done()
            });
        });
    });

    describe('#putTargetImage()', function () {
        let client;
        let image;

        beforeEach(function (done) {
            const fs = require('fs');

            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });

            image = Buffer.from(
                    fs.readFileSync(__dirname + '/test-image-2.png'))
                    .toString('base64');
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.putTargetImage(2, image, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.putTargetImage(2, image, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return null with id 2 and valid base 64 png',
                function (done) {
            client.putTargetImage(2, image, done);
        });
    });

    describe('#deleteTargetImage()', function () {
        let client;

        beforeEach(function (done) {
            client = new AUVSIClient();

            client.login('http://localhost:8080', 'testuser', 'testpass',
                    (error) => {
                done();
            });
        });

        it('should return an error if not logged in', function (done) {
            client = new AUVSIClient();

            client.deleteTargetImage(2, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Not logged in');

                done();
            });
        });

        it('should return an error if connection is refused', function (done) {
            client._url = 'http://localhost:8001';

            client.deleteTargetImage(2, (error) => {
                assert.ok(error);
                assert.strictEqual(error.message, 'Connection refused');

                done();
            });
        });

        it('should return null with id 2', function (done) {
            client.deleteTargetImage(2, done);
        });
    });
});
