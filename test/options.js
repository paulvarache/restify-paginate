var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    server;

describe('Paginate module with `page` key overridden', function () {
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

        server.listen(5555, done);

    });

    it('should add to the response the `pages` key', function (done) {
        request({
            uri: 'http://localhost:5555/test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql('<http://localhost:5555/test?page=6>; rel="last", <http://localhost:5555/test?page=1>; rel="next"');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});

describe('Paginate module with `per_page` key overridden', function () {
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

        server.listen(6666, done);

    });

    it('should add to the response the `pages` key', function (done) {
        request({
            uri: 'http://localhost:6666/test',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql('<http://localhost:6666/test?page=16>; rel="last", <http://localhost:6666/test?page=2>; rel="next"');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should add the per_page from the original url', function (done) {
        request({
            uri: 'http://localhost:6666/test?per_page=30',
            resolveWithFullResponse: true
        }).then(function (res) {
            res.headers.link.should.be.eql('<http://localhost:6666/test?per_page=30&page=11>; rel="last", <http://localhost:6666/test?per_page=30&page=2>; rel="next"');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});
