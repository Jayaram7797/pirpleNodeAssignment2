/*
 * Primary file for API
 *
 */

 // Dependencies
 var server = require('./lib/server');
 var workers = require('./lib/workers');

 

 // Declare the app
 var app = {};

 // Instantiate the app
 app.init = function(){
    // Start the server
    server.init();

    // Start the workers
    workers.init();

 };



 // Self Executing 
 app.init();


 // Export the app
 module.exports = app;