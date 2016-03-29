var express = require('express'),
   app = express(),
   crontab = require('node-crontab'),
   exec = require('child_process').exec,
   compression = require('compression');

// load different routes
var routes = require('./routes/index'),
   api = require('./routes/api'),
   admin = require('./routes/admin');
app.use('/', routes);
app.use('/api', api);
app.use('/admin', admin);

// enable middleware
app.use(compression());
app.use('/', express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', './views');

// manage data gathering via scraper model and schedule
var scraper = require('./models/scraper');

var oddsId = crontab.scheduleJob("0 6-15 * * *", scraper.refreshOddsInfo);
var oddsId2 = crontab.scheduleJob("*/10 15-22 * * *", scraper.refreshOddsInfo);
var clearUnactedId = crontab.scheduleJob("*/10 17-22 * * *", scraper.clearUnactedBets);
// var checkNflScoresId = crontab.scheduleJob("*/10 19,22 * * 0,6", scraper.checkScores,['nfl']);
var checkNbaScoresId = crontab.scheduleJob("*/10 0-1,19-23 * * *", scraper.checkScores,['nba']);
var tallyBetsId = crontab.scheduleJob("*/15 0-1,6-9,19-23 * * *", scraper.tallyBets);

var clearRefusedId = crontab.scheduleJob("0 22 * * *", scraper.clearRefusedBets);

var updateStandingsId = crontab.scheduleJob("0 6 * * *", scraper.updateStandings);

var backupOddsId = crontab.scheduleJob('0 22 * * *', function () {
   var now = new Date();
   var cmd = exec('cp nba_info.json odds_backup/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate()+'_nba_info.json', function(error, stdout, stderr) {
      if (error || stderr)
         console.log(error);
         console.log(stderr);
      });
   console.log('Odds backup - '+now);
});

// backup mongo datbases
var backupDbId = crontab.scheduleJob('0 3 * * 3', function () {
   var now = new Date();
   var cmd = exec('mongodump -d baf -o db_backups/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
      if (error || stderr)
         console.log(error);
         console.log(stderr);
      });
   console.log('DB backup - '+now);
});

var server = app.listen(8083, function () {
   console.log('App listening at on port 8083');
});
