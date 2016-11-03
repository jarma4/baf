var express = require('express'),
// Auth = require('./auth'),
router = express.Router();

module.exports = router;

// Main page renderings
router.get('/', function(req, res) {
   res.render('nfl', {pagename:'NFL'});  // pagename not used now
});

router.get('/nba', function(req, res) {
   res.render('nba', {pagename:'NBA'});  // pagename not used now
});

router.get('/bets', function(req, res) {
   res.render('bets', {pagename:'Bets'});
});

router.get('/nfl2', function(req, res) {
   res.render('nfl2', {pagename:'NFL'});  // pagename not used now
});

router.get('/bets2', function(req, res) {
   res.render('bets2', {pagename:'Bets'});
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

router.get('/overunder', function(req, res) {
   res.render('overunder', {pagename:''});
});

router.get('/options', function(req, res) {
   res.render('options', {pagename:''});
});

router.get('/futures', function(req, res) {
   res.render('futures', {pagename:''});
});

router.get('/login', function(req, res) {
   res.render('login', {pagename:''});
});

router.get('/test', function(req, res) {
   res.render('test', {pagename:''});
});
