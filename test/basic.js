var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    server;

describe('Paginate module with default options', function () {
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

        server.listen(3333, done);

    });

    it('should add the link header with the right last and next links', function (done) {
        request({
            uri: 'http://localhost:3333/test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql('<http://localhost:3333/test?page=7>; rel="last", <http://localhost:3333/test?page=2>; rel="next"');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
    it('should add the link header with the right last, next, prev and first links', function (done) {
        request({
            uri: 'http://localhost:3333/test?page=4',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql('<http://localhost:3333/test?page=1>; rel="first", <http://localhost:3333/test?page=3>; rel="prev", <http://localhost:3333/test?page=7>; rel="last", <http://localhost:3333/test?page=5>; rel="next"');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});

describe('Paginate module without hostnames', function () {
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

        server.listen(7777, done);

    });

    it('should add the link header with the right last and next links', function (done) {
        request({
            uri: 'http://localhost:7777/test',
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

    before(function (done) {
        testServer = restify.createServer({
            name: 'test'
        });

        testServer.use(restify.queryParser());

        testServer.use(paginate(testServer));

        testServer.listen(9999, done);
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
            uri: 'http://localhost:9999/object-test'
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
            uri: 'http://localhost:9999/type-test?page=2&per_page=2'
        });
    });
});
