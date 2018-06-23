const defaultApp = require('./defaultApp')
const db = defaultApp.app.firestore();
const requestIp = require('request-ip');
const app = (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  const ip = requestIp.getClientIp(req);
  if (ip === '35.237.201.211') {   
    const docRef = db.collection('posts').doc(req.body.permlink);
    
    docRef
      .get()
      .then(doc => {
        if (doc.exists) {
          docRef.set(req.body, { merge: true});
          res.end();
          return void 0;
        } else {
          console.log('No such document', req.body.permlink);
          res.end();
          return void 0;
        }
      })
      .catch(error => {
        console.log(error);
      });
    res.status(200).send('OK')
    res.end()
    return void 0;
   
  } else {
    res.status(403)
    res.end()
    return void 0;
  }

   
    
    
  


}
module.exports = {
  app
}