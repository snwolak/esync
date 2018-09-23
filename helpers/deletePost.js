const axios = require('axios')
const url = 'http://localhost:5000/steemblr/us-central1/deletePost'

const deletePost = async (author, permlink) => {  
  axios.post(url, {author, permlink})
    .then(function(response){
    }).catch(e => {
        console.log(e)
    });
  return void 0; 
  
}
module.exports = {
  deletePost
}