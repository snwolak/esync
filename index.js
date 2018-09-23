const steem = require('steem');
const _ = require('lodash');
const http = require('http');
const https = require('https');

const utils = require('./helpers/utils');
const Regex = require("regex");
const config = require('./config.js');
const getContent = require('./helpers/getContent');
const deletePost = require('./helpers/deletePost');

let {options} = config;


http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

if (process.env.STEEMJS_URL) {
  steem.api.setOptions({ url: "https://api.steemit.com" });
} else {
  steem.api.setOptions({ url: "https://api.steemit.com"});
}


// define model =================
let sdb_votes = []
let sdb_transfers =[]
let sdb_follows =[]
let sdb_reblogs = []
let sdb_claim_reward_balances = []
let sdb_comments = []
let sdb_mentions = []
let sdb_comment_options = []
let sdb_account_updates = []






let awaitingBlocks = [];

async function getBlockNum() {
  let globalData = [];
  await steem.api.getDynamicGlobalPropertiesAsync().then(result => {
    globalData.push(result);
    return globalData[0];
  });
  return globalData[0].last_irreversible_block_num
}

const start = async () => {
  let started; 
  
  const lastBlockNum = await getBlockNum();
  console.log('Last Block Num', lastBlockNum);

  utils.streamBlockNumFrom(lastBlockNum, options.delayBlocks, async (err, blockNum) => {
    awaitingBlocks.push(blockNum);

    if (!started) {
      started = true;
      await parseNextBlock();
    }
  });
};

const numDaysBetween = function(d1, d2) {
  var diff = Math.abs(d1.getTime() - d2.getTime());
  return diff / (1000 * 60 * 60 * 24 * 90);
};

function getBlockAsync(blockNum, virtual) {
  return new Promise ((resolve, reject) => {
    steem.api.getOpsInBlock(blockNum, virtual, (err, res) => {
      if (err) {
        console.log(res);
        resolve([]);
      }
      else {
        resolve(res);
      }
    });
  });
}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}
function safelyParseJSON (json) {
  var parsed

  try {
    parsed = JSON.parse(json)
  } catch (e) {
    // Oh well, but whatever...
  }

  return parsed // Could be undefined!
}


const parseNextBlock = async () => {
  if (awaitingBlocks[0]) {
    const blockNum = awaitingBlocks[0];

    /** Parse Block And Do Vote */
    const block = await getBlockAsync(blockNum, false)
    //const block = await steem.api.getBlockWithAsync({ blockNum });
    let blockTime = new Date();
    if (block.length>0) {

      let votes=[],transfers=[],follows=[],reblogs=[],rewards=[],mentions=[],
          comments=[],comment_options=[],account_updates=[],producer_rewards=[],
          curation_rewards=[],author_rewards=[],delegate_vesting_shares=[],comment_benefactor_rewards=[],
          transfer_to_vestings=[],fill_orders=[],return_vesting_delegations=[],withdraw_vestings=[],
          limit_order_creates=[],fill_vesting_withdraws=[],account_witness_votes=[],escrow_transfers=[], deleted_comments = [];

      if (numDaysBetween(new Date(), new Date(block[0].timestamp))<90) {

        for (var i = 0; i < block.length; i++) {

          let op = block[i].op;
          let salt = i;
          let indx = blockNum+'-'+block[i].trx_in_block+'-'+salt;
          let timestamp = new Date(block[i].timestamp);
          blockTime = timestamp;
          op[1].timestamp = timestamp;
          op[1].indx = indx;

          let oop = op[1];

          if (op[0]==='vote') {
            if(oop.permlink.includes('u02x93')) {
              votes.push(oop.author + '/' + oop.permlink)
              //
            } 
            
            /*votes.push({
              _id: oop.indx,
              voter: oop.voter,
              weight: oop.weight,
              author: oop.author,
              permlink: oop.permlink,
              timestamp: oop.timestamp
            });*/
          }
          else if (op[0]==='delete_comment') {
            if(oop.permlink.includes('u02x93')) {
              deleted_comments.push(oop.author + '/' + oop.permlink)
              //
            } 
          }
          /*if (op[0]==='transfer') {
            transfers.push({
              _id: oop.indx,
              from: oop.from,
              to: oop.to,
              amount: oop.amount,
              memo: oop.memo,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='custom_json') {
            let json;

            if (oop.id==='follow') {
              
              json = safelyParseJSON(oop.json);
              
              if (json && json[0]==='follow') {
                if (json[1].what && json[1].what.length>0) {
                  json[1].blog = true;
                } else {
                  json[1].blog = false;
                }
                follows.push({
                  _id: oop.indx,
                  follower: json[1].follower,
                  following: json[1].following,
                  blog: json[1].blog,
                  timestamp: oop.timestamp
                });
              } else if (json && json[0]==='reblog') {
                reblogs.push({
                  _id: oop.indx,
                  account: json[1].account,
                  author: json[1].author,
                  permlink: json[1].permlink,
                  timestamp: oop.timestamp
                });
              }
            }
          }
          if (op[0]==='account_update') {
            oop.active = JSON.stringify(oop.active);
            oop.posting = JSON.stringify(oop.posting);
            oop.owner = JSON.stringify(oop.owner);
            account_updates.push({
              _id: oop.indx,
              account: oop.account,
              posting: oop.posting,
              active: oop.active,
              owner: oop.owner,
              memo_key: oop.memo_key,
              json_metadata: oop.json_metadata,
              timestamp: oop.timestamp
            });
          }*/

        }//for

        if (votes.length>0) {
          [...new Set(votes)].map(vote => {
            const splittedVote = vote.split('/')
            return getContent.getContent(splittedVote[0], splittedVote[1])
          })
        } else if (deleted_comments.length>0) {
          [...new Set(deleted_comments)].map(permlink => {
            const link = permlink.split('/')
            return deletePost.deletePost(link[0],link[1])
          })
        }
        
      }//if numberofDays
    }//if block

    /** Store On DB Last Parsed Block */
    try {
      console.log('Block Parsed', blockNum);
    } catch (err) {
      console.log('Error Saving', blockNum, err);
    }

    delete awaitingBlocks[0];
    awaitingBlocks = _.compact(awaitingBlocks);

    await parseNextBlock();

  } else {
    await utils.sleep(1000);
    await parseNextBlock();
  }
};

start();
setTimeout(function(){
  process.exit(0);
  }, 60 * 60 * 1000);