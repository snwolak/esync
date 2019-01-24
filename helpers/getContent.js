const steem = require('steem');
const axios = require('axios')
const fetch = require('node-fetch');
const syncPosts = require('./syncPosts')
const checkPostsValue = require('./checkPostsValue')
const url = 'http://localhost:5000/steemblr/us-central1/syncPosts'
const rateUrl = 'http://localhost:3005/rate'
const getContent = async (author, permlink) => {
  let bucket = [];
  
  await steem.api
  .getContentAsync(
    author, permlink
  )
  .then(result => {
    bucket.push(result)
    bucket[0].rating = 0.00
    return bucket[0];
  })
  .catch(function(error) {
    //console.log(error);
  });
  if(bucket[0].parent_author === "") {
    let data = 0;
    const evaluatePost = await axios.post(rateUrl, {
      votes: bucket[0].net_votes,
      comments: bucket[0].children,
      value: checkPostsValue.checkPostsValue([bucket[0].total_payout_value.replace("SBD", ""),
      bucket[0].pending_payout_value.replace("SBD", ""),
      bucket[0].total_pending_payout_value.replace("STEEM", "")])
    }).then(res => {
      data = res.data
      console.log(res.data)
      return res.data
    }).catch(err => {
      console.log(err)
    })
  
    bucket[0].rating = await data.trending
    await syncPosts.sync({post: bucket[0]})
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