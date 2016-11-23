var express = require('express'),
bodyParser = require('body-parser'),
// Auth = require('./auth'),
session = require('client-sessions'),
// session = require('express-session'),
Promise = require('promise'),
// plivo = require('plivo'),
sinchAuth = require('../models/sinch-auth'),
sinchSms = require('../models/sinch-messaging'),
Users = require('../models/dbschema').Users,
Records = require('../models/dbschema').Records,
Bets = require('../models/dbschema').Bets,
Scores = require('../models/dbschema').Scores,
Messages = require('../models/dbschema').Messages,
Props = require('../models/dbschema').Props,
Ougame = require('../models/dbschema').Ougame,
mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/baf');

// var sms = plivo.RestAPI({
//   authId: 'MANJRMMDLJYME1MMYYOG',
//   authToken: 'ZjcyZmI5MGVhMGFlMWIzNWEyYzg0ZDFiOWJmMmUw'
// });
var auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', 'nhnHg5UWKECMfk59XBSIjw==');

router = express.Router();

module.exports = router;

router.use(bodyParser.urlencoded({ extended: false }));
router.use(session({
  cookieName: 'session',
  secret: 'lkjhsd8fasdfkh@ljkkljWljOlkjl3344',
  duration: 14 * 24 * 60 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

// router.use(session({
//   name: 'session',
//   secret: 'lkjhsd8fasdfkh@ljkkljWljOlkjl3344',
//   saveUninitialized: true,
//   resave: true,
// }));

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

router.post('/makebet', requireLogin, function (req, res) {
   var fta_id = Math.random(),    // 'first to act' identifier
      today2 = new Date(),
      today = new Date();
   // console.log(today.setDate(today.getDate()+7*24*60*60*1000))
   if ((req.body.user2 == 'EVERYONE' || req.body.user2 == 'EVERYONE2') && !req.body.later) {
      Users.find({$and: [
                     {_id: {$nin:[req.session.user._id,'testuser']}},
                     (req.body.sport == 'nfl')? {pref_nfl_everyone: true}:{pref_nba_everyone: true}]}, {_id: 1}, function(err, users){
         users.forEach(function(single) {
            new Bets({
               date: today,
               year: today.getFullYear(),
               user1: req.session.user._id,
               user2: single,
               odds: req.body.odds,
               type: req.body.type,
               team1: req.body.team1,
               team2: req.body.team2,
               amount: req.body.amount,
               status: 0,
               paid: false,
               fta: (req.body.user2 == 'EVERYONE2')?fta_id:0,
               week: getWeek(today),
               gametime: req.body.gametime,
               sport: req.body.sport
            }).save(function(err){
               if(err) {
                  console.log('Trouble adding bet: '+err);
                  res.send({'type':'danger', 'message':'Trouble adding bet'});
               } else {
                  console.log('Bet added: user1='+req.session.user._id+" user2="+single+" picks="+req.body.team1+" odds="+req.body.odds+" amount=$"+req.body.amount+((req.body.user2 == 'EVERYONE2')?'(fta)':''));
               }
            });
            if (!req.body.later) {
               changeUser (single, 'bets', 1);
               textUser(single, req.session.user._id, 'You have a new '+((req.body.sport=='nfl')?'NFL':'NBA')+' bet from '+req.session.user._id);
            }
         });
         // res.send({'type':'success', 'message':(req.body.later)?'Bet saved':'Bet Sent'});
      });
   } else {
      new Bets({
         week: getWeek(today),
         year: today.getFullYear(),
         date: (req.body.timeout)?today.setDate(today.getDate()+Number(req.body.timeout)):today,
         user1: req.session.user._id,
         user2: req.body.user2,
         odds: req.body.odds,
         type: req.body.type,
         team1: req.body.team1,
         team2: req.body.team2,
         amount: req.body.amount,
         status: (req.body.later)?((req.body.sport=='nfl')?-1:-2):0,
         paid: false,
         gametime: req.body.gametime,
         sport: req.body.sport
      }).save(function(err){
         if(err) {
            console.log('Trouble adding bet: '+err);
            res.send({'type':'danger', 'message':'Trouble adding bet'});
         } else {
            console.log('Bet added: user1='+req.session.user._id+" user2="+req.body.user2+" picks="+req.body.team1+" odds="+req.body.odds+" amount=$"+req.body.amount);
            res.send({'type':'success', 'message':(req.body.later)?'Bet saved':'Bet Saved'});
         }
      });
      if (!req.body.later && req.body.type != 'give' && req.body.type != 'take') {
         changeUser (req.body.user2, 'bets', 1);
         textUser(req.body.user2, req.session.user._id, 'You have a new '+((req.body.sport=='nfl')?'NFL':'NBA')+' bet from '+req.session.user._id);
      }
   }
});

router.post('/getbets', requireLogin, function(req,res){
   var sortedBets = [];
   Bets.find({$and:[
      {status:(req.body.status==1)?0:req.body.status},
      {type: {$ne: 'give'}},
      {type: {$ne: 'take'}},
      (Number(req.body.all))?{$and:[
                                 {user1: {$ne: req.session.user._id}},
                                 {user2: {$ne: req.session.user._id}}]}
                            :(req.body.status=='0')?{user2: req.session.user._id}
                                                   :(req.body.status=='1')?{user1: req.session.user._id}
                                                                          :{$or:[
                                                                              {user1: req.session.user._id},
                                                                              {user2: req.session.user._id}]}]
      }, function(err,bets){
      if(err){
         console.log(err);
      } else {
         bets.forEach(function(single){
            // flip response data if someone else instigated bet
            if (single.user1 != req.session.user._id){
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
   switch (req.body.status) {           // delete bet
      case '-1':
         // if not save later bet or future, descement bet flag notice
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
                  console.log('Bet _id='+req.body.id+' deleted - '+new Date());
                  res.send({'type':'success', 'message':'Bet deleted'});
               }
            });
         });
         break;
      case '2':
         var updateFields = {
            status: req.body.status,
            comment:req.body.comment
         };
         if (req.body.future)
            updateFields.user2 = req.session.user._id;
         Bets.findByIdAndUpdate(req.body.id,updateFields, function(err, acceptedBet){
            if(acceptedBet){
               console.log('Bet'+((acceptedBet.fta)?'(fta)':'')+' _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
               res.send({'type':'success', 'message':'Reply Sent'});
               changeUser(req.session.user._id, 'bets', -1);
               textUser(acceptedBet.user1, req.session.user._id, acceptedBet.user2+' accepted your '+acceptedBet.team1+'/'+acceptedBet.team2+' bet', true);
            }
            if (acceptedBet.fta) {
               Bets.find({$and:[{fta: acceptedBet.fta}, {user2:{$ne: req.session.user._id}}]}, function(err, otherBets) {
                  otherBets.forEach(function(otherBet) {
                     changeUser (otherBet.user2, 'bets', -1);
                     console.log('1st to bet acted by '+req.session.user._id+', bet '+otherBet._id+' changed for '+otherBet.user2);
                  });
               });
               Bets.update({$and:[{fta: acceptedBet.fta}, {user2:{$ne: req.session.user._id}}]},{status: 3, fta: 0}, {multi: true}, function(err) {
                  if (err)
                     console.log(err);
               });
            }
         });
         break;
      case '3':
         Bets.update({_id:req.body.id},{status:req.body.status, comment:req.body.comment}, function(err){
            if(err){
               console.log(err);
            } else {
               console.log('Bet _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
               res.send({'type':'success', 'message':'Reply Sent'});
               changeUser(req.session.user._id, 'bets', -1);
            }
         });
         break;
      case '0':
         Bets.findOne({_id: req.body.id}, function(err, bet) {
            console.log(bet);
            if(err)
               console.log(err);
            else {
               if (bet.user2 == 'EVERYONE') {
                  Users.find({$and: [{_id: {$nin:[req.session.user._id,'testuser']}}, (req.body.sport == 'nfl')? {pref_nfl_everyone: true}:{pref_nba_everyone: true}]}, {_id: 1}, function(err, users){
                     users.forEach(function(single) {
                        new Bets({
                           date: new Date(),
                           user1: req.session.user._id,
                           user2: single,
                           odds: req.body.newodds,
                           type: bet.type,
                           team1: bet.team1,
                           team2: bet.team2,
                           amount: bet.amount,
                           paid: false,
                           status: 0,
                           year: new Date().getFullYear(),
                           week: getWeek(new Date()),
                           gametime: bet.gametime,
                           sport: bet.sport
                        }).save(function(err){
                           if(err) {
                              console.log('Trouble adding bet');
                              res.send({'type':'danger', 'message':'Trouble adding bet'});
                           } else {
                              console.log('Bet added: user1='+req.session.user._id+" user2="+single+" picks="+bet.team1+" odds="+bet.odds+" amount=$"+bet.amount);
                           }
                        });
                        changeUser (single, 'bets', 1);
                        textUser(single, req.session.user._id, 'You have a new bet from '+req.session.user._id);
                     });
                  });
                  Bets.remove({_id:req.body.id}, function(err){
                     if(err)
                        console.log(err);
                  });
               } else {
                  Bets.update({_id: req.body.id},{status: req.body.status, odds: req.body.newodds}, function(err) {
                     if(err){
                        console.log(err);
                     } else {
                        console.log('Bet _id='+req.body.id+'changed to '+req.body.status);
                        res.send({'type':'success', 'message':'Reply Sent'});
                        Bets.findOne({_id: req.body.id}, function(err, bet) {
                           if(err)
                              console.log(err);
                           else {
                              changeUser(bet.user2, 'bets', 1);
                              textUser(bet.user2, req.session.user._id, 'You have a new bet from '+req.session.user._id);
                           }
                        });
                     }
                  });
               }
            }
         });
         break;
   }
});

router.post('/weeklystats', requireLogin, function(req,res){
   var sortedBets = [];
   // console.log(getWeek(new Date(req.body.date));
   // {date:{$gt:new Date().setHours(0,0)-(1000*60*60*24*5)}}
   Bets.find({$and:[{year:2016}, {sport: req.body.sport}, {week: req.body.date}, {status: {$in:[2,4,5,6]}}]}, function(err,complete){
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
   Records.find({user:{$ne: 'testuser'}, sport: req.body.sport, year: req.body.year}, function(err,records){
      if (err)
         console.log(err);
      else
         if(!records.length) {
            Users.find({}, {_id: 1}, function(err,users){
               users.forEach(function(user){
                  var sports = ['nfl', 'nba'];
                  for (var i=0; i < sports.length; i++) {
                     new Records({
                        user: user,
                        year: new Date().getFullYear(),
                        sport: sports[i],
                        win: 0,
                        loss: 0,
                        push : 0,
                     }).save(function(err){
                        if (err){
                           console.log(err);
                        }
                     });
                  }
               });
            });
         }
         res.json(records);
   }).sort({pct:-1});
});

router.post('/graphstats', requireLogin, function(req,res){
   var userList = [],
      total = {},         // rolling storage for win amount per user
      numBets = {},       // rolling storage for number of bets per user
      // seasonDate = new Date('Jan 28 2016'), // first date to store data per user
      dates = [],          // xaxis data to be bet sent
      userData = [];       // datasets for each user

   // find users to get bet data for and intialize storage variables
   Users.find({_id: {$ne: 'testuser'}}, {_id: 1}, function(err,users){
      users.forEach(function(user){
         userList.push(user._id);
         userData.push({
            name: user._id,
            data: []
         });
         total[user._id] = 0;
         numBets[user._id] = 0;
      });
      // console.log(numBets);
   }).sort({_id:1});

   // find start date for desired period
   var startDate = new Date();
   if (Number(req.body.days)) {  // if a number of days are given, go back from today that many
      startDate.setDate(startDate.getDate() - req.body.days);
   } else { // else start at the begining of the season
         startDate = (req.body.sport == 'nfl')?1:new Date(req.body.year, 9, 25);
   }
   // find all valid bets during period, keep numBets and process
   Bets.find({$and:[ (req.body.user == 'ALL')?{}:{$or:[{user1: req.body.user},
                                                      {user2: req.body.user}]},
                     {status:{$in: [4,5,6]}},
                     {sport: req.body.sport},
                     {year: req.body.year},
                     (req.body.days)?{date: {$gte: startDate}}:{}]}, function(err,bets){
      if (err) {
         console.log(err);
      } else {
         bets.forEach(function(bet, index){
            if (index === 0)
               startDate = bet.week;
            // check if stop date to store data
            if (bet.week > startDate) {
               // store date for xaxis labels
               dates.push(startDate);
               // on date, save win % per user
               userList.forEach(function(username, index){
                  userData[index].data.push(total[username]/numBets[username]);
               });
               // advance next date to stop on
               startDate += 1;
            }
            if (bet.status == 4) {
               total[bet.user1]++;
               numBets[bet.user1]++;
               numBets[bet.user2]++;
            } else if (bet.status == 5) {
               total[bet.user2]++;
               numBets[bet.user1]++;
               numBets[bet.user2]++;
            } else if (bet.status == 6) {
               total[bet.user1] +=0.5;
               numBets[bet.user1]++;
               total[bet.user2] +=0.5;
               numBets[bet.user2]++;
            }
         });
         // push remaining info once done
         dates.push(startDate);
         userList.forEach(function(username, index){
            userData[index].data.push(total[username]/numBets[username]);
         });

      }
      res.send({
         xaxis : dates,
         datasets: userData
      });
   }).sort({week: 1});
});

router.post('/userstats', requireLogin, function(req,res){
   Bets.find({$and:[{$or:[{user1: req.body.user},
                          {user2: req.body.user}],
                    sport: req.body.sport,
                    year: req.body.year},
                    {status:{$in:[4,5,6]}},
                    (req.body.week)?{week:req.body.week}:{}]}, function(err,bets){
      if (err)
         console.log(err);
      else
         res.json(bets);
   }).sort({date:-1});
});

router.post('/postmessage', requireLogin, function(req,res){
   new Messages({
      date: new Date(),
      user: req.session.user._id,
      message: req.body.message
   }).save(function(err){
      if(err) {
         console.log('Trouble adding message');
         res.send({'type':'danger', 'message':'Trouble adding bet'});
      } else {
         console.log('Message from '+req.session.user._id);
         res.send({'type':'success', 'message':'Message Posted'});
      }
   });
});

router.post('/slack', function(req,res){
   // console.log(req.body);
   if (req.body.token === 'gUOpWBCpkeaoxjBUJCbbmeh9') {
      new Messages({
         date: new Date(),
         user: req.body.user_name,
         message: req.body.text
      }).save(function(err){
         if(err) {
            console.log('Trouble adding message');
         } else {
            console.log('Message from Slack');
         }
      });
   }
});

router.get('/msgboard', requireLogin, function(req,res){
   Messages.find(function(err,message){
      res.json(message);
   }).limit(50).sort({date: -1});
});

router.post('/getscores', requireLogin, function(req,res){
   if (req.body.sport=='nfl')
      Scores.find({sport:'nfl', week: req.body.period, year: Number(req.body.year)}, function(err,scores){
         if(err){
            console.log(err);
         } else {
            res.json(scores);
         }
      });
   else {
      Scores.find({$and: [{sport:'nba'}, {date:{$gt:new Date(req.body.period).setHours(0,0,0,0)}}, {date:{$lt:new Date(req.body.period).setHours(23,59)}}]}, function(err,scores){
         if(err){
            console.log(err);
         } else {
            res.json(scores);
         }
      });
   }
});

router.post('/postprop', requireLogin, function(req,res){
   new Props({
      date: new Date(),
      user1: req.session.user._id,
      user2: req.body.user2,
      amount: req.body.amount,
      prop: req.body.prop
   }).save(function(err){
      if(err) {
         console.log('Trouble adding prop');
         res.send({'type':'danger', 'message':'Trouble adding bet'});
      } else {
         console.log('Prop added');
         res.send({'type':'success', 'message':'Prop Added'});
      }
   });
});

router.get('/getprops', requireLogin, function(req,res){
   Props.find({}, function(err,message){
      res.json(message);
   }).sort({date: -1}).limit(50);
});

router.get('/getstandings', requireLogin, function(req,res){
   Ougame.find({}, function(err,standings){
      if (err)
         console.log(err);
      else
         res.json(standings);
   }).sort({team:1});
});

router.post('/setprefs', requireLogin, function(req,res){
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
   Users.findOne({_id: req.session.user}, {_id:1,  pref_nfl_everyone:1, pref_nba_everyone:1, pref_text_receive:1, pref_text_accept:1, sms: 1, slack: 1}, function(err,user){
      res.json(user);
   });
});

// assumed only called by winner of bet
router.post('/setpaid', requireLogin, function(req,res){
   Bets.findByIdAndUpdate({_id:req.body.id}, {paid: true}, function(err, single){
      if(err){
         console.log(err);
      } else {    // need to also mark debt flag in user db for notifications
         if(single.user1 != req.session.user._id){
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
         console.log('Bet#'+req.body.id+' marked paid by '+req.session.user._id+' - '+new Date());
         res.send({'type':'success', 'message':'Bet marked paid'});
      }
   });
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

router.post('/getfutureoffers', requireLogin, function(req,res){
   Bets.find({$and:[{status: req.body.status}, {$or: [{type: 'give'}, {type: 'take'}]}]}, function(err, offers){
      res.json({
         sessionId: req.session.user._id,
         offers: offers
      });
   });
});

router.get('/nflodds', function (req, res) {
   res.sendFile('./json/nfl_info.json', {'root':__dirname+'/..'});
});

router.get('/nbaodds', function (req, res) {
   res.sendFile('./json/nba_info.json', {'root':__dirname+'/..'});
});

router.get('/getfutures', function (req, res) {
   res.sendFile('./json/futures.json', {'root':__dirname+'/..'});
});

// gets userlist for bet select list
router.get('/users', requireLogin, function(req,res){
   Users.find({_id: {$ne:req.session.user}}, {_id: 1}, function(err,user){
      res.json(user);
   }).sort({_id:1});
});

// called when new page is loaded
router.get('/doorbell', requireLogin, function(req,res){
   var answer = {
      type: 'message',
      // username: req.session.user._id
      };
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
   // var msgPromise = new Promise(function (resolve, reject) {
   //    var today = new Date();
   //    Messages.findOne({date: {$gte: today.setDate(today.getDate()-2)}}, function(err, message) {
   //       if (err)
   //          reject(err);
   //       if (message) {
   //          answer.msgboard = true;
   //       }
   //       resolve();
   //    });
   // });
   var futuresPromise = new Promise(function (resolve, reject) {
      var today = new Date();
      Bets.findOne({$and:[{status: 0},{$or: [{type: 'give'}, {type: 'take'}]}]}, function(err, future) {
         if (err)
            reject(err);
         if (future) {
            answer.futures = true;
         }
         resolve();
      });
   });
   Promise.all([betsPromise, futuresPromise]).then(function(values){
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

function textUser(to, from, message, pref2){
   Users.findOne({_id: to}, function(err,user){
      if (err) {
         console.log(err);
      } else {
         if((user.pref_text_receive && !pref2) || (user.pref_text_accept && pref2)){
            sinchSms.sendMessage('+1'+user.sms, '2DB - ' + message + ' - http://2dollarbets.com/bets');

         // sms.send_message({
         //    src: '+16622193664',
         //    dst: '+1'+user.sms,
         //    text: 'B.A.F. - ' + message + from + ' - http://2dollarbets.com/bets'
         // }, function (status, response) {
         //    console.log('API Response:\n', response);
         // });
         }
      }
   });
}

var seasonStart = new Date(2016,8,7);
var nflWeeks = [];
var dst = 0;
for (var i=0;i<22;i++){
   if (i > 7)
      dst = 3600000;
   nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+dst));
}

function getWeek(date){
   var wk;
   for (var i=0;i<22;i++){
      if (date > nflWeeks[i] && date < nflWeeks[i+1]) {
         wk = i+1;
         break;
      }
   }
   return wk;
}
