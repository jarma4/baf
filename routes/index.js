var express = require('express'),
// Auth = require('./auth'),
router = express.Router(),
session = require('client-sessions'),
Users = require('../models/dbschema').Users,
mongoose = require('mongoose');

require('dotenv').config()

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf');

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

module.exports = router;

// Main page renderings
router.get('/', function(req, res) {
    if(req.user) {
        Users.findOne({_id: req.session.user._id}, {pref_default_page: 1}, function(err,user){
            res.render(user.pref_default_page);
        }).sort({_id:1});
    } else {
        res.render('odds');
    }
});

router.get('/odds', function(req, res) {
    res.render('odds', {pagename:'odds'});
 });

 router.get('/bets', function(req, res) {
    res.render('bets', {pagename:'bets'});
 });

router.get('/stats', function(req, res) {
   res.render('stats', {pagename:'stats'});
});

router.get('/messageboard', function(req, res) {
   res.render('msg', {pagename:'msg'});
});

router.get('/scores', function(req, res) {
   res.render('scores', {pagename:'scores'});
});

router.get('/props', function(req, res) {
   res.render('props', {pagename:'props'});
});

router.get('/overunder', function(req, res) {
   res.render('overunder', {pagename:'overunder'});
});

router.get('/options', function(req, res) {
   res.render('options', {pagename:'options'});
});

router.get('/futures', function(req, res) {
   res.render('futures', {pagename:'futures'});
});

router.get('/login', function(req, res) {
   res.render('login', {pagename:'login'});
});

router.get('/log', function(req, res) {
   res.render('log', {pagename:'log'});
});
