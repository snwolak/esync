const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://steemblr.firebaseio.com"'
});


module.exports = {
  app
}