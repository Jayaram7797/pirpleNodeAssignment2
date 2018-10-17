/*
*
* This is the main Handlers file
*
*/

// Dependencies
var _helpers = require('./helpers');
var _data = require('./data');



// Container for the handlers module
var handlers = {};

// Users handler
handlers.users = function(data, callback){
	// Define acceptable methods
	var acceptableMethods = ['post', 'get', 'put', 'delete'];

	// Check if the request method is among the acceptable methods
	if(acceptableMethods.indexOf(data.method) > -1){
		// One of acceptable methods
		handlers._users[data.method](data, callback);
	}else{
		// Not among the acceptable methods
		callback(405, {'Error' : 'Invalid method of request'});
	}
};


handlers._users = {};


// POST method of users handler to create new users
// required fields - name, email, address, password, tosAgreement
// optional fields - none
// Create an empty cart json the moment user creates an account
// Create an empty history json the moment user creates an account
handlers._users.post = function(data, callback){

	//Check that all required fields are filled out
	var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.payload.email.trim()) ? data.payload.email.trim() : false;
	var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

	if(name && email && address && password && tosAgreement){

		// Validate Password
		if(_helpers.validatePassword(password)){

			var hashedPassword = _helpers.hash(password);

			if(hashedPassword){

				var userObject = {
					'name' : name,
					'email' : email,
					'address' : address,
					'hashedPassword' : hashedPassword,
					'tosAgreement' : true
				};

				_data.create('users', email, userObject, function(err){
					if(!err){

						_data.create('cart', email, [], function(err){
							if(!err){
								_data.create('history', email, [], function(err){
									if(!err){
										callback(200, {'Success' : 'User created successfully'});
									}else{
										callback(500, {'Error' : 'Could not create a new user\'s history object.'});
									}
								});
							}else{
								callback(500, {'Error' : 'Could not create a new user\'s cart object.'});
							}
						});					

					}else{
						callback(500, {'Error' : 'Could not create a new user, the email id provided might have already been registered.'});
					}
				});


			}else{
				console.log("Error hashing the user\'s password");
				callback(500, {'Error' : 'Could not hash user\'s password'});
			}

		}else{
			callback(400, {'Error' : 'Password has to be Minimum 8 characters, and must contain one Uppercase, one Lowercase, one Special charecter and one number'});
		}
		

	}else{
		callback(400, {'Error' : 'Missing required fields or Invalid format of the input fields'});
	}

};



// GET method of users handler to get the user data
// required fields - email, token
// optional fields - none
handlers._users.get = function(data, callback){

	//Check that all required fields are filled out
	var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.queryStringObject.email.trim()) ? data.queryStringObject.email.trim() : false;
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;

	if(email && tokenId){

		// Verfy the token ID
		handlers._tokens.verifyToken(tokenId, email, function(tokenIsValid){
			if(tokenIsValid){

				_data.read('users', email, function(err, userObject){
					if(!err && userObject){					

						delete userObject.hashedPassword;
						callback(200, userObject);										

					}else{
						callback(404);
					}
				});

			}else{
				callback(400, {'Error' : 'Missing token in the headers, or invalid token'})
			}
		});		

	}else{
		callback(400, {'Error' : 'Missing required fields or Invalid format of the input fields'});
	}

};



// PUT method of users handler to update user data
// required fields - email, token
// optional fields - name , address, password (at least one of them)
handlers._users.put = function(data, callback){

	//Check that all required fields are filled out
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.payload.email.trim()) ? data.payload.email.trim() : false;

	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;

	// Sanity check the optional fields	
	var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
	var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

	if(email && tokenId){

		if(name || address || password){

			// Verfy the token ID
			handlers._tokens.verifyToken(tokenId, email, function(tokenIsValid){
				if(tokenIsValid){

					// Lookup for the user
					_data.read('users', email, function(err, userObject){
						if(!err && userObject){

							if(name){
								userObject.name = name;
							}
							if(address){
								userObject.address = address;
							}
							if(password){
								var hashedPassword = _helpers.hash(password);
								if(hashedPassword){
									userObject.hashedPassword = hashedPassword;
								}else{
									console.log("Error hasing the user\'s password");
								}
							}

							// Store the updated user's data
							_data.update('users', email, userObject, function(err){
								if(!err){

									callback(200, {'Success' : 'Successfully updated users data'});

								}else{
									callback(500, {'Error' : 'Could not update the user\'s data'});
								}
							});

						}else{
							callback(404);
						}
					});

				}else{
					callback(400, {'Error' : 'Missing token in the headers, or invalid token'})
				}
			});					

		}else{

			callback(400, {'Error' : 'Missing optinal fields. One of the optional fields is mandatory for this operation'});
		}

	}else{
		callback(400, {'Error' : 'Missing required field'});
	}
	

};



