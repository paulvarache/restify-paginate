var extend = require('extend');

module.exports = function (server, opts) {
    var defaults = {
        paramsNames: {
            page: 'page',
            per_page: 'per_page'
        },
        defaults: {
            page: 1,
            per_page: 50
        },
        numbersOnly: false,
        hostname: true
    };
    opts = extend(true, defaults, opts);
    return function (req, res, next) {
        req.paginate = {
            page: req.params[opts.paramsNames.page] || defaults.defaults.page,
            per_page: req.params[opts.paramsNames.per_page] || defaults.defaults.per_page,
        };

        var isPerPageSet = typeof req.params[opts.paramsNames.per_page] !== 'undefined';

        delete req.params[opts.paramsNames.page];
        delete req.params[opts.paramsNames.per_page];

        var page = req.paginate.page,
            per_page = req.paginate.per_page,
            params = {},
            baseUrl = '';

        if (opts.hostname) {
            baseUrl = req.connection.encrypted ? 'https://' : 'http://';
            baseUrl += req.headers.host;
        }

        // Copy the params object
        extend(params, req.params);

        // Add per_page param to params obejct in case it's been set originally
        if (isPerPageSet) {
            params[opts.paramsNames.per_page] = per_page;
        }

        var paginate = {};

        /**
         * Generates the first, prev, next, last links
         * @param  {Integer} count  The total number of elements to paginate
         * @return {Object}         A Hash like object with the links name as key and links as values
         */
        paginate.getLinks = function (count) {
            var links = {};

            if (opts.numbersOnly) {
                // The current page is not the first one so we generate the first and prev links
                if (parseInt(page) !== defaults.defaults.page) {
                    links.prev = parseInt(page) - 1;
                    links.first = defaults.defaults.page;
                }
                if ((page) * per_page < count) {
                    links.last = Math.floor(count / per_page) + defaults.defaults.page;
                    links.next = parseInt(page) + 1;
                }
                return links;
            }

            // The current page is not the first one so we generate the first and prev links
            if (parseInt(page) !== defaults.defaults.page) {

                params.page = defaults.defaults.page;
                links.first = baseUrl + server.router.render(req.route.name, params, params);

                params.page = parseInt(page) - 1;
                links.prev = baseUrl + server.router.render(req.route.name, params, params);
            }
            if ((page) * per_page < count) {

                params.page = count % per_page === 0 ? count / per_page : Math.floor(count / per_page + defaults.defaults.page);
                links.last = baseUrl + server.router.render(req.route.name, params, params);

                params.page = parseInt(page) + 1;
                links.next = baseUrl + server.router.render(req.route.name, params, params);
            }
            return links;
        };

        /**
         * Generates the first, prev, next, last links
         * @param  {Integer}    count  The total number of elements to paginate
         * @return {undefined}
         */
        paginate.addLinks = function generateLinks (count) {
            var links = paginate.getLinks(count);
            links = Object.keys(links).map(function (key) {
                return '<' + links[key] + '>; rel="' + key + '"';
            });
            res.header('Link', links.join(', '));
        };
        res.paginate = paginate;
        next();
    };
};
