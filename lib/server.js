/*
*
* This is main Server file
*
*/

// Dependencies
var http = require('http');
var https = require('https');
var fs = require('fs');
var config = require('./config');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var helpers = require('./helpers');
var handlers = require('./handlers');
// Dependencies


// Container for all server variables
var server = {};

// Define the HTTP server
server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
});

// Define the HTTPS Server Options
server.httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};


// Define the HTTPS Server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res);
});


server.init = function(){

    // Start the HTTP Server
    server.httpServer.listen(config.httpPort, function(){
        console.log("The HTTP Port is currently running on : ", config.httpPort);
    });

    // Start the HTTPS Server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log("The HTTPS Port is currently running on : ", config.httpsPort);
    });
};

server.unifiedServer = function(req, res){

    // Parse the URL
    var parsedUrl = url.parse(req.url, true);

    // Get the Path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    //console.log("Headers : ", JSON.stringify(headers));

    // Get the payload,if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function(data) {
        buffer += decoder.write(data);
    });


    req.on('end', function(){

        buffer += decoder.end();

        // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        //console.log("Data : ", JSON.stringify(data));

        // Route the request to the chosen handler specified in router
        chosenHandler(data, function(statusCode, payload){

            // Use the status code returned from the handler, or default to status code 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload returned from the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            // Return the response
            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        });        
        
    });

};


// Define the router object
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'menu' : handlers.menu,
    'cart' : handlers.cart,
    'checkout' : handlers.checkout
};




// Export the server module
module.exports = server;