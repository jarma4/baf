var express = require('ultimate-express'),
// Auth = require('./auth'),
router = express.Router(),
session = require('client-sessions'),
Users = require('../models/dbschema').Users,
mongoose = require('mongoose');

router.use(session({
    cookieName: 'session',
    secret: process.env.BAF_SESSION,
    duration: 14 * 24 * 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

router.use(async (req, res, next) => {
	if (req.session && req.session.user) {
      try{
         const user = await Users.findOne({ _id: req.session.user._id });
         if (user) {
            req.user = user;
            if (user.secure != undefined) {
               JSON.parse(user.secure).pages.forEach(page => {
                  req[page] = true;
               });
            }
            delete req.user.password;
            req.session.user = user;
            res.locals.user = user;
         }
         next();
      } catch (err){
         console.log(err);
      }
   } else {
      next();
   }
});

function checkAccess (req, res, next) {
	if (!req[req.route.path.slice(1)]) {
		res.render('noauth');
	} else {
		next();
	}
}

module.exports = router;

// Main page renderings
router.get('/', async (req, res) => {
    if(req.user) {
      try {
         const user = await Users.findOne({_id: req.session.user._id}, {pref_default_page: 1}).sort({_id:1});
         res.render(user.pref_default_page);
      } catch (err){
         console.log(err);
      }
    } else {
        res.render('odds');
    }
});

router.get('/odds', (req, res) =>  {
    res.render('odds', {pagename:'odds'});
 });

 router.get('/bets', (req, res) =>  {
    res.render('bets', {pagename:'bets'});
 });

router.get('/stats', (req, res) =>  {
   res.render('stats', {pagename:'stats'});
});

router.get('/props', (req, res) =>  {
   res.render('props', {pagename:'props'});
});

router.get('/overunder', (req, res) =>  {
   res.render('overunder', {pagename:'overunder'});
});

router.get('/options', (req, res) =>  {
   res.render('options', {pagename:'options'});
});

router.get('/futures', (req, res) =>  {
   res.render('futures', {pagename:'futures'});
});

router.get('/login', (req, res) =>  {
   res.render('login', {pagename:'login'});
});

router.get('/test', (req, res) =>  {
   res.render('test', {pagename:'test'});
});

router.get('/btagame', (req, res) =>  {
   res.render('btagame', {pagename:'btaame'});
});

router.get('/tourney', (req, res) =>  {
   res.render('tourney', {pagename:'tourney'});
});

router.get('/tracker', checkAccess, (req, res) =>  {
   res.render('tracker', {pagename:'tracker'});
});

router.get('/noauth',  (req, res) =>  {
   res.render('noauth', {pagename:'noauth'});
});

