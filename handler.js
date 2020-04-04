'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const uuid = require('uuid/v4');

const usersTable = process.env.USERS_TABLE;

function response(statusCode, message){
  return{
    statusCode: statusCode,
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
    title: reqBody.title,
    userName: reqBody.userName,
    body: reqBody.body
  };
  return db.put({
    TableName: usersTable,
    Item: user
  }).promise().then(() => {
    callback(null, response(201, user))
  })
  .catch(err => response(null, response(err.statusCode, err)));
}

// Get All Users
module.exports.getUsers = (event, context, callback) => {
  return db.scan({
    TableName: usersTable
  }).promise().then(res => {callback(null, response(200, res.Items.sort(sortByDate)))
  }).catch(err => response(null, response(err.statusCode, err)));
}