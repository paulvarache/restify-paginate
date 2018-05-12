var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    server;

describe('Paginate module with default options', function () {
    const baseUrl = 'http://localhost';
    const basePort = 3333;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server));

        server.get('/test', function (req, res, next) {
            res.paginate.addLinks(303);
            res.send("OK");
        });

        server.listen(basePort, done);

    });

    it('should add the link header with the right last and next links', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql(`<${baseUri}/test?page=7>; rel="last", <${baseUri}/test?page=2>; rel="next"`);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
    it('should add the link header with the right last, next, prev and first links', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=4',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql(`<${baseUri}/test?page=1>; rel="first", <${baseUri}/test?page=3>; rel="prev", <${baseUri}/test?page=7>; rel="last", <${baseUri}/test?page=5>; rel="next"`);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});

describe('Paginate module without hostnames', function () {
    const baseUrl = 'http://localhost';
    const basePort = 7777;
    const baseUri = `${baseUrl}:${basePort}/`;
    before(function (done) {
        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server, {
            hostname: false
        }));

        server.get('/test', function (req, res, next) {
            res.paginate.addLinks(303);
            res.send("OK");
        });

        server.listen(basePort, done);

    });

    it('should add the link header with the right last and next links', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql('</test?page=7>; rel="last", </test?page=2>; rel="next"');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});

describe('The paginate object added to the request object', function (done) {
    var testServer;

    const baseUrl = 'http://localhost';
    const basePort = 9999;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        testServer = restify.createServer({
            name: 'test'
        });

        testServer.use(restify.queryParser());

        testServer.use(paginate(testServer));

        testServer.listen(basePort, done);
    });

    it('should contain a page and per_page object', function (done) {
        testServer.get('/object-test', function (req, res, next) {
            try {
                req.paginate.should.have.property('page');
                req.paginate.should.have.property('per_page');

                done();
            } catch (e) {
                done(e);
            }
        });

        request({
            baseUrl: baseUri,
            uri: 'object-test'
        });
    });

    it('should cast page and per_page to number, if they\'re URL params', function (done) {
        testServer.get('/type-test', function (req, res, next) {
            try {
                req.paginate.page.should.be.a.Number();
                req.paginate.per_page.should.be.a.Number();

                done();
            } catch (e) {
                done(e);
            }
        });

        request({
            baseUrl: baseUri,
            uri: 'type-test?page=2&per_page=2'
        });
    });
});
