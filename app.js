var crontab = require('node-crontab');
var express = require('express');
var exec = require('child_process').exec;
var app = express();
var routes = require('./routes/index');
app.use('/',routes);
app.use('/', express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', './views');

var scraper = require('./models/scraper');

var oddsId = crontab.scheduleJob("0 8-22 * * *", scraper.refreshOddsInfo);
var clearUnactedId = crontab.scheduleJob("*/10 12-21 * * *", scraper.clearUnactedBets);
var checkNflScoresId = crontab.scheduleJob("*/10 19,22 * * 0,6", scraper.checkScores,['nfl']);
var checkNbaScoresId = crontab.scheduleJob("*/15 19-23 * * *", scraper.checkScores,['nba']);
var tallyBetsId = crontab.scheduleJob("10 19,23 * * 0,6", scraper.tallyBets);
var clearRefusedId = crontab.scheduleJob("30 9 * * 2", scraper.clearRefusedBets);

var backupId = crontab.scheduleJob('0 3 * * 3', function () {
   now = new Date();
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
