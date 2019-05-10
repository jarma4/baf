var express = require('express'),
   router = express.Router(),
   bodyParser = require('body-parser'),
   fs = require('fs'),
   logger = require('pino')(fs.createWriteStream('./baf.log', {'flags': 'a'})),
   session = require('client-sessions'),
   bcrypt = require('bcryptjs'),
   Records = require('../models/dbschema').Records,
   Users = require('../models/dbschema').Users,
   Mailer = require('nodemailer');

require('dotenv').config()

router.use(session({
     cookieName: 'session',
     secret: process.env.BAF_SESSION,
     duration: 5 * 24 * 60 * 60 * 1000,
     activeDuration: 5 * 60 * 1000,
   }));
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post('/login', function(req,res){
//   console.log(req);
   Users.findOne({'_id':req.body.username}, function(err, user){
      if(!user){
         logger.error('User '+req.body.username+' not found');
         res.send({'type':'danger', 'message':'No user with that username'});
      } else {
         bcrypt.compare(req.body.password, user.password, function(err, result){
            if (result){
               req.session.user = user;
               logger.debug('User '+req.session.user._id+' login');
               res.send({'type':'success', 'message':'Login Successful'});
               // res.redirect('/');
            } else {
               logger.warn('User '+req.body.username+' password not correct');
               res.send({'type':'danger', 'message':'Password incorrect'});
            }
         });
      }
   });
});

router.post('/register', function(req,res){
   let transporter = Mailer.createTransport({
      host: 'mail.mygrande.net',
      port: 587,
      secure: false,
      auth: {
          user: 'odb@mygrande.net',
          pass: process.env.BAF_ODB
      },
      tls: {
         rejectUnauthorized: false
      }
   });

    // Message object
    let message = {
        // Comma separated list of recipients
        to: 'tony@jarnigan.net',
        from: 'odb@mygrande.net',
        subject: '2DB New Registration',
        text: '',
        html: '<h3>New User Registration</h3><ul><li>Username: </li>'+req.body.username+'<li>Email: '+req.body.email+'</li><li>SMS: '+req.body.sms+'</li><li>Password: '+req.body.password+'</li></ul>'
    };

    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log('Error occurred: '+error.message);
            return process.exit(1);
        }
        res.send({'type':'success', 'message':'Registration request sent to Admin, confirmation will be sent when approved.'});
      //   Logger.info('New registration email sent');
      //   console.log(Mailer.getTestMessageUrl(info));
    });
   // var newuser = new Users({
   //    _id: req.body.username,
   //    sms: req.body.sms,
   //    password: req.body.password,
   //    bets: 0,
   //    debts: 0,
   //    pref_include_everyone : 1,
   //    pref_text_receive : 1,
   //    pref_text_accept : 0,
   // });
   // newuser.save(function(err){
   //    if (err){
   //       var message = 'Something happened';
   //       if (err.code === 11000 ){
   //          message = 'Username '+req.body.username+' already exists';
   //       }
   //       console.log(err);
   //       res.send({'type':'danger', 'message':message});
   //    } else {
   //       // create record entry in db
   //       var sports = ['nfl', 'nba'];
   //       for (var i=0; i < sports.length; i++) {
   //          new Records({
   //             user: req.body.username,
   //             year: new Date().getFullYear(),
   //             sport: sports[i],
   //             win: 0,
   //             loss: 0,
   //             push : 0,
   //          }).save(function(err){
   //             if (err){
   //                console.log(err);
   //             }
   //          });
   //       }
   //       console.log('Registration successful');
   //       req.session.user = newuser;  // login new user by giving session
   //       res.send({'type':'success', 'message':'Registration Successful'});
   //    }
   // });
});

// utility pages
router.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

module.exports = router;
