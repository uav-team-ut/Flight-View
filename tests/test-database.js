'use strict';

/**
 * Test suite for core/db/db.
 *
 * Mocha is required for the suite to run.
 *
 * @example <caption>Example use in terminal</caption>
 * mocha run test-database.js
 */

const assert = require('chai').assert;

describe('Database', function () {
    let Database;
    let Image;
    let Telemetry;
    let MapCacheImage;

    let db;

    beforeEach(function () {
        Database = require('../core/db');

        let flightViewTypes = require('../util/types');

        Image = flightViewTypes.Image;
        Telemetry = flightViewTypes.Telemetry;
        MapCacheImage = flightViewTypes.MapCacheImage;

        db = new Database(false);
    });

    afterEach(function (done) {
        setTimeout(done, 10);
    });

    describe('#telemetry', function () {
        it('should be a TelemetryDatastore', function () {
            assert.ok(db.telemetry);
        });
    });

    describe('TelemetryDatastore', function () {
        let t1;
        let t2;

        beforeEach(function () {
            t1 = new Telemetry({time: 10});
            t2 = new Telemetry({time: 20});
        });

        describe('#insert()', function () {
            it('should return an id with valid telemetry',
                    function (done) {
                db.telemetry.insert(t1).then((id) => {
                    assert.ok(id);

                    done();
                }).catch(done);
            });

            it('should auto-increment the document id', function (done) {
                db.telemetry.insert(t1).then((id) => {
                    assert.equal(id, '1');
                }).then(() => db.telemetry.insert(t2)).then((id) => {
                    assert.equal(id, '2');

                    done();
                }).catch(done);
            });
        });

        describe('#getNearest()', function () {
            beforeEach(function (done) {
                db.telemetry.insert(t1).then((id) => {
                    assert.equal(id, '1');
                }).then(() => db.telemetry.insert(t2)).then((id) => {
                    assert.equal(id, '2');

                    done();
                }).catch(done);
            });

            it('should return time 10 with input time 9', function (done) {
                db.telemetry.getNearest(9).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 10);

                    done();
                }).catch(done);
            });

            it('should return time 10 with input time 10', function (done) {
                db.telemetry.getNearest(10).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 10);

                    done();
                }).catch(done);
            });

            it('should return time 10 with input time 11', function (done) {
                db.telemetry.getNearest(11).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 10);

                    done();
                }).catch(done);
            });

            it('should return time 20 with input time 15', function (done) {
                db.telemetry.getNearest(15).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 20);

                    done();
                }).catch(done);
            });

            it('should return time 20 with input time 19', function (done) {
                db.telemetry.getNearest(19).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 20);

                    done();
                }).catch(done);
            });

            it('should return time 20 with input time 20', function (done) {
                db.telemetry.getNearest(20).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 20);

                    done();
                }).catch(done);
            });

            it('should return time 20 with input time 21', function (done) {
                db.telemetry.getNearest(21).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 20);

                    done();
                }).catch(done);
            });
        });

        describe('#getApprox()', function () {
            beforeEach(function (done) {
                db.telemetry.insert(t1).then((id) => {
                    assert.equal(id, '1');
                }).then(() => db.telemetry.insert(t2)).then((id) => {
                    assert.equal(id, '2');

                    done();
                }).catch(done);
            });

            it('should return time 10 with input time 9', function (done) {
                db.telemetry.getApprox(9).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 10);

                    done();
                }).catch(done);
            });

            it('should return time 10 with input time 10', function (done) {
                db.telemetry.getApprox(10).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 10);

                    done();
                }).catch(done);
            });

            it('should return time 11 with input time 11', function (done) {
                db.telemetry.getApprox(11).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 11);

                    done();
                }).catch(done);
            });

            it('should return time 15 with input time 15', function (done) {
                db.telemetry.getApprox(15).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 15);

                    done();
                }).catch(done);
            });

            it('should return time 19 with input time 19', function (done) {
                db.telemetry.getApprox(19).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 19);

                    done();
                }).catch(done);
            });

            it('should return time 20 with input time 20', function (done) {
                db.telemetry.getApprox(20).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 20);

                    done();
                }).catch(done);
            });

            it('should return time 20 with input time 21', function (done) {
                db.telemetry.getApprox(21).then((telemetry) => {
                    assert.equal(telemetry.time.seconds, 20);

                    done();
                }).catch(done);
            });
        });
    });

    describe('#images', function () {
        it('should be a ImageDatastore', function () {
            assert.ok(db.images);
        });
    });

    describe('ImageDatastore', function () {
        let i1;
        let i2;

        beforeEach(function () {
            i1 = new Image({time: 10});
            i2 = new Image({time: 20});
        });

        describe('#insert()', function () {
            it('should return an id with valid image', function (done) {
                db.images.insert(i1).then((id) => {
                    assert.ok(id);

                    done();
                }).catch(done);
            });

            it('should auto-increment the document id', function (done) {
                db.images.insert(i1).then((id) => {
                    assert.equal(id, '1');
                }).then(() => db.images.insert(i1)).then((id) => {
                    assert.equal(id, '2');

                    done();
                }).catch(done);
            });
        });
    });

    describe('#mapCache', function () {
        it('should be a MapCacheDatastore', function () {
            assert.ok(db.mapCache);
        });
    });

    describe('MapCacheDatastore', function () {
        let i1;
        let i2;
        let i3;

        beforeEach(function () {
            i1 = new MapCacheImage({time: 10});
            i2 = new MapCacheImage({time: 20});
            i3 = new MapCacheImage({time: 30});

            db.mapCache.clear();
        });

        after(function (done) {
            let db = new Database();

            db.mapCache.clear();

            setTimeout(done, 10);
        });

        describe('#insert()', function () {
            it('should return an id with valid map cache image',
                    function (done) {
                db.mapCache.insert(i1).then((id) => {
                    assert.ok(id);

                    done();
                }).catch(done);
            });
        });

        describe('#getImages()', function () {
            it('should return an empty list when the datastore is empty',
                    function (done) {
                db.mapCache.getImages().then((images) => {
                    assert.deepEqual(images, []);

                    done();
                }).catch(done);
            });

            it('should return a list with length 1 when the datastore has 1',
                    function (done) {
                db.mapCache.insert(i1).then((id) => db.mapCache.getImages())
                    .then((images) => {
                        assert.equal(images.length, 1);

                        done();
                    }).catch(done);
            });

            it('should return a list with length 2 when the datastore has 2',
                    function (done) {
                db.mapCache.insert(i1)
                    .then((id) => db.mapCache.insert(i2))
                    .then((id) => db.mapCache.getImages())
                    .then((images) => {
                        assert.equal(images.length, 2);

                        done();
                    }).catch(done);
            });

            it('should sort the map cache images by time', function (done) {
                db.mapCache.insert(i1)
                    .then((id) => db.mapCache.insert(i3))
                    .then((id) => db.mapCache.insert(i2))
                    .then((id) => db.mapCache.getImages())
                    .then((images) => {
                        assert.deepEqual(images, [i1, i2, i3]);

                        done();
                    }).catch(done);
            });
        });
    });
});
