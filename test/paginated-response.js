var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    url = require('url'),
    testData = [],
    server;

describe('The getPaginatedResponse() function', function () {
    const baseUrl = 'http://localhost';
    const basePort = 3434;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        for (var i = 0; i < 100; i++) {
            // generate random string
            testData[i] = Math.random().toString(36).substring(8);
        }

        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server));

        server.get('/test', function (req, res, next) {
            res.paginate.sendPaginated(testData);
        });

        server.listen(basePort, done);
    });

    it('should return the paginated data', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=5&per_page=2',
            json: true
        }).then(function (res) {
            res.data.should.be.eql(testData.slice(8, 10));
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should return the pages', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=5&per_page=2',
            json: true
        }).then(function (res) {
            res.pages.should.have.property('prev');
            res.pages.should.have.property('next');
            res.pages.should.have.property('first');
            res.pages.should.have.property('last');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should return status 404 in case the page is out of range', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=500&per_page=10',
            json: true
        }).then(function (res) {
            var error = 'did not return 404!';
            console.log(error);
            done(error);
        }, function (err) {
            err.statusCode.should.equal(404);
            done();
        });
    });
});

describe('The getResponse() function', function () {
    const baseUrl = 'http://localhost';
    const basePort = 4343;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        for (var i = 0; i < 5; i++) {
            // generate random string
            testData[i] = Math.random().toString(36).substring(8);
        }

        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server));

        server.get('/test', function (req, res, next) {
            res.paginate.send(testData, 100);
        });
        server.get('/test-no-count', function (req, res, next) {
            res.paginate.send(testData);
        });

        server.listen(4343, done);
    });

    it('should return the data', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=5&per_page=5',
            json: true
        }).then(function (res) {
            res.data.should.be.eql(testData);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should return the pages', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=5&per_page=5',
            json: true
        }).then(function (res) {
            res.pages.should.have.property('prev');
            res.pages.should.have.property('next');
            res.pages.should.have.property('first');
            res.pages.should.have.property('last');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should not return the last page, if count hasn\'t been provided', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test-no-count?page=5&per_page=5',
            json: true
        }).then(function (res) {
            res.pages.should.have.property('prev');
            res.pages.should.have.property('next');
            res.pages.should.have.property('first');
            res.pages.should.not.have.property('last');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});