const steem = require('steem');
const axios = require('axios')
const checkPostsValue = require('./checkPostsValue')
const url = 'https://us-central1-steemblr.cloudfunctions.net/syncPosts'
const rateUrl = 'http://localhost:3005/rate'
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
    const evaluatePost = axios.post(rateUrl, {
      votes: bucket[0].net_votes,
      comments: bucket[0].children,
      value: checkPostsValue([bucket[0].total_payout_value.replace("SBD", ""),
      bucket[0].pending_payout_value.replace("SBD", ""),
      bucket[0].total_pending_payout_value.replace("STEEM", "")])
    })
    axios.post(url, {post: bucket[0], rating: evaluatePost.trending})
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