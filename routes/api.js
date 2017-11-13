var express = require('express'),
   bodyParser = require('body-parser'),
   fs = require('fs'),
   // Auth = require('./auth'),
   logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
   session = require('client-sessions'),
   bcrypt = require('bcrypt'),
   // session = require('express-session'),
   Util = require('../models/util'),
   Users = require('../models/dbschema').Users,
   Records = require('../models/dbschema').Records,
   Bets = require('../models/dbschema').Bets,
   Scores = require('../models/dbschema').Scores,
   Messages = require('../models/dbschema').Messages,
   // Props = require('../models/dbschema').Props,
   OUgame = require('../models/dbschema').OUgame,
   OUuser = require('../models/dbschema').OUuser,
   mongoose = require('mongoose');

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf',{useMongoClient: true});

router = express.Router();

module.exports = router;

router.use(bodyParser.urlencoded({ extended: false }));
router.use(session({
  cookieName: 'session',
  secret: process.env.BAF_SESSION,
  duration: 14 * 24 * 60 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

router.use(function (req, res, next) {
  if (req.session && req.session.user) {
    Users.findOne({ _id: req.session.user._id }, function (err, user) {
      if (user) {
        req.user = user;
        delete req.user.password;
        req.session.user = user;
        res.locals.user = user;
      }

      next();
    });
  } else {
    next();
  }
});

function requireLogin (req, res, next) {
   // console.log('requirelogin'+req.user);
   if (!req.user) {
      // console.log('no auth');
      // res.redirect('/login');
      res.send({'type':'command', 'message':'$("#loginModal").modal()'});
   } else {
      next();
   }
}

// fix for duplicate bets: bets come in with random serial#, saved on stack
// timer removes; if bet with same serial# comes in that is on stack, refused
var betStack = [];

// pulled out so EVERYONE bets can call multiple times along with single bets
function saveBet (req){
   var today = new Date();

   new Bets({
      week: Util.getWeek(today, req.body.sport),
      season: 2017, //today.getFullYear(),
      gametime: req.body.gametime,
      date: (req.body.timeout)?today.setDate(today.getDate()+Number(req.body.timeout)):today,
      user1: req.session.user._id,
      user2: req.body.user2,
      odds: req.body.odds,
      type: req.body.type,
      team1: req.body.team1,
      team2: req.body.team2,
      amount: req.body.amount,
      sport: req.body.sport,
      fta: req.body.serial,
      paid: false,
      status: (req.body.watch === 'true')?((req.body.sport=='nfl')?10:(req.body.sport=='nba')?11:12):0,
      watch: (req.body.watch === 'true')?(req.body.watchsend === 'true')?11:1:''
   }).save(function(err){
      if(err) {
         logger.error('Trouble adding bet: '+err);
         return ({'type':'danger', 'message':'Trouble adding bet'});
      } else {
         logger.info('Bet added: user1='+req.session.user._id+" user2="+req.body.user2+" picks="+req.body.team1+" odds="+req.body.odds);
         return ({'type':'success', 'message':(req.body.watch=='true')?'Odds watch set':'Bet Saved'});
      }
   });
   if (req.body.watch=='false' && req.body.type != 'give' && req.body.type != 'take') {
      changeUser (req.body.user2, 'bets', 1);
      Util.textUser(req.body.user2, ((req.body.sport=='nfl')?'NFL':'NBA')+' bet: you='+req.body.team2+', '+req.session.user._id+'='+req.body.team1);
   }
}

// pulled out as function so can be called internally by watch bets being auto sent
function makeBet (req) {
   // check stack if bet has already come through, exit if so
   if (betStack.indexOf(req.body.serial) != -1) {
      console.log('previous bet found with serial#'+req.body.serial);
      return;
   }

   // add bet serial# to stack to check for duplicates later
   betStack.push(req.body.serial);
   // remove after 10 seconds
   setTimeout(function(){
      betStack.splice(betStack.indexOf(req.body.serial),1);
   }, 10000);

   // check if first to act bet, if not zero serial which gets copied to fta and used later
   if (req.body.user2 !== 'EVERYONE2')
      req.body.serial = 0;

   // if EVERYONE bet, need to go through user db and send to each
   if ((req.body.user2 == 'EVERYONE' || req.body.user2 == 'EVERYONE2') && req.body.watch=='false') {
      Users.find({$and: [
                     {_id: {$nin:[req.session.user._id,'testuser']}},
                     (req.body.sport == 'nfl')? {pref_nfl_everyone: true}:{pref_nba_everyone: true}]}, {_id: 1}, function(err, users){
         users.forEach(function(single) {
            req.body.user2 = single;
            saveBet(req);
         });
      });
   } else {
      console.log(saveBet(req));
   }
}

router.post('/makebet', requireLogin, function (req, res) {
   makeBet(req);
   res.send({'type':'success', 'message':(req.body.watch=='true')?'Odds watch set':'Bet Sent'});
});

router.post('/getbets', requireLogin, function(req,res){
   var sortedBets = [];
   Bets.find({$and:[
      {status:(req.body.status==1)?0:req.body.status},
      {type: {$in: ['spread', 'over', 'under']}},
      (Number(req.body.all))?{$and:[
                                 {user1: {$ne: req.session.user._id}},
                                 {user2: {$ne: req.session.user._id}}]}
                            :(req.body.status=='0')?{user2: req.session.user._id}
                                                   :(req.body.status=='1')?{user1: req.session.user._id}
                                                                          :{$or:[
                                                                              {user1: req.session.user._id},
                                                                              {user2: req.session.user._id}]}]
      }, function(err, bets){
      if(err){
         console.log(err);
      } else {
         bets.forEach(function(single){
            // flip response data if someone else instigated bet
            if (single.user2 == req.session.user._id){
               // console.log(single.status+' '+single.user1+' '+single.user2);
               tmp = single.user1;
               tmp2 = single.team1;
               single.user1 = single.user2;
               single.team1 = single.team2;
               single.user2 = tmp;
               single.team2 = tmp2;
               single.status = 1;  // 1 means the other guy needs to act; 0 means req.session.user
               if (single.type == 'spread' && single.odds < 0)
                  single.odds = Math.abs(single.odds);
               else if (single.type == 'spread')
                  single.odds = -Math.abs(single.odds);
               if (single.type == 'over')
                  single.type = 'under';
               else if (single.type == 'under')
                  single.type = 'over';
            }
            sortedBets.push(single);
         });
         res.json(sortedBets);
      }
   }).sort({date:-1});
});

router.post('/changebet', requireLogin, function(req,res){
   // console.log(req.body);
   switch (req.body.action) {
      case 'delete':  // delete bet
         // if not save later bet or future, decrement bet flag notice
         var  tmp = new Promise(function(resolve, reject) {
            Bets.findOne({_id:req.body.id}, function(err, singleBet){
               if(err) {
                  console.log(err);
                  reject();
               } else if (singleBet){
                  if (singleBet.status === 0 && singleBet.type != 'give' && singleBet.type != 'take') {
                     changeUser(singleBet.user2, 'bets', -1);
                  }
                  resolve();
               }
            });
         }).then(function() {
            Bets.remove({_id:req.body.id}, function(err){
               if(err)
                  console.log(err);
               else {
                  logger.info('Bet _id='+req.body.id+' deleted');
                  res.send({'type':'success', 'message':'Bet deleted'});
               }
            });
         });
         break;
      case 'accepted':   // bet accepted
         var updateFields = {
            status: req.body.status,
            comment:req.body.comment
         };
         if (req.body.future)
            updateFields.user2 = req.session.user._id;
         // below query has id AND status in case first to act bet was already acted on but other people have been haven't updated locally
         Bets.findOneAndUpdate({_id: req.body.id, status: 0}, updateFields, function(err, acceptedBet){
            if(acceptedBet){
               logger.info('Bet'+((acceptedBet.fta)?'(fta)':'')+' _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
               changeUser(req.session.user._id, 'bets', -1);
               Util.textUser(acceptedBet.user1, acceptedBet.user2+' accepted your '+acceptedBet.team1+'/'+acceptedBet.team2+' bet', true);
               // if first to act bet, remove for other people
               if (acceptedBet.fta) {
                  Bets.find({$and:[{fta: acceptedBet.fta}, {user2:{$ne: req.session.user._id}}]}, function(err, otherBets) {
                     otherBets.forEach(function(otherBet) {
                        changeUser (otherBet.user2, 'bets', -1);
                        logger.info('1st to bet acted by '+req.session.user._id+', bet '+otherBet._id+' changed for '+otherBet.user2);
                     });
                  }).then(function(){
                     Bets.update({$and:[{fta: acceptedBet.fta}, {user2:{$ne: req.session.user._id}}]},{status: 3, fta: 0}, {multi: true}, function(err) {
                        if (err)
                           console.log(err);
                     });
                  });
               }
               res.send({'type':'success', 'message':'Bet accepted'});
            } else {
               res.send({'type':'danger', 'message':'Bet not accepted, please refresh'});
            }
         });
         break;
      case 'refused':   // bet refused
         Bets.update({_id:req.body.id},{status:req.body.status, comment:req.body.comment}, function(err){
            if(err){
               console.log(err);
            } else {
               logger.info('Bet _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
               res.send({'type':'success', 'message':'Reply Sent'});
               changeUser(req.session.user._id, 'bets', -1);
            }
         });
         break;
      case 'change':
         Bets.update({_id: req.body.id}, req.body, function(err) {
            if(err)
               console.log(err);
            else {
            	logger.info('Bet _id='+req.body.id+' changed - '+new Date());
               res.send({'type':'success', 'message':'Change made'});
            }
         });
         break;

   }
});

router.post('/weeklystats', requireLogin, function(req,res){
   var sortedBets = [];
   // console.log(getWeek(new Date(req.body.date));
   // {date:{$gt:new Date().setHours(0,0)-(1000*60*60*24*5)}}
   Bets.find({$and:[{season:2017}, {sport: req.body.sport}, {week: req.body.date}, {status: {$in:[2,4,5,6]}}]}, function(err,complete){
      if(err){
         console.log(err);
      } else {
         complete.forEach(function(single){
            // flip response data if someone else instigated bet
            if (single.user1 != req.session.user._id){
               tmp = single.user1;
               tmp2 = single.team1;
               single.user1 = single.user2;
               single.team1 = single.team2;
               single.user2 = tmp;
               single.team2 = tmp2;
               if (single.odds < 0)
                  single.odds = Math.abs(single.odds);
               else
                  single.odds = -Math.abs(single.odds);
               if (single.status == 4)
                  single.status = 5;
               else if (single.status == 5)
                  single.status = 4;
            }
            sortedBets.push(single);
         });
         res.json(sortedBets);
      }
   }).sort({date: -1, user1: 1, });
});

router.post('/overallstats', requireLogin, function(req,res){
   var stats = [];
   Records.find({user:{$ne: 'testuser'}, pct: {$exists: true}, sport: req.body.sport, season: req.body.season}, function(err,records){
      if (err)
         console.log(err);
      else
         res.json(records);
   }).sort({pct:-1});
});

router.post('/graphstats', requireLogin, function(req,res){
   var dates = [],
      results = {};
   // find start date for desired period
   var startDate = new Date();
   if (Number(req.body.days)) {  // if a number of days are given, go back from today that many
      startDate.setDate(startDate.getDate() - req.body.days);
   } else { // else start at the begining of the season
         startDate = (req.body.sport == 'nfl')?1:Util.seasonStart.nba;
   }
   // find all valid bets during period, keep numBets and process
   Bets.find({$and:[ (req.body.user == 'ALL')?{}:{$or:[{user1: req.body.user},
                                                      {user2: req.body.user}]},
                     {status:{$in: [4,5,6]}},
                     {sport: req.body.sport},
                     {season: req.body.season},
                     (req.body.days)?{date: {$gte: startDate}}:{}]}, function(err, bets){
      if (err) {
         console.log(err);
      } else {
         bets.forEach(function(bet, index){
         	if (!results[bet.user1]) {
               results[bet.user1]={total: 0, numBets: 0, data: []};
            }
         	if (!results[bet.user2]) {
               results[bet.user2]={total: 0, numBets: 0, data: []};
            }
            if (index === 0)
               startDate = bet.week;
            // check if stop date to store data
            if (bet.week > startDate) {
               // store date for xaxis labels
               dates.push(startDate);
               // on date, save win % per user
               for (var username in results) {
                  results[username].data.push(results[username].total/results[username].numBets);
               }
               console.log(results);
               // advance next date to stop on
               startDate += 1;
            }
            if (bet.status == 4) {
               results[bet.user1].total++;
            } else if (bet.status == 5) {
               results[bet.user2].total++;
            } else {
               results[bet.user1].total+=0.5;
               results[bet.user2].total+=0.5;
            }
            results[bet.user1].numBets++;
            results[bet.user2].numBets++;
         });
         // push remaining info once done
         dates.push(startDate);
         for (var username in results) {
            results[username].data.push(results[username].total/results[username].numBets);
         }
      }
      res.send({
        xaxis : dates,
        datasets: results
      });
   }).sort({week: 1});
});

router.post('/userstats', requireLogin, function(req,res){
   Bets.find({$and:[{$or:[{user1: req.body.user},
                          {user2: req.body.user}],
                    sport: req.body.sport,
                    season: req.body.season},
                    {status:{$in:[4,5,6]}},
                    (req.body.week)?{week:req.body.week}:{}]}, function(err, bets){
      if (err) {
         console.log(err);
      } else {
         var winList = {};
         bets.forEach(function(bet){
            if (bet.status == 4) {
               if (bet.user1 == req.body.user) {
                  if (!winList[bet.user2])
                     winList[bet.user2] = {win:0, loss:0};
                  winList[bet.user2].win += 1;
               } else {
                  if (!winList[bet.user1])
                     winList[bet.user1] = {win:0, loss:0};
                  winList[bet.user1].loss += 1;
               }
            } if (bet.status == 5) {
               if (bet.user1 == req.body.user) {
                  if (!winList[bet.user2])
                     winList[bet.user2] = {win:0, loss:0};
                  winList[bet.user2].loss += 1;
               } else {
                  if (!winList[bet.user1])
                     winList[bet.user1] = {win:0, loss:0};
                  winList[bet.user1].win += 1;
               }
            }
         });
         res.json({bets, winList});
      }
   }).sort({date:-1});
});

router.post('/getscores', requireLogin, function(req,res){
   Scores.find({$and: [{sport: req.body.sport}, {season: Number(req.body.season)}, (req.body.sport == 'nfl')?{week: req.body.period}:{$and:[{date:{$gte:new Date(req.body.period).setHours(0,0,0,0)}}, {date:{$lt:new Date(req.body.period).setHours(23,59)}}]}]}, function(err,scores){
      if(err){
         console.log(err);
      } else {
         res.json(scores);
      }
   });
});

// router.post('/postprop', requireLogin, function(req,res){
//    new Props({
//       date: new Date(),
//       user1: req.session.user._id,
//       user2: req.body.user2,
//       amount: req.body.amount,
//       prop: req.body.prop
//    }).save(function(err){
//       if(err) {
//          console.log('Trouble adding prop');
//          res.send({'type':'danger', 'message':'Trouble adding bet'});
//       } else {
//          logger.info('Prop added');
//          res.send({'type':'success', 'message':'Prop Added'});
//       }
//    });
// });

router.get('/getprops', requireLogin, function(req,res){
   Bets.find({type: 'prop'}, function(err, props){
      res.json(props);
   }).sort({date: -1}).limit(50);
});

router.post('/acceptprop', requireLogin, function(req,res){
   Bets.update({_id: req.body.id}, {user2: req.session.user._id}, function(err){
      if (err) {
         console.log("Prop accept error: "+err);
      } else {
         logger.info("Prop accepted: "+req.body.id);
         res.send({'type':'success', 'message':'Prop updated'});
      }
   });
});

router.post('/getstandings', requireLogin, function(req,res){
   OUgame.find({season: Number(req.body.season), sport: req.body.sport}, function(err, standings){
      if (err)
         console.log(err);
      else
      OUuser.find({season: Number(req.body.season), sport: req.body.sport}, function(err, users){
         if (err)
            console.log(err);
         else
            res.json({standings, users});
      }).sort({user:1});
   }).sort({team:1});
});

router.post('/getousignup', requireLogin, function(req,res){
   // first find list of all users
   OUuser.find({season: Number(req.body.season), sport: req.body.sport}, function(err, users){
      if (err) {
         console.log('Error getting OU users - '+err);
      } else {
         // next find choices for current user
         OUuser.findOne({season: Number(req.body.season), sport: req.body.sport, user: req.session.user._id}, function(err, choices){
            if (choices) {
               OUgame.find({season: Number(req.body.season), sport: req.body.sport}, function(err, teams){
                  if (err) {
                     console.log(err);
                  } else {
                     // add users choice to results
                     teams.forEach(function(team, index){
                        teams[index].pick = choices[index];
                     });
                     if (err) {
                        console.log(err);
                     } else {
                        res.json({users: users, choices: teams});
                     }
                  }
               }).sort({index:1}).lean(); // lean needed to modify mongoose object above
            } else {
               res.json({users: users});
            }
         });
      }
   }).sort({user:1});
});

router.post('/setouchoices', requireLogin, function(req,res){
   // var tmp = {};
   // var tmp2 = JSON.parse(req.body.choices2);
   // for (var i=0; i < tmp2.length; i++) {
   //    tmp[i] = tmp2[i];
   // }
   OUuser.update({user: req.session.user._id, season: req.body.season, sport: req.body.sport}, JSON.parse(req.body.choices), function(err){
      if (err)
         console.log("OU choice change error: "+err);
      else {
         res.send({'type':'success', 'message':'Choices updated'});
      }
   });
});

router.post('/getouusers', requireLogin, function(req,res){
   OUuser.find({}, function(err,users){
      if (err)
         console.log('Error getting OU users - '+err);
      else
         res.json(users);
   }).sort({user:1});
});

router.post('/ousignup', requireLogin, function(req,res){
   OUuser.findOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport}, function(err, result){
      if (err)
         console.log(err);
      if (result) {
         res.send({'type':'danger', 'message':'Already joined'});
      } else {
         new OUuser({
            user: req.session.user._id,
            season: Number(req.body.season),
            sport: req.body.sport
         }).save(function(err){
            if (err)
               console.log('Error saving new OUuser: '+err);
            else
               res.send({'type':'success', 'message':'You are now signed up'});
         });
      }
   });
});

router.post('/setprefs', requireLogin, function(req,res){
   if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10);
   }
   Users.update({_id:req.session.user},req.body, function(err){
      if(err){
         console.log(err);
      } else {
         console.log('Preferences changed for '+req.session.user._id+' - '+new Date());
         res.send({'type':'success', 'message':'Preferences changed'});
      }
   });
});

router.get('/getprefs',function(req,res){
   Users.findOne({_id: req.session.user}, {_id:1,  pref_nfl_everyone:1, pref_nba_everyone:1, pref_text_receive:1, pref_text_accept:1, sms: 1, pref_default_page: 1}, function(err,user){
      res.json(user);
   });
});

function markPaid(betid, user) {
   Bets.findByIdAndUpdate({_id:betid}, {paid: true}, function(err, single){
      if(err){
         console.log(err);
      } else {    // need to also mark debt flag in user db for notifications
         if(single.user1 != user){
            var tmp = single.user1;
            var tmp2 = single.team1;
            single.user1 = single.user2;
            single.team1 = single.team2;
            single.user2 = tmp;
            single.team2 = tmp2;
         }
         // below changes winner/loser debt flags: debts owed in first 4 bits, debts owed to next 4 bits
         Users.update({_id: single.user1}, {$inc:{debts: -(1<<4)}}, function (err) {  //reduce winners flag
            if(err)
               console.log(err);
         });
         Users.update({_id: single.user2}, {$inc:{debts: -1}}, function (err) {   //increase loser flag
            if(err)
               console.log(err);
         });
         logger.info('Bet#'+betid+' marked paid by '+user+' - '+new Date());
         return 1;
      }
   });
}

// assumed only called by winner of bet
router.post('/debtpaid', requireLogin, function(req,res){
   if(markPaid(req.body.id, req.session.user._id))
      res.send({'type':'success', 'message':'Bet marked paid'});
   else {
      res.send({'type':'danger', 'message':'Trouble marking bet paid, try again'});

   }
});

//retrieves both bets owed to someone else and someone else owing user
router.get('/getdebts', requireLogin, function(req,res){
   var sortedBets = [];
   Bets.find({$and:[{$or:[{user1: req.session.user},{user2: req.session.user}]},{status:{$in:[4,5]}}, {paid:false}]}, function(err,bets){
      bets.forEach(function(single){
         if (single.user1 != req.session.user._id){   //serve back to user as if bet initiator
            var tmp = single.user1;
            var tmp2 = single.team1;
            single.user1 = single.user2;
            single.team1 = single.team2;
            single.user2 = tmp;
            single.team2 = tmp2;
            if (single.status == 4)
               single.status = 5;
            else {
               single.status = 4;
            }
         }
         sortedBets.push(single);
      });
      res.json(sortedBets);
   }).sort({date: -1});
});

router.post('/resolvefinish', requireLogin, function(req,res){
   // find and mark other guys wins
   Bets.find({$and:[{paid: false}, {$or:[{$and:[{status: 4}, {user1: req.body.name}, {user2: req.session.user._id}]},{$and:[{status: 5}, {user1: req.session.user._id}, {user2: req.body.name}]}]}]}, function(err, bets){
      bets.forEach(function(bet) {
         markPaid(bet._id, req.body.name);
      });
   }).sort({date: 1}).limit(Number(req.body.num));
   // find and mark own wins
   Bets.find({$and:[{paid: false}, {$or:[{$and:[{status: 5}, {user1: req.body.name}, {user2: req.session.user._id}]},{$and:[{status: 4}, {user1: req.session.user._id}, {user2: req.body.name}]}]}]}, function(err,bets){
      bets.forEach(function(bet) {
         markPaid(bet._id, req.session.user._id);
      });
   }).sort({date: 1}).limit(Number(req.body.num));
   Util.textUser(req.body.name, 'Notice: '+req.session.user._id+' auto resolved '+req.body.num+' offsetting debts between you - no further action required');
   res.send({'type':'success', 'message':'Offset debts recorded'});
});

router.get('/resolvedebts', requireLogin, function(req,res){
   var debtList = {owes: {}, isowed: {}},
       results = [];

   Bets.find({$and:[{paid: false}, {status: {$in:[4,5]}}, {$or:[{user1: req.session.user._id}, {user2: req.session.user._id}]}]}, function(err, bets){
      bets.forEach(function(bet){
         if ((bet.status == 4 && bet.user1 == req.session.user._id) || (bet.status == 5 && bet.user2 == req.session.user._id)) {
            // swap users in case the latter above
            if (bet.user2 == req.session.user._id)
               bet.user2 = bet.user1;
            if (!debtList.isowed[bet.user2]) {
               debtList.isowed[bet.user2] = 1;
            } else {
               debtList.isowed[bet.user2] += 1;
            }
         } else {
            // swap users in case the latter above
            if (bet.user2 == req.session.user._id)
               bet.user2 = bet.user1;
            if (!debtList.owes[bet.user2]) {
               debtList.owes[bet.user2] = 1;
            } else {
               debtList.owes[bet.user2] += 1;
            }
         }
      });
      console.log(debtList);
      // find match between 2 lists
      for (var person in debtList.isowed) {
         if (debtList.owes[person]) {
            results.push({name: person, num: Math.min(debtList.owes[person], debtList.isowed[person])});
         }
      }
      res.send(results);
   });
});

router.post('/getfutureoffers', requireLogin, function(req,res){
   Bets.find({$and:[{status: req.body.status}, {$or: [{type: 'give'}, {type: 'take'}]}]}, function(err, offers){
      res.json({
         sessionId: req.session.user._id,
         offers: offers
      });
   });
});

router.get('/getfutures', function (req, res) {
   if (fs.existsSync('json/futures.json'))
      res.sendFile('./json/futures.json', {'root':__dirname+'/..'});
});

router.get('/getlogs', function (req, res) {
   if (fs.existsSync('json/log.json')) {
      res.sendFile('./json/log2.json', {'root':__dirname+'/..'});
   }
});

router.get('/nflodds', function (req, res) {
   res.sendFile('./json/nfl_odds.json', {'root':__dirname+'/..'});
});

router.get('/nbaodds', function (req, res) {
   res.sendFile('./json/nba_odds.json', {'root':__dirname+'/..'});
});

router.get('/ncaaodds', function (req, res) {
   res.sendFile('./json/ncaab_odds.json', {'root':__dirname+'/..'});
});

// gets userlist for bet select list
router.get('/users', requireLogin, function(req,res){
   Users.find({_id: {$ne:req.session.user}}, {_id: 1, pref_default_page: 1}, function(err,user){
      res.json(user);
   }).sort({_id:1});
});

// called when new page is loaded
router.get('/doorbell', requireLogin, function(req,res){
   var today = new Date(),
      answer = {
         type: 'message',
         // username: req.session.user._id
      };
   if (fs.existsSync('json/nfl_odds.json'))
      answer.nfl = true;
   if (fs.existsSync('json/nba_odds.json'))
      answer.nba = true;
   if (fs.existsSync('json/ncaa_odds.json'))
      answer.ncaa = true;
   var betsPromise = new Promise(function (resolve, reject) {
      Users.findOne({_id: req.session.user}, function(err,user){
         if (err)
            reject(err);
         if (user){
            answer.bets = user.bets;
            answer.debts = user.debts;
         }
         resolve();
      });
   });
   var futuresPromise = new Promise(function (resolve, reject) {
      Bets.findOne({$and:[{status: 0},{$or: [{type: 'give'}, {type: 'take'}]}]}, function(err, future) {
         if (err)
            reject(err);
         if (future) {
            answer.futures = true;
         }
         resolve();
      });
   });
   var propsPromise = new Promise(function (resolve, reject) {
      Bets.findOne({$and:[{type: 'prop'}, {user2: 'OPEN'}, {date:{$gt:new Date().setHours(0,0)-(1000*60*60*24*7)}}]}, function(err, prop) {
         if (err)
            reject(err);
         if (prop) {
            answer.props = true;
         }
         resolve();
      });
   });
   Promise.all([betsPromise, futuresPromise, propsPromise]).then(function(values){
      res.send(answer);
   });
});

function changeUser(user, key, inc) {
   var tmp = {};
   tmp[key] = inc;
   Users.update({_id: user}, {$inc: tmp}, function(err){
      if(err)
         console.log('Trouble with changing user '+key);
   });
}
