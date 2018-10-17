/*
*
* This is the main config File
*/

// Container for all environments
var environments = {};

// Staging (Default) environment
environments.staging = {
	'httpPort' : 3000,
	'httpsPort' : 3001,
	'envName' : 'staging',
	'hashingSecret' : 'thisIsASecret',
	'stripe' : {
		'hostname' : 'api.stripe.com',
		'tokenPath' : '/v1/tokens',
		'chargePath' : '/v1/charges',
		'secretKey' : 'sk_test_....',
		'pubKey' : 'pk_test_....'
	},
	'mailgun' : {
		'domain' : 'sandbox....org',
		'apiKey' : 'apikey',
		'sender' : 'sender Mail id'
	}
};


// Production environment
environments.production = {
	'httpPort' : 5000,
	'httpsPort' : 5001,
	'envName' : 'production',
	'hashingSecret' : 'thisIsASecret',
	'stripe' : {
		'hostname' : 'api.stripe.com',
		'tokenPath' : '/v1/tokens',
		'chargePath' : '/v1/charges',
		'secretKey' : 'sk_test_......',
		'pubKey' : 'pk_test_......'
	},
	'mailgun' : {
		'domain' : 'sandbox....org',
		'apiKey' : 'apikey',
		'sender' : 'sender Mail id'
	}
};


// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;


// Export the environments module
module.exports = environmentToExport;