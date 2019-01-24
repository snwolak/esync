const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount-dev.json");
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://steemblr-dev.firebaseio.com"'
});


module.exports = {
  app
}