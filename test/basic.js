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
