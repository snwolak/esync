const steem = require('steem');
const _ = require('lodash');
const http = require('http');
const https = require('https');

const utils = require('./helpers/utils');
const Regex = require("regex");
const config = require('./config.js');
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
  //876000 blocks ~ 1 month
  //2628000 blacks ~ 3 month
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
          limit_order_creates=[],fill_vesting_withdraws=[],account_witness_votes=[],escrow_transfers=[];

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
            
            votes.push({
              _id: oop.indx,
              voter: oop.voter,
              weight: oop.weight,
              author: oop.author,
              permlink: oop.permlink,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='transfer') {
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
          if (op[0]==='claim_reward_balance') {
            rewards.push({
              _id: oop.indx,
              account: oop.account,
              reward_steem: oop.reward_steem,
              reward_sbd: oop.reward_sbd,
              reward_vests: oop.reward_vests,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='comment') {
            let regg = /(?:^|[^a-zA-Z0-9_＠\/!@#$%&*.])(?:(?:@|＠)(?!\/))([a-zA-Z0-9-.]{3,16})(?:\b(?!@|＠)|$)/g;
            
            if (oop.body && oop.body.indexOf('@@')===-1) {

              let lmentions = oop.body.match(regg);
              let postType = false;
              let mm = [];

              oop.parent_author === ''?postType=true:postType=false;

              if (lmentions && lmentions.length>0) {
                //console.log('mentions',mentions);
                for (var io = 0; io < lmentions.length; io++) {
                  var tm = lmentions[io].split('@')[1];
                  if (tm !== oop.author) {
                    if (isNaN(parseInt(tm))) {
                      mm.push(tm);
                    }
                  }
                }
                //console.log(mm);
                let mn = mm.filter((el, k, a) => k === a.indexOf(el));
                for (var j = 0; j < mn.length; j++) {
                  mentions.push({
                    _id: oop.indx+'-'+j,
                    author: oop.author,
                    permlink: oop.permlink,
                    post: postType,
                    account: mn[j],
                    timestamp: oop.timestamp
                  });
                }
              }
            }

            comments.push({
              _id: oop.indx,
              parent_author: oop.parent_author,
              parent_permlink: oop.parent_permlink,
              author: oop.author,
              permlink: oop.permlink,
              title: oop.title,
              body: oop.body,
              json_metadata: oop.json_metadata,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='comment_options') {
            oop.extensions = JSON.stringify(oop.extensions);
            comment_options.push({
              _id: oop.indx,
              author: oop.author,
              permlink: oop.permlink,
              max_accepted_payout: oop.max_accepted_payout,
              allow_votes: oop.allow_votes,
              allow_curation_rewards: oop.allow_curation_rewards,
              extensions: oop.extensions,
              timestamp: oop.timestamp
            });
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
          }
          if (op[0]==='producer_reward') {
            producer_rewards.push({
              _id: oop.indx,
              producer: oop.producer,
              vesting_shares: oop.vesting_shares,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='curation_reward') {
            curation_rewards.push({
              _id: oop.indx,
              curator: oop.curator,
              reward: oop.reward,
              comment_author: oop.comment_author,
              comment_permlink: oop.comment_permlink,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='author_reward') {
            author_rewards.push({
              _id: oop.indx,
              author: oop.author,
              permlink: oop.permlink,
              sbd_payout: oop.sbd_payout,
              steem_payout: oop.steem_payout,
              vesting_payout: oop.vesting_payout,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='delegate_vesting_shares') {
            delegate_vesting_shares.push({
              _id: oop.indx,
              delegator: oop.delegator,
              delegatee: oop.delegatee,
              vesting_shares: oop.vesting_shares,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='comment_benefactor_reward') {
            comment_benefactor_rewards.push({
              _id: oop.indx,
              benefactor: oop.benefactor,
              author: oop.author,
              permlink: oop.permlink,
              reward: oop.reward,
              vest: parseFloat(oop.reward),
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='transfer_to_vesting') {
            transfer_to_vestings.push({
              _id: oop.indx,
              from: oop.from,
              to: oop.to,
              amount: oop.amount,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='fill_order') {
            fill_orders.push({
              _id: oop.indx,
              current_owner: oop.current_owner,
              current_orderid: oop.current_orderid,
              current_pays: oop.current_pays,
              open_owner: oop.open_owner,
              open_orderid: oop.open_orderid,
              open_pays: oop.open_pays,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='return_vesting_delegation') {
            return_vesting_delegations.push({
              _id: oop.indx,
              account: oop.account,
              vesting_shares: oop.vesting_shares,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='limit_order_create'){
            limit_order_creates.push({
              _id: oop.indx,
              owner: oop.owner,
              orderid: oop.orderid,
              amount_to_sell: oop.amount_to_sell,
              min_to_receive: oop.min_to_receive,
              fill_or_kill: oop.fill_or_kill,
              expiration: oop.expiration,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='withdraw_vesting'){
            withdraw_vestings.push({
              _id: oop.indx,
              account: oop.account,
              vesting_shares: oop.vesting_shares,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='account_witness_vote') {
            
            account_witness_votes.push({
              _id: oop.indx,
              account: oop.account,
              witness: oop.witness,
              approve: oop.approve,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='fill_vesting_withdraw') {
            fill_vesting_withdraws.push({
              _id: oop.indx,
              from_account: oop.from_account,
              to_account: oop.to_account,
              withdrawn: oop.withdrawn,
              deposited: oop.deposited,
              timestamp: oop.timestamp
            });
          }
          if (op[0]==='escrow_transfer') {
            escrow_transfers.push({
              _id: oop.indx,
              from: oop.from,
              to:  oop.to,
              sbd_amount: oop.sbd_amount,
              steem_amount: oop.steem_amount,
              escrow_id: oop.escrow_id,
              agent: oop.agent,
              fee: oop.fee,
              json_meta: oop.json_meta,
              ratification_deadline: oop.ratification_deadline,
              escrow_expiration: oop.escrow_expiration,
              timestamp: oop.timestamp
            });
          }
        }//for

        if (votes.length>0) {
          
        }
        if (transfers.length>0) {
          
        }
        if (follows.length>0) {
          
        }
        if (reblogs.length>0) {
          
        }
        if (mentions.length>0) {
          
        }
        if (comments.length>0) {
          
        }
        if (comment_options.length>0) {
          
        }
        if (rewards.length>0) {
          
        }
        if (account_updates.length>0) {
          
        }
        if (producer_rewards.length>0) {
          
        }
        if (curation_rewards.length>0) {
          
        }
        if (author_rewards.length>0) {
          
        }
        if (delegate_vesting_shares.length>0) {
          
        }
        if (comment_benefactor_rewards.length>0) {
          
        }
        if (transfer_to_vestings.length>0) {
          
        }
        if (fill_orders.length>0) {
        
        }
        if (return_vesting_delegations.length>0) {

        }
        if (withdraw_vestings.length>0) {
         
        }
        if (limit_order_creates.length>0) {
         
        }
        if (fill_vesting_withdraws.length>0) {
         
        }
        if (account_witness_votes.length>0) {
         
        }
        if (escrow_transfers.length>0) {
    
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
    await utils.sleep(3010);
    await parseNextBlock();
  }
};

start();
