const https = require('https'),
      express = require('express'),
      fs = require('fs'),
      crontab = require('node-crontab'),
      exec = require('child_process').exec,
		compression = require('compression'),
		Util = require('./models/util');

// process.traceDeprecation = true;

require('dotenv').config()

// http site
const app_http = express();
app_http.use(compression());
app_http.use('/', express.static(__dirname + '/public'));
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
const oddsCron = crontab.scheduleJob("*/5 7-23 * * *", scraper.refreshOddsInfo);
// const oddsCron2 = crontab.scheduleJob("* 19-22 * * *", scraper.refreshOddsInfo);
const clearUnactedCron = crontab.scheduleJob("*/5 12-22 * * *", scraper.clearUnactedBets);
const dailyCleaningCron = crontab.scheduleJob("29 17 * * *", scraper.dailyCleaning);

// for NFL
// const tallyBetsNflCron = crontab.scheduleJob("*/6 15-23 * * 0", scraper.tallyBets2,['nfl']);

// for NBA
// const tallyBetsNbaCron = crontab.scheduleJob("*/5 0,20-23 * * *", scraper.tallyBets2,['nba']);
// const checkHalftimeNbaCron = crontab.scheduleJob("* 19-22 * * *", scraper.getHalftimeScores);

// for the Over Under game
// const updateStandingsCron = crontab.scheduleJob("0 6 * * 1,2,5", scraper.updateStandings,['nfl']);
// const updateStandingsCron2 = crontab.scheduleJob("0 8 * * *", scraper.updateStandings,['nba']);

// for the ATS game
// const publishAtsCron = crontab.scheduleJob("0 19 * * 5", scraper.publishAtsOdds);
// const addAtsCron = crontab.scheduleJob("*/5 15-23 * * 0", scraper.addAtsScores,[2018, Util.getWeek(new Date(),'nfl')]);
// const tallyAtsCron = crontab.scheduleJob("0 9 * * 1", scraper.tallyAts,[2018, Util.getWeek(new Date(), 'nfl')]);

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
	// cmd = exec('mv json/ats_* backup/ats', function(error, stdout, stderr) {
   //    if (error || stderr) {
   //       console.log(error);
   //       console.log(stderr);
   //    }
	// });
   console.log('Backups - '+now);
});


