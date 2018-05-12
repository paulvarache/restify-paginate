var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    server;

describe('Paginate module with number only', function () {
    const baseUrl = 'http://localhost';
    const basePort = 4444;
    const baseUri = `${baseUrl}:${basePort}/`;
    before(function (done) {
        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server, {
            numbersOnly: true
        }));

        server.get('/test', function (req, res, next) {
            var pages = res.paginate.getLinks(303);
            res.send({
                pages: pages,
                data: "OK"
            });
        });

        server.listen(basePort, done);

    });

    it('should add to the response the `pages` key', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test',
            json: true
        }).then(function (res) {
            should.exist(res.pages);
            res.pages.next.should.be.eql(2);
            res.pages.last.should.be.eql(7);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
    it('should add to the response the `pages` key and should contain the first and prev keys', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=2',
            json: true
        }).then(function (res) {
            should.exist(res.pages);
            res.pages.first.should.be.eql(1);
            res.pages.prev.should.be.eql(1);
            res.pages.next.should.be.eql(3);
            res.pages.last.should.be.eql(7);
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});
