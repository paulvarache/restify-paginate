var restify = require('restify'),
    should = require('should'),
    paginate = require('../'),
    request = require('request-promise'),
    url = require('url'),
    server;

describe('The getLinks() function', function () {
    const baseUrl = 'http://localhost';
    const basePort = 8888;
    const baseUri = `${baseUrl}:${basePort}/`;

    before(function (done) {
        server = restify.createServer({
            name: 'test'
        });

        server.use(restify.queryParser());

        server.use(paginate(server));

        server.get('/test', function (req, res, next) {
            res.send({
                pages: res.paginate.getLinks(10)
            });
        });
        server.get('/test-no-count', function (req, res, next) {
            res.send({
                pages: res.paginate.getLinks()
            });
        });

        server.listen(basePort, done);
    });

    it('should generate a prev, next, first and last page link, if count is provided', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=3&per_page=2',
            json: true
        }).then(function (res) {
            should.exist(res.pages);

            const prevUrl = Object.assign({}, url.parse(res.pages.prev, true).query);
            prevUrl.should.have.property('page', '2');

            const nextUrl = Object.assign({}, url.parse(res.pages.next, true).query);
            nextUrl.should.have.property('page', '4');

            const firstUrl = Object.assign({}, url.parse(res.pages.first, true).query);
            firstUrl.should.have.property('page', '1');

            const lastUrl = Object.assign({}, url.parse(res.pages.last, true).query);
            lastUrl.should.have.property('page', '5');

            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should generate a prev, next and first (but not last) page link, if count isn\'t provided', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test-no-count?testparam=test&page=3&per_page=2',
            json: true
        }).then(function (res) {
            const prevUrl = Object.assign({}, url.parse(res.pages.prev, true).query);
            prevUrl.should.have.property('page', '2');

            const nextUrl = Object.assign({}, url.parse(res.pages.next, true).query);
            nextUrl.should.have.property('page', '4');

            const firstUrl = Object.assign({}, url.parse(res.pages.first, true).query);
            firstUrl.should.have.property('page', '1');

            res.pages.should.not.have.property('last');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('should add the params of the initial request to the generated links, except for page', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?testparam=test&page=2&per_page=2',
            json: true
        }).then(function (res) {
            var nextLinkParams = Object.assign({}, url.parse(res.pages.next, true).query);
            nextLinkParams.should.have.property('testparam', 'test');
            nextLinkParams.should.have.property('per_page', '2');
            nextLinkParams.should.not.have.property('page', '2');
            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });

    it('shouldn\'t return an empty last page, in case count % per_page === 0', function (done) {
        request({
            baseUrl: baseUri,
            uri: 'test?page=2&per_page=2',
            json: true
        }).then(function (res) {
            var lastLinkParams = Object.assign({}, url.parse(res.pages.last, true).query);

            // the count is 10 and per_page is 2, therefore the last page should be 5
            lastLinkParams.should.have.property('page', '5');

            done();
        }, function (err) {
            console.log(err);
            done(err);
        });
    });
});