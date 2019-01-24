const defaultApp = require('./defaultApp')
const db = defaultApp.app.firestore();
const sync = async (props) => {
    const data = props.post
    const docRef = db.collection('posts').doc(data.permlink);
    docRef
      .get()
      .then(doc => {
        if (doc.exists) {
          const post = doc.data()
          if(post.trending === true) {
            docRef.update(data);
            res.end();
            return void 0;
          } else {
            console.log("Trending:", data.rating, data.rating > 0.25 ? true : false)
            docRef.update(data);
            docRef.update({trending: data.rating > 0.25 ? true : false})
            res.end();
            return void 0;
          }
          
        } else {
          console.log('No such document', data.permlink);
          res.end();
          return void 0;
        }
      })
      .catch(error => {
        console.log(error);
      });
}

module.exports = {
  sync
}