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
            page: parseInt(req.params[opts.paramsNames.page]) || defaults.defaults.page,
            per_page: parseInt(req.params[opts.paramsNames.per_page]) || defaults.defaults.per_page,
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
            baseUrl += req.headers.host.replace(/\/$/, '') + '/';
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
         * @param  {Integer} [count]    The total number of elements to paginate. If no count is provided, no last page is added
         * @return {Object}             A Hash like object with the links name as key and links as values
         */
        paginate.getLinks = function (count) {
            var links = {};

            if (opts.numbersOnly) {
                // The current page is not the first one so we generate the first and prev links
                if (page !== defaults.defaults.page) {
                    links.prev = page - 1;
                    links.first = defaults.defaults.page;
                }
                if (count !== undefined && page * per_page < count) {
                    links.last = Math.floor(count / per_page) + defaults.defaults.page;
                }
                if (count === undefined || page * per_page < count) {
                    links.next = page + 1;
                }

                return links;
            }

            // The current page is not the first one so we generate the first and prev links
            if (page !== defaults.defaults.page) {
                params.page = defaults.defaults.page;
                links.first = baseUrl + server.router.render(req.route.name, params, params);

                params.page = page - 1;
                links.prev = baseUrl + server.router.render(req.route.name, params, params);
            }
            if (count !== undefined && page * per_page < count) {
                params.page = count % per_page === 0 ? count / per_page : Math.floor(count / per_page + defaults.defaults.page);
                links.last = baseUrl + server.router.render(req.route.name, params, params);
            }
            if (count === undefined || page * per_page < count) {
                params.page = page + 1;
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

        /**
         * Generates a response, containing the given data and links to the other pages
         * @param  {Array<Object>} data     an array of Objects
         * @param  {Integer} [count]        the total count of data. If count is not provided, the link to the last page won't be generated
         * @return {Object}                 an Object containing the data, and links to the other pages
         */
        paginate.getResponse = function (data, count) {
            return {
                data: data,
                pages: res.paginate.getLinks(count)
            };
        };

        /**
         * Generates a paginated response. The data will be paginated, and links to the other pages will be generated
         * @param  {Array<Object>}  an array of Objects, to be paginated
         * @return {Object}         an Object containing the paginated data, and links to the other pages
         */
        paginate.getPaginatedResponse = function (data, count) {
            var index = (page - 1) * per_page;

            if(data.length <= index || page <= 0) {
                return {
                    error: 'page ' + page + ' not found'
                };
            }

            return paginate.getResponse(data.slice(index, index + per_page), data.length);
        };

        /**
         * Sends a response, generated by the getResponse() method
         * @param  {Array<Object>} data     an array of Objects, to be paginated
         * @param  {Integer} [count]        the total count of data. If count is not provided, the link to the last page won't be generated
         */
        paginate.send = function (data, count) {
            res.send(paginate.getResponse(data, count));
        };

        /**
         * Sends a paginated response, generated by the getPaginatedResponse() method
         * @param  {Array<Object>} data     an array of Objects, to be paginated
         */
        paginate.sendPaginated = function (data) {
            var paginatedResponse = paginate.getPaginatedResponse(data);

            if(paginatedResponse.error) {
                res.status(404);
            }
            res.send(paginatedResponse);
        };

        res.paginate = paginate;
        next();
    };
};
