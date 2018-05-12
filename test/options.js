var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    server;

describe('Paginate module with `page` key overridden', function () {
    const baseUrl = 'http://localhost';
    const basePort = 5555;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server, {
            defaults: {
                page: 0
            }
        }));

        server.get('/test', function (req, res, next) {
            res.paginate.addLinks(303);
            res.send("OK");
        });

        server.listen(basePort, done);

    });

    it('should add to the response the `pages` key', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql(`<${baseUri}/test?page=6>; rel="last", <${baseUri}/test?page=1>; rel="next"`);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});

describe('Paginate module with `per_page` key overridden', function () {
    const baseUrl = 'http://localhost';
    const basePort = 6666;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server, {
            defaults: {
                per_page: 20
            }
        }));

        server.get('/test', function (req, res, next) {
            res.paginate.addLinks(303);
            res.send("OK");
        });

        server.listen(basePort, done);

    });

    it('should add to the response the `pages` key', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql(`<${baseUri}/test?page=16>; rel="last", <${baseUri}/test?page=2>; rel="next"`);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should add the per_page from the original url', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?per_page=30',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql(`<${baseUri}/test?per_page=30&page=11>; rel="last", <${baseUri}/test?per_page=30&page=2>; rel="next"`);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});
