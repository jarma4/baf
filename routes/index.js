var express = require('express'),
router = express.Router();

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

router.get('/test', function(req, res) {
   res.render('test', {pagename:''});
});
module.exports = router;