// DELETE method of users handler to delete the user
// required fields - email, tokenid
// optional fields - none
// Delete all the related data like tokens, orders etc..
handlers._users.delete = function(data, callback){

	//Check that all required fields are filled out
	var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.queryStringObject.email.trim()) ? data.queryStringObject.email.trim() : false;
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;

	if(email && tokenId){


		// Verfy the token ID
		handlers._tokens.verifyToken(tokenId, email, function(tokenIsValid){
			if(tokenIsValid){

				// Delete user
				_data.delete('users', email, function(err){
					if(!err){

						// Delete cart object
						_data.delete('cart', email, function(err){
							if(!err){

								// Delete history object
								_data.delete('cart', email, function(err){
									if(!err){

										callback(200, {'Success' : 'Successfully deleted the users data.'});

									}else{
										callback(500, {'Error' : 'Could not delete user\'s account'});
									}
								});

							}else{
								callback(500, {'Error' : 'Could not delete user\'s account'});
							}
						});

					}else{
						callback(500, {'Error' : 'Could not delete user\'s account'});
					}
				});

			}else{
				callback(400, {'Error' : 'Missing token in the headers, or invalid token'})
			}
		});
		

	}else{
		callback(400, {'Error' : 'Missing required fields or Invalid format of the input fields'});
	}

};




// Tokens handler
handlers.tokens = function(data, callback){
	//Define the acceptable request methods
	var acceptableMethods = ['post', 'get', 'put', 'delete'];

	//Check if the request method is among the acceptable methods
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._tokens[data.method](data, callback);
	}else{		
		callback(405);
	}
}


// Container for all the tokens methods
handlers._tokens = {};


