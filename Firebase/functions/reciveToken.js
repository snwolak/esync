
const cors = require('cors')({origin: 'https://steemblr.com',  optionsSuccessStatus: 200});
const defaultApp = require('./defaultApp')


const app = (req, res) => {
  cors(req, res, () => {
    console.log(req.headers.host)
  if(req.hostname === 'us-central1-steemblr.cloudfunctions.net') {

  
  const uuid = req.query.uuid;
  defaultApp.app.auth().createCustomToken(uuid).then((customToken) => {
      const token = {
        token: customToken,
        url: req.hostname
      };
      res.status(200).send(token);
      res.end()
      return void 0;
    }).catch(e => {
      console.log(e)
    });
  } 
    else if(req.hostname !== 'us-central1-steemblr.cloudfunctions.net'){
      res.status(403)
      res.end()
    }
  
  })

};

module.exports = {
  app
}
