// var router = require('./api'),
var express = require('express'),
bodyParser = require('body-parser'),
session = require('client-sessions'),
Users = require('../models/dbschema').Users,
mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1/baf');

router = express.Router();

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
         console.log('user found');
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

module.exports = {
   router: router,
   requireLogin: function (req, res, next) {
      console.log('in auth');
      if (!req.user) {
         console.log('no auth');
         res.redirect('/login');
         // res.send({'type':'command', 'message':'$("#loginModal").modal()'});
      } else {
         next();
      }
   }
};
