const axios = require('axios')
const url = 'http://localhost:5000/steemblr/us-central1/deletePost'

const deletePost = async (permlink) => {  
  axios.post(url, {permlink})
    .then(function(response){
    }).catch(e => {
        console.log(e)
    });
  return void 0; 
  
}
module.exports = {
  deletePost
}