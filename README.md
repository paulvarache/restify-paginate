# restify-paginate
--------------------------

resitfy-paginate is a middleware that helps the navigation between pages.

When you have a very large set of results to display, you might want to divide it into pages. So when you ask for your resource, you get a portion of the result set aka a `page` and the possibility to get the other pages.

Now the question is: "I have my first page, how can I get to ther other ones ?".
The idea is to not send only the page itself but also the links to the others.

Let's say you get your resource from this URL: `http://api.mysite.com/api/myresource`, you will be able to get the different pages adding the `page` and `per_page` param e.g. `http://api.mysite.com/api/myresource?page=3&per_page=20`

This module processes the request params and generates the links to the first, previous, next and last pages of the result set.

By default this module will generate links like the github API c.f.  [Github Documentation](https://developer.github.com/guides/traversing-with-pagination/), the page count will start at 1 and the page size will be 50.

## Get the module

This module is registered on npm so you just need to get it doing:

```shell
npm install restify-paginate
```

## Using the module

First you require the module and then add it as one of your server middlewares.

*You have to give the restify server object to the paginate module*

```js
var restify = require('restify'),
    paginate = require('restify-paginate');

var server = restify.createServer({
        name: 'My API'
    });

server.use(restify.queryParser());
server.use(paginate(server));

```

This will process the `page` and `per_page` request params and add them in the request object under the `paginate` key.

Your request object will have something like this:

```json
    {
        params: {...},
        paginate: {
            page: 2,
            per_page: 30
        },
        ...
    }
```

So now you can use this information to make your database query

```js
    // SQL like query
    var query = 'SELECT * FROM my_table'
                + 'OFFSET ' + (req.paginate.page * req.paginate.per_page)
                + ' LIMIT ' + req.params.per_page;
    // Mongoose like query
    Potatoes.find()
            .offset(req.paginate.page * req.paginate.per_page)
            .limit(req.params.per_page);
```

It will also add a `paginate` object in the response object that contains two functions that can be used to either get the pages links or add them to the response headers.

You can now get your links based on the total count of your result set

```js
// Let's say your query would have returned 54356 results without the offset and limit clauses
var links = res.paginate.getLinks(54356);
```

This will give you:

```js
{
    next: 'http://api.myurl.com/myresource?page=2',
    last: 'http://api.myurl.com/myresource?page=1088',
}
```

Here the next page is the second one and the last is the 1088th one because you need to get to the 1088th page to get the last results.

The `first` and `prev` keys are not added since the page asked is the first one.

## Options

You can change this module behavior through some options by giving them to the paginate module.

```js
    var options = {...};
    server.use(paginate(server, options));
```

By default these options are:

```js
{
    paramsNames: {
        page: 'page',           // Page number param name
        per_page: 'per_page'    // Page size param name
    },
    defaults: {                 // Default values
        page: 1,
        per_page: 50
    },
    numbersOnly: false,         // Generates the full links or not
    hostname: true              // Adds the hostname in the links or not
}
```

### paramsName

You can choose the names of the request params for the page number and the page size.

So you can have URLs like this `http://api.mysite.com/resource?pageCount=2&pageSize=35` by setting the defaults options to:

```js
{
    page: 'pageCount',
    per_page: 'pageSize'
}
```

#### defaults

You can change the dafult values for the page number and the page size. If these informations are not provided in the request, these values will be used.

### numbersOnly

Indicates if the urls should be generated or if you only need the pages numbers. If set to true, the links will look like this:

```
{
    first: 1,
    prev: 2,
    next: 4,
    last: 57
}
```

### hostname

indicates if the hostname should be in the generated URLs. If set to false, the URLs will look like this `/myresource?page=2`

## Functions reference

### paginate(server, options)

Initialize the paginate module.

**params**:
- server: The restify server object
- options: Your custom options


### res.paginate.getLinks(count)

**params**:
- count: The total number of results

Returns an object containing the pages.

### res.paginate.addLinks(count)

**params**:
- count: The total number of results

Add a `Link` header to the response that contains the pages.
