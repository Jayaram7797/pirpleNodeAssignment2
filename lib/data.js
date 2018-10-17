/*
 * Library for storing and editing Data i.e. to create, read, update and delete the data.
 * Data will be stored as JSON objects in the .data folder under the respective folders like users, tokens and others.
 */

 //Dependencies will go here
 var fs = require('fs'); //this is needed to carry out all the read and write operations
 var path = require('path'); //this is needed to get the proper file path for the data storage and editing.
 var helpers = require('./helpers');



 //Instantiate the Container for the module to be exported.
 var lib = {};

 //base directory of the data folder
 lib.baseDir = path.join(__dirname, '/../.data/');
 
 //Function to create the data entries.
 lib.create = function(dir, file, data, callback){


 	//opening the file in 'wx' mode will give an error if the specified file already exists.
 	fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
 		if(!err && fileDescriptor){

 			//Assuming the data to be a json object, we need to stringify the json content before saving it into the file
 			var stringData = JSON.stringify(data);

 			//Write the stringified data into the file.
 			fs.writeFile(fileDescriptor, stringData, function(err){
 				if(!err){

 					//once successfully written the data into the file its time to close the file.
 					fs.close(fileDescriptor, function(err){
 						if(!err){

 							callback(false);

 						}else{
 							callback('Error while trying to close the file');
 						}
 					});

 				}else{
 					callback('Error while writing data into file.');
 				}
 			});

 		}else{
 			callback('Could not create the new file, it may already exist');
 		}
 	});

 };


 //Function to read the data from a file
 lib.read = function(dir, file, callback){
 	fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', function(err, data){
 		if(!err && data){
 			var parsedData = helpers.parseJsonToObject(data);
 			callback(false, parsedData);
 		}else{
 			callback(err, data);
 		}
 		
 	});
 };

 
 //Function to Update an existing File
 lib.update = function(dir, file, data, callback){
 	fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err, fileDescriptor){
 		if(!err && fileDescriptor){

 			//Convert the data to string
 			var stringData = JSON.stringify(data);

 			//Truncate the file if there is any existing data
 			fs.truncate(fileDescriptor, function(err){
 				if(!err){
 					//Write to file and close it
 					fs.writeFile(fileDescriptor, stringData, function(err){
 						if(!err){

 							//Close the file
 							fs.close(fileDescriptor, function(err){
 								if(!err){
 									callback(false);
 								}else{
 									callback('Error closing existing file');
 								}
 							});

 						}else{
 							callback('Error Wtiting to an existing file');
 						}
 					});
 				}else{
 					callback('Error Truncating the file');
 				}
 			});

 		}else{
 			callback('Could not open the file for updating, it may not exist yet');
 		}
 	});
 };

 //Function to Delete an existing file
 lib.delete = function(dir, file, callback){

 	//Unlink the file
 	fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
 		if(!err){
 			callback(false);
 		}else{
 			callback('Error unlinking an existing file');
 		}
 	});
 };


 // List all the files in a directory
 lib.list = function(dir, callback){
 	fs.readdir(lib.baseDir+dir+'/', function(err, data){
 		if(!err && data && data.length > 0){
 			var trimmedFileNames = [];
 			data.forEach(function(fileName){
 				trimmedFileNames.push(fileName.replace('.json', ''));
 			});
 			callback(false, trimmedFileNames);
 		}else{
 			callback(err, data);
 		}
 	});
 };


 //export the container
 module.exports = lib;