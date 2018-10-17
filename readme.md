# Node JS Master class - Homework Assignment : 2

## OVERVIEW
* New Users can create account with email, name, street address, password, tosagreement
* Users can login and logout by creating token valid for 1 hour (which can also be extended)
* When a user is logged in he can get the menu(hard coded) with valid token
* User can add, modify and delete items (from Pizza menu) with valid token
* User/ Customer can checkout the final list of items by paying with credit card using the stripe APIs
* Once the payment is successful customer will receive a confirmation mail of the same to his email id
* Order details will be added to user's history object with corresponding chargeId and timestamp.
* Cart will be made empty for future use.




## USERS

### POST
* POST method of users handler to create new users
* required fields - name, email, address, password, tosAgreement (in body)
* optional fields - none
* Create an empty cart json the moment user creates an account
* Create an empty history json the moment user creates an account

### GET
* GET method of users handler to get the user data i.e. equivalent to profile page.
* required fields - email (in querystring), tokenid (in headers)
* optional fields - none
* Only authorised (logged in) users can get their data and no one else's data

### PUT
* PUT method of users handler to update user data
* required fields - email (in body), tokenid (in headers)
* optional fields - name , address, password (at least one of them is mandatory)
* Only authorised (logged in) users can update their data and no one else's data

### DELETE
* DELETE method of users handler to delete the user
* required fields - email(in querystring), tokenid (headers)
* optional fields - none
* Delete all the related data like cart, history associated with the user etc..



## TOKENS

### POST
* POST method of tokens to create a new token to login
* Required fields - email, password (in body)
* Optional fields - none

### GET
* GET method of tokens to get the token data
* Required fields - tokenid (in headers)
* Optional fields - none

### PUT
* PUT is maily to update especially the expiry time
* Required fields - tokenid, extend - boolean (in body)
* Optional fields - none

### DELETE
* DELETE is equivalent to logging out
* Required fields - tokenId (querystring)
* Optional data - none



## MENU

### GET
* Menu - GET
* Required Fields - tokenid (headers)
* Optional Fields - none



## CART

### POST
* POST method to add to cart
* Required fields : id (item id), count ( in body);  tokenid (headers)
* Optional fields : none

### GET
* GET method is to see the list of all items added to the cart
* Required fields : tokenid (headers)
* Optional fields : none

### PUT
* PUT method is mainly to update the items and their count already added to the cart
* Required fields : item id, count (in body) ; tokenid (headers)
* Optional fields : none

### DELETE
* DELETE method is to completely delete an item from the cart
* Required fields : item id (body); tokenid (headers)
* Optional fields : none



## CHECKOUT

### POST
* Checkout - POST
* Required Fields - tokenid (headers); nameOnCard, creditCardNumber, exp_month, exp_year, cvv (body)
* Optional Fields - none




## NOTE :- 

### Checkout Implementation
* Generate stripeToken using the user's  credentials like card details.
* Once stripeToken is generated we have the option of saving the customer credentials or just proceeding ahead with charging.
* In case if we want to save customer credentials we have to generate stripeCustomerToken and use the same for future usage.
* Use the stipeToken generated to charge the customer.
* Once customer is charged successfully, email the order confirmation to user's mail id using mailgun.(We can also use stripe to email the receipt to user by passing 'receipt_email' parameter while cherging)
* Update the payment history of the user
* Clear the shopping cart.

### Clear Expired tokens
* All the expired token files are cleared using a workers file.