// Tokens - post
// Required fields - email, password
// Optional fields - none
handlers._tokens.post = function(data, callback){
	// Check Email and Password
	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.payload.email.trim()) ? data.payload.email.trim() : false;
	var password = typeof(data.payload.password)=='string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
	
	if(email && password && _helpers.validatePassword(password)){

		// Lookup for the user with given email
		_data.read('users', email, function(err, userData){
			if(!err && userData){
				// Hash the sent password, and compare it with the stored password
				var hashedPassword = _helpers.hash(password);

				if(hashedPassword == userData.hashedPassword){
					// If Valid, create a new token with a random name. Set an expiration date 1 hour in the future
					var tokenId = _helpers.createRandomString(20);
					var expires = Date.now() + 1000 * 60 * 60;

					var tokenObject = {
						'email' : email,
						'tokenId' : tokenId,
						'expires' : expires
					};

					// Store the token
					_data.create('tokens', tokenId, tokenObject, function(err){
						if(!err){
							callback(200, tokenObject);
						}else{
							callback(500, {'Error' : 'Could not create new token'});
						}
					});

				}else{
					callback(400, {'Error' : 'Password did not match the specified user\'s already stored password'});
				}

			}else{
				callback(400, {'Error' : 'Could not find the specified user'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields'});
	}

};


// Tokens - get
// Required fields - tokenId
// Optional fields - none
handlers._tokens.get = function(data, callback){
	//Will use queryStringObject to get the id
	var tokenId = typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20 ? data.queryStringObject.tokenId.trim() : false;

	if(tokenId){

		// Lookup the token
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				callback(200, tokenData);
			}else{
				callback(404, {'Error' : 'Specified token does not exist'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields'});
	}
	
};


// Tokens - put : this is maily to update especially the expiry time
// Required fields - tokenId, extend
// Optional fields - none
handlers._tokens.put = function(data, callback){
	// Check that all required fields have been filled
	var tokenId = typeof(data.payload.tokenId) == 'string' && data.payload.tokenId.trim().length == 20 ? data.payload.tokenId.trim() : false;
	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
	if(tokenId && extend){
		// Lookup for the tokenId
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				// Check the expiry of the token, extend the expiry only if it is still not expired
				//console.log("Expiry : ", tokenData.expires);
				//console.log("Now : ", Date.now());

				if(tokenData.expires > Date.now()){
					// Set the expiration time an hour from now
					tokenData.expires = Date.now() + 1000 * 60 * 60 ;

					// Update the token data
					_data.update('tokens', tokenId, tokenData, function(err){
						if(!err){
							console.log("Successfully updated");
							callback(200, tokenData);
						}else{
							callback(500, {'Error' : 'Could not update the token\'s expiration'});
						}
					});

				}else{
					callback(400, {'Error' : 'The specified token has already expired'});
				}

			}else{
				callback(400, {'Error' : 'The specified user can not be found'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields'});
	}
	
};


// Tokens - delete : this is equivalent to logging out
// Required fields - tokenId
// Optional data - none
handlers._tokens.delete = function(data, callback){
	//Will use queryStringObject to get the id
	var tokenId = typeof(data.queryStringObject.tokenId) == 'string' && data.queryStringObject.tokenId.trim().length == 20 ? data.queryStringObject.tokenId.trim() : false;

	if(tokenId){

		// Lookup the token
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				// Delete the token
				_data.delete('tokens', tokenId, function(err){
					if(!err){
						callback(200);
					}else{
						callback(500, {'Error' : 'Could not delete the specified token'});
					}
				});
			}else{
				callback(404, {'Error' : 'Specified token does not exist'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields'});
	}
	
};



// Verify if a given tokenId is currently valid for a given user
handlers._tokens.verifyToken = function(tokenId, email, callback){
	// Lookup the token
	_data.read('tokens', tokenId, function(err, tokenData){
		if(!err && tokenData){
			// Check that the token is for the given user and has not expired
			if(tokenData.email == email && tokenData.expires > Date.now()){
				callback(true);
			}else{
				callback(false);
			}
		}else{
			callback(false);
		}
	});
};


// Verify if a given tokenId is currently valid for a given user
handlers._tokens.checkExpiry = function(tokenId, callback){
	// Lookup the token
	_data.read('tokens', tokenId, function(err, tokenData){
		if(!err && tokenData){
			// Check that the token is for the given user and has not expired
			if(tokenData.expires > Date.now()){
				callback(true);
			}else{
				callback(false);
			}
		}else{
			callback(false);
		}
	});
};



// Tokens handler
handlers.menu = function(data, callback){
	//Define the acceptable request methods
	var acceptableMethods = ['get'];

	//Check if the request method is among the acceptable methods
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._menu[data.method](data, callback);
	}else{		
		callback(405);
	}
}


// Container for all the menu methods
handlers._menu = {};


// Menu - GET
// Required Fields - Valid token Id
// Optional Fields - none
handlers._menu.get = function(data, callback){
	// Sanity Check the token Id
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;


	console.log("Token ID : ", tokenId);

	if(tokenId){

		// Lookup for the token data
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){

				// Check if the token is still valid
				if(tokenData.expires > Date.now()){

					// Get the Menu data
					_data.read('menu', 'pizza', function(err, menuData){
						if(!err && menuData){

							callback(200, menuData);

						}else{
							callback(500, {'Error' : 'Could not fetch the menu data'});
						}
					});

				}else{
					callback(400, {'Error' : 'The specified token is already expired'});
				}

			}else{
				callback(404);
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields, or invalid fields.'})
	}

};





// Cart handler
/*
* User should be able to Add items with count, maximum 5 for any item for logistics convinience.
* User should be able to Delete (Reduce Count) items.
* User should be able to see (Get) all Cart Items at one go along with the count and total cost.
* User should be able to checkout all the cart items at one go after paying.
*/
handlers.cart = function(data, callback){
	// Define acceptable methods
	var acceptableMethods = ['post', 'get', 'put', 'delete'];

	// Check if the request method is among the acceptable methods
	if(acceptableMethods.indexOf(data.method) > -1){
		// One of acceptable methods
		handlers._cart[data.method](data, callback);
	}else{
		// Not among the acceptable methods
		callback(405, {'Error' : 'Invalid method of request'});
	}
};


// Container for all cart methods
handlers._cart = {};


// Cart - POST method
// Required fields : item id, count, tokenId
// Optional fields : none
handlers._cart.post = function(data, callback){
	// Sanity check the token id
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;

	// Sanity check the items data
	var id = typeof(data.payload.id) == 'number' && data.payload.id % 1 === 0 && data.payload.id > 10000 && data.payload.id <= 10008 ? data.payload.id : false ;
	var count = typeof(data.payload.count) == 'number' && data.payload.count % 1 === 0 && data.payload.count > 0 && data.payload.count <= 5 ? data.payload.count : false ;

	if(id && count && tokenId){

		// Get the user's email from the tokenData
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				if(tokenData.expires > Date.now()){

					// Get the menu data 
					_data.read('menu', 'pizza', function(err, menuData){
						if(!err && menuData){

							//console.log("Menu : ", JSON.stringify(menuData));
							var index = id - 10001;
							var item = menuData[index];

							// Check if the cart json already exists, if it does append the new order to existing cart.
							_data.read('cart', tokenData.email, function(err, cartData){
								if(!err && cartData){
									var cartEntry = {
										'id' : item.id,
										'title' : item.title,
										'description' : item.description,
										'price' : item.price,
										'count' : count
									};

									cartData[index] = cartEntry;

									// Update the cart 
									_data.update('cart', tokenData.email, cartData, function(err){
										if(!err){
											callback(200, {'Success' : 'Successfully added preferences to cart'});
										}else{
											callback(500, {'Error' : 'Could not update the cart.'});
										}
									});


								}else{
									callback(500, {'Error' : 'Could not find the cart object.'});
								}

							});

						}else{
							callback(500, {'Error' : 'Error getting the menu data'});
						}
					});


				}else{
					callback(400, {'Error' : 'The specified token is already expired'});
				}

			}else{
				callback(400, {'Error' : 'The specified token does not exist'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing or Invalid required fileds'});
	}
};



// Cart - GET method
// Required fields : tokenId
// Optional fields : none
handlers._cart.get = function(data, callback){

	// Sanity check the token id
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;


	if(tokenId){

		// Get the user's email from the tokenData
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				if(tokenData.expires > Date.now()){

					// Check if the cart json already exists, if it does append the new order to existing cart.
					_data.read('cart', tokenData.email, function(err, cartData){
						if(!err && cartData){

							var nonEmptyCartData = [];
							var totalPrice = 0;							
							for(var i = 0; i < cartData.length ; i++){

								var item = cartData[i];
								if(item != null){
									totalPrice += (item.price * item.count);
									nonEmptyCartData.push(item);
								}
								if(i+1 == cartData.length){
									var outputCartData = {
										'totalPrice' : totalPrice,
										'cart' : nonEmptyCartData
									};
									callback(200, outputCartData);
								}

							}
							

						}else{
							callback(500, {'Error' : 'Could not find the cart object.'});
						}

					});				


				}else{
					callback(400, {'Error' : 'The specified token is already expired'});
				}

			}else{
				callback(400, {'Error' : 'The specified token does not exist'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing or Invalid required fileds'});
	}
};



// Cart - PUT method
// Required fields : item id, count, tokenId
// Optional fields : none
handlers._cart.put = function(data, callback){
	// Sanity check the token id
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;

	// Sanity check the items data
	var id = typeof(data.payload.id) == 'number' && data.payload.id % 1 === 0 && data.payload.id > 10000 && data.payload.id <= 10008 ? data.payload.id : false ;
	var count = typeof(data.payload.count) == 'number' && data.payload.count % 1 === 0 && data.payload.count > 0 && data.payload.count <= 5 ? data.payload.count : false ;

	if(id && count && tokenId){

		// Get the user's email from the tokenData
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				if(tokenData.expires > Date.now()){

					// Get the menu data 
					_data.read('menu', 'pizza', function(err, menuData){
						if(!err && menuData){

							//console.log("Menu : ", JSON.stringify(menuData));
							var index = id - 10001;
							var item = menuData[index];

							// Check if the cart json already exists, if it does append the new order to existing cart.
							_data.read('cart', tokenData.email, function(err, cartData){
								if(!err && cartData){
									var cartEntry = {
										'id' : item.id,
										'title' : item.title,
										'description' : item.description,
										'price' : item.price,
										'count' : count
									};

									cartData[index] = cartEntry;

									// Update the cart 
									_data.update('cart', tokenData.email, cartData, function(err){
										if(!err){
											callback(200, {'Success' : 'Successfully updated the cart'});
										}else{
											callback(500, {'Error' : 'Could not update the cart.'});
										}
									});


								}else{
									callback(500, {'Error' : 'Could not find the cart object.'});
								}

							});

						}else{
							callback(500, {'Error' : 'Error getting the menu data'});
						}
					});


				}else{
					callback(400, {'Error' : 'The specified token is already expired'});
				}

			}else{
				callback(400, {'Error' : 'The specified token does not exist'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing or Invalid required fileds'});
	}
};



// Cart - DELETE method
// Required fields : item id, tokenId
// Optional fields : none
handlers._cart.delete = function(data, callback){

	// Sanity check the token id
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;

	// Sanity check the items data
	var id = typeof(data.payload.id) == 'number' && data.payload.id % 1 === 0 && data.payload.id > 10000 && data.payload.id <= 10008 ? data.payload.id : false ;

	if(id && tokenId){

		// Get the user's email from the tokenData
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){
				if(tokenData.expires > Date.now()){

					var index = id - 10001;

					// Make the entry corresponding to entry null
					_data.read('cart', tokenData.email, function(err, cartData){
						if(!err && cartData){
							var cartEntry = null;

							cartData[index] = cartEntry;

							// Update the cart 
							_data.update('cart', tokenData.email, cartData, function(err){
								if(!err){
									callback(200, {'Success' : 'Successfully Deleted the item cart'});
								}else{
									callback(500, {'Error' : 'Could not update the cart.'});
								}
							});


						}else{
							callback(500, {'Error' : 'Could not find the cart object.'});
						}

					});				


				}else{
					callback(400, {'Error' : 'The specified token is already expired'});
				}

			}else{
				callback(400, {'Error' : 'The specified token does not exist'});
			}
		});

	}else{
		callback(400, {'Error' : 'Missing or Invalid required fileds'});
	}

};





// Checkout handler
handlers.checkout = function(data, callback){
	//Define the acceptable request methods
	var acceptableMethods = ['post'];

	//Check if the request method is among the acceptable methods
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._checkout[data.method](data, callback);
	}else{		
		callback(405);
	}
}


// Container for all the menu methods
handlers._checkout = {};


// Checkout - POST
// Required Fields - Valid token Id
// Optional Fields - none
// Generate stripeToken using the user's  credentials like card details.
// Once stripeToken is generated we have the option of saving the customer credentials or just proceeding ahead with charging.
// In case if we want to save customer credentials we have to generate stripeCustomerToken and use the same for future usage.
// Use the stipeToken generated to charge the customer.
// Once customer is charged successfully, email the order confirmation to user's mail id using mailgun.(We can also use stripe to email the receipt to user by passing 'receipt_email' parameter while cherging)
// Update the payment history of the user
// Clear the shopping cart.
handlers._checkout.post = function(data, callback){

	// Sanity Check the token Id
	var tokenId = typeof(data.headers.tokenid) == 'string' && data.headers.tokenid.trim().length == 20 ? data.headers.tokenid.trim() : false;


	// Assuming that the customer passes the credentials and that we don't save the customers data in stipe.
	var nameOnCard = typeof(data.payload.nameOnCard) == 'string' && data.payload.nameOnCard.trim().length > 0 ? data.payload.nameOnCard.trim() : false;

	var creditCardNumber = typeof(data.payload.creditCardNumber) == 'string' && data.payload.creditCardNumber.trim().length > 0 && data.payload.creditCardNumber.match(/^\d+$/) ? data.payload.creditCardNumber.trim() : false;

    var exp_month = typeof(data.payload.exp_month) == 'number' && data.payload.exp_month > 0 && data.payload.exp_month < 13 ? data.payload.exp_month : false;

    var exp_year = typeof(data.payload.exp_year) == 'number' && data.payload.exp_year >=2018 && data.payload.exp_year < 2030 ? data.payload.exp_year : false;
    
    var cvc = typeof(data.payload.cvc) == 'number' && data.payload.cvc >= 0 && data.payload.cvc <= 999 ? data.payload.cvc : false;


	//console.log("Token ID : ", tokenId);

	if(tokenId && nameOnCard && creditCardNumber && exp_month && exp_year && cvc){

		// Lookup for the token data
		_data.read('tokens', tokenId, function(err, tokenData){
			if(!err && tokenData){

				// Check if the token is still valid
				if(tokenData.expires > Date.now()){

					// Get the Menu data
					_data.read('cart', tokenData.email, function(err, cartData){
						if(!err && cartData){

							if(cartData.length > 0){

								var totalPrice = 0;							
								for(var i = 0; i < cartData.length ; i++){

									var item = cartData[i];

									if(item != null){
										totalPrice += (item.price * item.count);					
									}
									if(i+1 == cartData.length){
										if(totalPrice > 0){

											_helpers.generateStripeToken(nameOnCard, creditCardNumber, exp_month, exp_year, cvc, function(err, stripeToken){
												if(!err && stripeToken){

													// Use the stripe token obtained to charge the customer.

													_helpers.chargeUsingStripe(totalPrice, 'usd', 'Pizza by '+nameOnCard, stripeToken, function(err, chargeId){

														if(!err && chargeId){

															// Construct the order object
															var orderDetails = {
																'cart' : cartData,
																'totalPrice' : totalPrice,
																'chargeId' : chargeId,
																'timestamp' : Date.now()
															};

															// Time to send the mail to the user
															_helpers.mailgun(tokenData.email, 'Pizza payment', 'Successfully paid : '+totalPrice, function(err){
																if(!err){

																	// Get the old payment history
																	_data.read('history', tokenData.email, function(err, historyData){
																		if(!err && historyData){

																			historyData = typeof(historyData) == 'object' && historyData instanceof Array ? historyData : [];

																			historyData.push(orderDetails);

																			// Update the history object
																			_data.update('history', tokenData.email, historyData, function(err){
																				if(!err){
																					
																					// Empty the cart object
																					_data.update('cart', tokenData.email, [], function(err){
																						if(!err){
																							callback(200, {'Success' : 'Successfully placed the order'});
																						}else{
																							callback(500, {'Error' : 'Error clearing the cart'});
																						}
																					});

																				}else{
																					console.log('Error Updating the customer\'s history : ', err);
																					callback(500, {'Error' : 'Error Updating the customer\'s history : '+err});
																				}
																			});


																		}else{

																			console.log('Error Opening the customer\'s history : ', err);
																			callback(500, {'Error' : 'Error opening customer\'s history '+err});
																		}
																	});
																	

																}else{
																	console.log('Error mailing the customer : ', err);
																	callback(500, {'Error' : 'Error mailing the customer '+err});
																}
															});


														}else{
															console.log('Error charging the customer : ', err);
															callback(500, {'Error' : 'Error charging the customer '+err});
														}

													});

												}else{

													console.log('Error generating stripe token : ', err);
													callback(500, {'Error' : 'Error generating stripe token '+err});
												}
											});


										}else{
											callback(400, {'Error' : 'The cart is empty.'});
										}
									}
								}

							}else{
								callback(400, {'Error' : 'The cart is empty.'});
							}								

						}else{
							callback(500, {'Error' : 'Could not fetch the cart data'});
						}
					});

				}else{
					callback(400, {'Error' : 'The specified token is already expired'});
				}

			}else{
				callback(404);
			}
		});

	}else{
		callback(400, {'Error' : 'Missing required fields, or invalid fields.'})
	}

};





// Ping handler
handlers.ping = function(data,callback){
    callback(200, {'Success' : 'Application is live and running'});
};

// Not-Found handler
handlers.notFound = function(data,callback){
  callback(404, {'Error' : 'Page Not Found.'});
};



// Export the module
module.exports = handlers;