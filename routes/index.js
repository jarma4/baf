var express = require('express'),
// Auth = require('./auth'),
router = express.Router();

module.exports = router;

// Main page renderings
router.get('/', function(req, res) {
   res.render('odds', {pagename:'odds'});  // pagename not used now
});

// router.get('/nba', function(req, res) {
//    res.render('nba', {pagename:'NBA'});  // pagename not used now
// });

router.get('/bets', function(req, res) {
   res.render('bets', {pagename:'bets'});
});

router.get('/stats', function(req, res) {
   res.render('stats', {pagename:'stats'});
});

router.get('/messageboard', function(req, res) {
   res.render('msg', {pagename:'msgboard'});
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

router.get('/test', function(req, res) {
   res.render('test', {pagename:'test'});
});
