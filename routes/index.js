var express = require('express'),
bodyParser = require('body-parser'),
session = require('client-sessions'),
// session = require('express-session'),
Users = require('../models/dbschema').Users,
Bets = require('../models/dbschema').Bets,
Scores = require('../models/dbschema').Scores,
Messages = require('../models/dbschema').Messages,
Props = require('../models/dbschema').Props,
Standings = require('../models/dbschema').Standings,
Promise = require('promise'),
// plivo = require('plivo'),
sinchAuth = require('../models/sinch-auth'),
sinchSms = require('../models/sinch-messaging'),
mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/baf');

// var sms = plivo.RestAPI({
//   authId: 'MANJRMMDLJYME1MMYYOG',
//   authToken: 'ZjcyZmI5MGVhMGFlMWIzNWEyYzg0ZDFiOWJmMmUw'
// });
var auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', 'nhnHg5UWKECMfk59XBSIjw==');

router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(session({
  cookieName: 'session',
  secret: 'lkjhsd8fasdfkh@ljkkljWljOlkjl3344',
  duration: 5 * 24 * 60 * 60 * 1000,
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

router.post('/makebet', requireLogin, function (req, res) {
   fta_id = Math.random();
   if ((req.body.user2 === 'EVERYONE' || req.body.user2 === 'EVERYONE2') && !req.body.later) {
      Users.find({_id: {$nin:[req.session.user._id,'testuser']}, pref_include_everyone: true}, {_id: 1}, function(err, users){
         users.forEach(function(single) {
            new Bets({
               date: new Date(),
               user1: req.session.user._id,
               user2: single,
               odds: req.body.odds,
               type: req.body.type,
               team1: req.body.team1,
               team2: req.body.team2,
               amount: req.body.amount,
               status: 0,
               paid: false,
               fta: (req.body.user2 === 'EVERYONE2')?fta_id:0,
               week: getWeek(new Date()),
               gametime: req.body.gametime,
               sport: req.body.sport
            }).save(function(err){
               if(err) {
                  console.log('Trouble adding bet');
                  res.send({'type':'danger', 'message':'Trouble adding bet'});
               } else {
                  console.log('Bet added: user1='+req.session.user._id+" user2="+single+" picks="+req.body.team1+" odds="+req.body.odds+" amount=$"+req.body.amount+((req.body.user2 === 'EVERYONE2')?'(fta)':''));
               }
            });
            if (!req.body.later) {
               changeUser (single, 'bets', 1);
               textUser(single, req.session.user._id, 'You have a new '+((req.body.sport==='nfl')?'NFL':'NBA')+' bet from ');
            }
         });
         // res.send({'type':'success', 'message':(req.body.later)?'Bet saved':'Bet Sent'});
      });
   } else {
      new Bets({
         date: new Date(),
         user1: req.session.user._id,
         user2: req.body.user2,
         odds: req.body.odds,
         type: req.body.type,
         team1: req.body.team1,
         team2: req.body.team2,
         amount: req.body.amount,
         status: (req.body.later)?((req.body.sport==='nfl')?-1:-2):0,
         paid: false,
         week: getWeek(new Date()),
         gametime: req.body.gametime,
         sport: req.body.sport
      }).save(function(err){
         if(err) {
            console.log('Trouble adding bet');
            res.send({'type':'danger', 'message':'Trouble adding bet'});
         } else {
            console.log('Bet added: user1='+req.session.user._id+" user2="+req.body.user2+" picks="+req.body.team1+" odds="+req.body.odds+" amount=$"+req.body.amount);
            res.send({'type':'success', 'message':(req.body.later)?'Bet saved':'Bet Sent'});
         }
      });
      if (!req.body.later) {
         changeUser (req.body.user2, 'bets', 1);
         textUser(req.body.user2, req.session.user._id, 'You have a new '+((req.body.sport==='nfl')?'NFL':'NBA')+' bet from ');
      }
   }
});

router.post('/getbets', requireLogin, function(req,res){
   var sortedBets = [];
   Bets.find({$and:[{status:req.body.status},(Number(req.body.all))?{$and:[{user1:{$ne: req.session.user._id}},{user2: {$ne: req.session.user._id}}]}:{$or:[{user1: req.session.user._id},{user2: req.session.user._id}]}]},function(err,bets){
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
               if (single.type === 'spread' && single.odds < 0)
                  single.odds = Math.abs(single.odds);
               else if (single.type === 'spread')
                  single.odds = -Math.abs(single.odds);
               if (single.type === 'over')
                  single.type = 'under';
               else if (single.type === 'under')
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
         Bets.remove({_id:req.body.id}, function(err){
            if(err)
               console.log(err);
            else {
               console.log('Bet _id='+req.body.id+' deleted - '+new Date());
               res.send({'type':'success', 'message':'Saved bet deleted'});
            }
         });
         break;
      case '2':
         Bets.findByIdAndUpdate(req.body.id,{status: req.body.status, comment:req.body.comment}, function(err, acceptedBet){
            if(acceptedBet){
               console.log('Bet'+((acceptedBet.fta)?'(fta)':'')+' _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
               res.send({'type':'success', 'message':'Reply Sent'});
               changeUser(req.session.user._id, 'bets', -1);
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
            if(err)
               console.log(err);
            else {
               if (bet.user2 === 'EVERYONE') {
                  Users.find({_id: {$nin:[req.session.user._id,'testuser']}, pref_include_everyone: true}, {_id: 1}, function(err, users){
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
                           status: 0,
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
                        textUser(single, req.session.user._id, 'You have a new bet from ');
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
                              textUser(bet.user2, req.session.user._id, 'You have a new bet from ');
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
   Bets.find({$and:[{date:{$gt:new Date().setHours(0,0)-(1000*60*60*24*5)}},{status: {$in:[4,5,6]}}]}, function(err,complete){
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
               if (single.status === 4)
                  single.status = 5;
               else if (single.status === 5)
                  single.status = 4;
            }
            sortedBets.push(single);
         });
         res.json(sortedBets);
      }
   }).sort({date: -1});
});

router.get('/overallstats', requireLogin, function(req,res){
   Users.find({_id:{$ne: 'testuser'}}, function(err,stats){
      if (err)
         console.log(err);
      else
         res.json(stats);
   });
});

router.post('/userstats', requireLogin, function(req,res){
   Bets.find({$and:[{$or:[{user1: req.body.user},{user2: req.body.user}]}, {status:{$in:[4,5,6]}}]}, function(err,bets){
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

router.get('/msgboard', requireLogin, function(req,res){
   Messages.find(function(err,message){
      res.json(message);
   }).limit(50).sort({date: -1});
});

router.post('/getscores', requireLogin, function(req,res){
   if (req.body.sport==='nfl')
      Scores.find({sport:'nfl', week: req.body.period, year: Number(req.body.year)}, function(err,scores){
         if(err){
            console.log(err);
         } else {
            res.json(scores);
         }
      });
   else {
      Scores.find({$and: [{sport:'nba'}, {date:{$gt:new Date(req.body.period).setHours(0,0)}}, {date:{$lt:new Date(req.body.period).setHours(23,59)}}]}, function(err,scores){
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
   Standings.find({}, function(err,standings){
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
   Users.findOne({_id: req.session.user}, {_id:1,  pref_include_everyone:1, pref_text_receive:1, pref_text_accept:1, sms: 1}, function(err,user){
      res.json(user);
   });
});

router.post('/setpaid', requireLogin, function(req,res){
   Bets.findByIdAndUpdate({_id:req.body.id}, {paid: true}, function(err, single){
      if(err){
         console.log(err);
      } else {
         if(single.user1 != req.session.user._id){
            var tmp = single.user1;
            var tmp2 = single.team1;
            single.user1 = single.user2;
            single.team1 = single.team2;
            single.user2 = tmp;
            single.team2 = tmp2;
         }
         Users.update({_id: single.user1}, {$inc:{debts: -2}}, function (err) {
            if(err)
               console.log(err);
         });
         Users.update({_id: single.user2}, {$inc:{debts: 1}}, function (err) {
            if(err)
               console.log(err);
         });
         console.log('Bet#'+req.body.id+' marked paid by '+req.session.user._id+' - '+new Date());
         res.send({'type':'success', 'message':'Bet marked paid'});
      }
   });
});

router.get('/getdebts', requireLogin, function(req,res){
   var sortedBets = [];
   Bets.find({$and:[{$or:[{user1: req.session.user},{user2: req.session.user}]},{status:{$in:[4,5]}}, {paid:false}]}, function(err,bets){
      bets.forEach(function(single){
         if (single.user1 != req.session.user._id){
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
   }).sort({date: -1}).limit(20);
});

router.get('/nflodds', function (req, res) {
   res.sendFile('./nfl_info.json', {'root':'/home/common/baf/'});
});

router.get('/nbaodds', function (req, res) {
   res.sendFile('./nba_info.json', {'root':'/home/common/baf/'});
});

// utility pages
router.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

// gets userlist for bet select list
router.get('/users', requireLogin, function(req,res){
   Users.find({_id: {$ne:req.session.user}}, {_id: 1}, function(err,user){
      res.json(user);
   }).sort({_id:1});
});

// called when new page is loaded
router.get('/doorbell', requireLogin, function(req,res){
   var answer = {type: 'message'};
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
   var msgPromise = new Promise(function (resolve, reject) {
      var today = new Date();
      Messages.findOne({date: {$gte: today.setDate(today.getDate()-2)}}, function(err, message) {
         if (err)
            reject(err);
         if (message) {
            answer.msgboard = true;
         }
         resolve();
      });
   });
   Promise.all([betsPromise, msgPromise]).then(function(values){
      res.send(answer);
   });
});

// Main page renderings
router.get('/', function(req, res) {
   res.render('nba', {pagename:'NBA'});  // pagename not used now
});

router.get('/nfl', function(req, res) {
   res.render('nfl', {pagename:'NFL'});  // pagename not used now
});

router.get('/bets', function(req, res) {
   res.render('bets', {pagename:'Bets'});
});

router.get('/stats', function(req, res) {
   res.render('stats', {pagename:'Stats'});
});

router.get('/messageboard', function(req, res) {
   res.render('msg', {pagename:'MshBoard'});
});

router.get('/scores', function(req, res) {
   res.render('scores', {pagename:'Scores'});
});

router.get('/props', function(req, res) {
   res.render('props', {pagename:'Prop Bets'});
});

router.get('/standings', function(req, res) {
   res.render('standings', {pagename:''});
});

router.get('/options', function(req, res) {
   res.render('options', {pagename:''});
});

router.post('/login', function(req,res){
   Users.findOne({'_id':req.body.username}, function(err, user){
      if(!user){
         console.log('User '+req.body.username+' not found');
         res.send({'type':'danger', 'message':'No user with that username'});
      } else {
         if (req.body.password === user.password){
            req.session.user = user;
            console.log('User '+req.session.user._id+' password correct');
            res.send({'type':'success', 'message':'Login Successful'});
         } else {
            console.log('Password '+req.body.password+' not correct');
            res.send({'type':'danger', 'message':'Password incorrect'});
         }
      }
   });
});

router.post('/register', function(req,res){
   var newuser = new Users({
      _id: req.body.username,
      sms: req.body.sms,
      password: req.body.password,
      bets: 0,
      debts: 0,
      nfl_win: 0,
      nfl_loss: 0,
      nfl_push: 0,
      nba_win: 0,
      nba_loss: 0,
      nba_push: 0,
      pref_include_everyone : 1,
      pref_text_receive : 1,
      pref_text_accept : 0,
   });
   newuser.save(function(err){
      if (err){
         var message = 'Something happened';
         if (err.code === 11000 ){
            message = 'Username '+req.body.username+' already exists';
         }
         console.log(err);
         res.send({'type':'danger', 'message':message});
      } else {
         console.log('Registration successful');
         req.session.user = newuser;  // login new user by giving session
         res.send({'type':'success', 'message':'Registration Successful'});
      }
   });
});

function requireLogin (req, res, next) {
   // console.log('requirelogin'+req.user);
   if (!req.user) {
      // console.log('requirelogin not user, sending command');
      res.send({'type':'command', 'message':'$("#loginModal").modal()'});
   } else {
      next();
   }
}

module.exports = router;

function changeUser(user, key, inc) {
   var tmp = {};
   tmp[key] = inc;
   Users.update({_id: user}, {$inc: tmp}, function(err){
      if(err)
         console.log('Trouble with changing user '+key);
   });
}

function textUser(to, from, message){
   Users.findOne({_id: to}, function(err,user){
      if (err)
         console.log(err);
      else
         if(user.pref_text_receive)
            sinchSms.sendMessage('+1'+user.sms, 'B.A.F. - ' + message + from + ' - http://jarnigan.net:8083/bets');
         // sms.send_message({
         //    src: '+16622193664',
         //    dst: '+1'+user.sms,
         //    text: 'B.A.F. - ' + message + from + ' - http://jarnigan.net:8083/bets'
         // }, function (status, response) {
         //    console.log('API Response:\n', response);
         // });
   });
}

var seasonStart = new Date(2015,8,8);
var nflWeeks = [];
var dst = 0;
for (var i=0;i<22;i++){
   if (i > 7)
      dst = 3600000;
   nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+dst));
}

function getWeek(date){
   var wk;
   for (i=0;i<22;i++){
      if (date > nflWeeks[i] && date < nflWeeks[i+1]) {
         wk = i+1;
         break;
      }
   }
   return wk;
}
