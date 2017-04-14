var express = require('express'),
   router = express.Router(),
   bodyParser = require('body-parser'),
   session = require('client-sessions'),
   bcrypt = require('bcrypt'),
   Records = require('../models/dbschema').Records,
   Users = require('../models/dbschema').Users;

router.use(session({
     cookieName: 'session',
     secret: process.env.BAF_SESSION,
     duration: 5 * 24 * 60 * 60 * 1000,
     activeDuration: 5 * 60 * 1000,
   }));
router.use(bodyParser.urlencoded({ extended: false }));

router.post('/login', function(req,res){
   Users.findOne({'_id':req.body.username}, function(err, user){
      if(!user){
         console.log('User '+req.body.username+' not found');
         res.send({'type':'danger', 'message':'No user with that username'});
      } else {
         bcrypt.compare(req.body.password, user.password, function(err, result){
            if (result){
               req.session.user = user;
               console.log('User '+req.session.user._id+' password correct - '+new Date());
               res.send({'type':'success', 'message':'Login Successful'});
               // res.redirect('/');
            } else {
               console.log('Password '+req.body.password+' not correct - '+new Date());
               res.send({'type':'danger', 'message':'Password incorrect'});
            }
         });
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
         // create record entry in db
         var sports = ['nfl', 'nba'];
         for (var i=0; i < sports.length; i++) {
            new Records({
               user: req.body.username,
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
         console.log('Registration successful');
         req.session.user = newuser;  // login new user by giving session
         res.send({'type':'success', 'message':'Registration Successful'});
      }
   });
});

// utility pages
router.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

module.exports = router;
