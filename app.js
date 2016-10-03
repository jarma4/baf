var express = require('express'),
   app = express(),
   crontab = require('node-crontab'),
   exec = require('child_process').exec,
  // auth = require('./routes/auth'),
   compression = require('compression');
   // bodyParser = require('body-parser'),
   // session = require('client-sessions'),
   // Users = require('./models/dbschema').Users,
   // mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1/baf');

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(session({
//   cookieName: 'session',
//   secret: 'lkjhsd8fasdfkh@ljkkljWljOlkjl3344',
//   duration: 14 * 24 * 60 * 60 * 1000,
//   activeDuration: 5 * 60 * 1000,
// }));
//
// app.use(function (req, res, next) {
//   if (req.session && req.session.user) {
//     Users.findOne({ _id: req.session.user._id }, function (err, user) {
//       if (user) {
//          console.log('user found');
//         req.user = user;
//         delete req.user.password;
//         req.session.user = user;
//         res.locals.user = user;
//       }
//       next();
//     });
//   } else {
//     next();
//   }
// });
//
// function requireLogin(req, res, next) {
//    // console.log('in auth');
//    if (!req.user) {
//       console.log('no auth');
//       res.redirect('/login');
//       // res.send({'type':'command', 'message':'$("#loginModal").modal()'});
//    } else {
//       next();
//    }
// }


// enable middleware
app.use(compression());
app.use('/', express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', './views');

// load different routes
var routes = require('./routes/index'),
api = require('./routes/api'),
admin = require('./routes/admin');
app.use('/', routes);
app.use('/api', api);
app.use('/admin', admin);

// manage data gathering via scraper model and schedule
var scraper = require('./models/scraper');

// schedule worker jobs
var oddsId = crontab.scheduleJob("*/10 7-22 * * *", scraper.refreshOddsInfo),
   // oddsId2 = crontab.scheduleJob("*/10 9-22 * * 0", scraper.refreshOddsInfo),
   clearUnactedId = crontab.scheduleJob("*/10 12-22 * * *", scraper.clearUnactedBets),
   checkNflScoresId = crontab.scheduleJob("*/10 0,6-9,15,19,22-23 * * 0,1,4", scraper.checkScores,['nfl']),
//    checkNbaScoresId = crontab.scheduleJob("*/10 0,19-23 * * *", scraper.checkScores,['nba']),
   tallyBetsId = crontab.scheduleJob("*/10 0,6-9,15,19,21-23 * * 0,1,4", scraper.tallyBets),
   clearRefusedId = crontab.scheduleJob("0 22 * * *", scraper.clearRefusedBets);
//    updateStandingsId = crontab.scheduleJob("0 6 * * *", scraper.updateStandings);

// backup daily odds
var backupOddsId = crontab.scheduleJob('0 22 * * 0,1,4', function () {
   var now = new Date();
   var cmd = exec('cp nfl_info.json backup/odds/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate()+'_nfl_info.json', function(error, stdout, stderr) {
      if (error || stderr)
         console.log(error);
         console.log(stderr);
      });
   console.log('Odds backup - '+now);
});

// backup mongo datbases
var backupDbId = crontab.scheduleJob('49 17 * * 4', function () {
   var now = new Date();
   var cmd = exec('mongodump -d baf -o backup/databases/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
      if (error || stderr)
         console.log(error);
         console.log(stderr);
      });
   console.log('DB backup - '+now);
});

var server = app.listen(8083, function () {
   console.log('App listening at on port 8083');
});
