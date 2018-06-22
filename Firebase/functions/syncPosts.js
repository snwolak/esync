const cors = require('cors')({origin: true, optionsSuccessStatus: 200});
const defaultApp = require('./defaultApp')
const db = defaultApp.app.firestore();

const app = (req, res) => {
  cors(req, res, () => {
  res.status(200).send("OK")
  const docRef = db.collection('posts').doc(req.body.permlink);
  docRef.set(req.body, { merge: true});
  
  
  res.end()
  return void 0;
})
}
module.exports = {
  app
}