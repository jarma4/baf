const https = require('https'),
      express = require('express'),
      fs = require('fs'),
      crontab = require('node-crontab'),
      exec = require('child_process').exec,
		compression = require('compression'),
		Util = require('./models/util');

require('dotenv').config()

// http site
const app_http = express();
app_http.use(compression());
// app_http.use('/', express.static(__dirname + '/public'));
app_http.get('*', function(req, res){
	// res.sendfile('./public/react.html');
   res.redirect(301, 'https://2dollarbets.com');
});
app_http.listen(80, function(){
   console.log('redirecting on port 80');
});

// https site
const app_https = express();
app_https.use(compression());
app_https.use('/', express.static(__dirname + '/public'));
app_https.use('/js', express.static(__dirname + '/public/js'));
app_https.use('/css', express.static(__dirname + '/public/css'));
app_https.use('/images', express.static(__dirname + '/public/images', {maxage: '1h'}));
app_https.use('/fonts', express.static(__dirname + '/public/fonts', {maxage: '1h'}));
app_https.set('view engine', 'pug');
app_https.set('views', './views');

// load different routes
const routes = require('./routes/index'),
      api = require('./routes/api'),
      admin = require('./routes/admin');
app_https.use('/', routes);
app_https.use('/api', router);
app_https.use('/admin', admin);

const options = {
   cert: fs.readFileSync('./sslcert/fullchain.pem'),
   key: fs.readFileSync('./sslcert/privkey.pem')
};

https.createServer(options, app_https).listen(443, function () {
   console.log('listening at on port 443');
});

// manage data gathering via scraper model and schedule
const scraper = require('./models/scraper');

// schedule worker jobs
const oddsCron = crontab.scheduleJob("*/10 7-22 * * *", scraper.refreshOddsInfo),
   checkScoresNflCron = crontab.scheduleJob("*/6 0,15-23 * * 0,1,4", scraper.checkScores,['nfl']),
   tallyBetsNflCron = crontab.scheduleJob("*/10 15-23 * * 0,1,4", scraper.tallyBets,['nfl']),
   checkScoresNbaCron = crontab.scheduleJob("*/6 0,20-23 * * *", scraper.checkScores,['nba']),
   tallyBetsNbaCron = crontab.scheduleJob("*/10 0,20-23 * * *", scraper.tallyBets,['nba']),
   clearUnactedCron = crontab.scheduleJob("*/10 12-22 * * *", scraper.clearUnactedBets),
   dailyCleaningCron = crontab.scheduleJob("0 23 * * *", scraper.dailyCleaning);
   updateStandingsCron = crontab.scheduleJob("0 6 * * 1,2", scraper.updateStandings,['nfl']);
   updateStandingsCron = crontab.scheduleJob("0 6 * * *", scraper.updateStandings,['nba']);
   publishAtsCron = crontab.scheduleJob("0 18 * * 5", scraper.publishAtsOdds);
   addAtsCron = crontab.scheduleJob("*/10 15-23 * * 0,1", scraper.addAtsScores,[2018, Util.getWeek(new Date(), 'nfl')]);
   tallyAtsCron = crontab.scheduleJob("0 7 * * 2", scraper.tallyAts,[2018, Util.getWeek(new Date(), 'nfl')]);

const backupsCron = crontab.scheduleJob('0 1 * * 0', function () {
	const now = new Date();
	// copy mongo db's to backup area
   var cmd = exec('mongodump -dbaf -ubaf -p'+process.env.BAF_MONGO+' -o backup/databases/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), function(error, stdout, stderr) {
      if (error || stderr) {
         console.log(error);
         console.log(stderr);
      }
	});
	// move weekly ATS game odds file to backup area
	cmd = exec('mv json/ats_* backup/ats', function(error, stdout, stderr) {
      if (error || stderr) {
         console.log(error);
         console.log(stderr);
      }
	});
   console.log('Backups - '+now);
});


