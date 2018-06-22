

const functions = require('firebase-functions');
const reciveToken = require('./reciveToken')
const syncPosts = require('./syncPosts')


exports.syncPosts = functions.https.onRequest(syncPosts.app);
exports.reciveToken = functions.https.onRequest(reciveToken.app);
