/*
*
* This is the main worker file
*
*/


// Dependencies 
var _data = require('./data');


// Dependencies

// Instantiate the workers object
var workers = {};


// Function to check and clear the expired token
workers.clearExpiredToken = function(token){

	// Get the token data
	_data.read('tokens', token, function(err, tokenData){
		if(!err && tokenData){

			if(tokenData.expires < Date.now()){

				// Delete the file corresponding to the given token
				_data.delete('tokens', token, function(err){
					if(!err){
						console.log("Successfully deleted the token file : "+token+".json");
					}else{
						console.log("Error deleting the token file : "+token+'.json : ', err);
					}
				});

			}

		}else{
			console.log("Error getting the token data : ", err);
		}
	});
};



// Funtion to get the list of tokens
workers.getTokens = function(){

	// Get the list of Token file names
	_data.list('tokens', function(err, tokenFiles){
		if(!err && tokenFiles){

			for(var i = 0; i < tokenFiles.length ; i++){

				workers.clearExpiredToken(tokenFiles[i]);
			}

		}else{
			console.log("Error getting the list of token files : ", err);
		}
	});
}


workers.tokenClearingLoop = function(){
	setInterval(function(){

		workers.getTokens();

	}, 1000 * 60 * 60 * 24);
};



// Instantiate workers object
workers.init = function(){

	// Send to console, in yellow
	console.log('\x1b[33m%s\x1b[0m', 'Background workers are running');

	// Call the token clearing function
	workers.getTokens();

	// Call the token clearing loop	
	workers.tokenClearingLoop();
};




// Export the workers Module
module.exports = workers;