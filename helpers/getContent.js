const steem = require('steem');
const axios = require('axios')
const url = 'https://us-central1-steemblr.cloudfunctions.net/syncPosts'
const getContent = async (author, permlink) => {
  let bucket = [];
  
  await steem.api
  .getContentAsync(
    author, permlink
  )
  .then(result => {
    bucket.push(result)
  
    return bucket[0];
  })
  .catch(function(error) {
    console.log(error);
  });
  if(bucket[0].parent_author === "") {
    axios.post(url, bucket[0])
    .then(function(response){
    }).catch(e => {
      console.log(e)
    });
  }
  
  return void 0; 
}
module.exports = {
  getContent
}