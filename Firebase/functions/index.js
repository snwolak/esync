const functions = require('firebase-functions');
const admin = require("firebase-admin");
const steem = requrie('steem')
const serviceAccount = require('./serviceAccount.json')
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send(200);

});