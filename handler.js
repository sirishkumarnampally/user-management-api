'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const uuid = require('uuid/v4');

const usersTable = process.env.USERS_TABLE;

function response(statusCode, message){
  return{
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
      "Access-Control-Allow-Credentials" : true, // Required for cookies, authorization headers with HTTPS 
      'Access-Control-Allow-Methods' : '*', // Required for HTTP Methods 
      "Access-Control-Allow-Headers": "*" // Require to accept headers
    },
    body: JSON.stringify(message)
  };
}

function sortByDate(a,b){
  if(a.createdAt > b.createdAt){
    return -1;
  }else return 1;
}

// Create User
module.exports.createUser = (event, context, callback) => {

  const reqBody = JSON.parse(event.body);
  const user = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    userName: reqBody.userName,
    firstName: reqBody.firstName,
    lastName: reqBody.lastName,
    email: reqBody.email,
    phoneNumber: reqBody.phoneNumber
  };
  console.log(reqBody);
  console.log(user);
  return db.put({
    TableName: usersTable,
    Item: user
  }).promise().then(() => {
    callback(null, response(201, user))
  })
  .catch(err => callback(null, response(err.statusCode, err)));
}

// Get All Users
module.exports.getUsers = (event, context, callback) => {
  
  return db.scan({
    TableName: usersTable
  }).promise().then(res => {callback(null, response(200, res.Items.sort(sortByDate)))
  }).catch(err => callback(null, response(err.statusCode, err)));
}

//Get Single User
module.exports.getUser = (event, context, callback) => {
  
  const userName = event.pathParameters.userName;

  const params = {
    Key: {
      userName: userName
    },
    TableName: usersTable
  }
  return db.get(params).promise()
  .then(res => {
    if(res.Item) callback(null, response(200, res.Item))
    else callback(null, response(404, {error: 'User Not Found'}))
  })
  .catch(err => callback(null, response(err.statusCode, err)));
}

// Update the user
module.exports.updateUser = (event, context, callback) => {
  
  const userName = event.pathParameters.userName;
  const body = JSON.parse(event.body);

  const params = {
    Key: {
      userName: userName
    },
    TableName: usersTable,
    ConditionExpression: 'attribute_exists(userName)',
   // UpdateExpression: 'set ' + paramName + ' = :v',
    UpdateExpression: 'set firstName = :a, lastName = :b, email = :c, phoneNumber = :d',
    ExpressionAttributeValues: {
      ':a': body.firstName,
      ':b': body.lastName,
      ':c': body.email,
      ':d': body.phoneNumber
    },
    ReturnValues: 'ALL_NEW'
  };
  return db.update(params).promise()
  .then(res => {
    callback(null, response(200, res))
  })
  .catch(err => callback(null, response(err.statusCode, err)));
}


// Delete the user
module.exports.deleteUser = (event, context, callback) => {
  
  const userName = event.pathParameters.userName;
  const params = {
    Key: {
      userName: userName
    },
    TableName: usersTable
  };
  return db.delete(params).promise()
  .then(() => callback(null, response(200, {message: 'User Deleted Successfully'})))
  .catch(err => callback(null, response(err.statusCode, err)));
}