
const cors = require('cors')({origin: 'https://steemblr.com',  optionsSuccessStatus: 200});
const defaultApp = require('./defaultApp')


const app = (req, res) => {
  cors(req, res, () => {  
  const uuid = req.query.uuid;
  defaultApp.app.auth().createCustomToken(uuid).then((customToken) => {
      const token = {
        token: customToken
      };
      res.status(200).send(token);
      res.end()
      return void 0;
    }).catch(e => {
      console.log(e)
    });
  })
};

module.exports = {
  app
}
