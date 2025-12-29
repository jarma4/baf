const https = require('https'),
      express = require('express'),
      fs = require('fs'),
      crontab = require('node-crontab'),
      exec = require('child_process').exec,
      compression = require('compression'),
	  { init_seasonStart } = require('./models/util');

// process.traceDeprecation = true;

process.loadEnvFile();

// http site
const app_http = express();
app_http.use(compression());
// app_http.use('/', express.static(__dirname + '/public'));
app_http.use((req, res) => {
   res.redirect(301, 'https://2dollarbets.com');
});
app_http.listen(3000, () => {
   console.log('redirecting on port 3000');
});

// https site
const app_https = express({
    uwsOptions: {
        key_file_name: './sslcert/privkey.pem',
        cert_file_name: './sslcert/fullchain.pem'
    }
});
app_https.use(compression());
//app_https.use('/', express.static(__dirname + '/public'));
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

https.createServer(options, app_https).listen(3001, () => {
// app_https.listen(443, () => {
		console.log('listening at on port 3001');
});

if (process.env.ENVIRONMENT == 'local'){

	init_seasonStart();
	// manage data gathering via scraper model and schedule
	const scraper = require('./models/scraper');

	// schedule worker jobs
	const oddsCron2 = crontab.scheduleJob("*/5 6-23 * * *", scraper.refreshOddsInfo);
	const clearUnactedCron = crontab.scheduleJob("*/5 12-22 * * *", scraper.clearUnactedBets);
	const dailyCleaningCron = crontab.scheduleJob("0 7 * * *", scraper.dailyCleaning);

	// for NFL
	const tallyBetsNflCron = crontab.scheduleJob("*/6 15-23 * * 0,1,4", scraper.tallyBets2,['nfl']);

	// for NBA
	const tallyBetsNbaCron = crontab.scheduleJob("*/5 0,15-23 * * *", scraper.tallyBets2,['nba']);
	// const checkHalftimeNbaCron = crontab.scheduleJob("* 19-22 * * *", scraper.getHalftimeScores);

	// for the Over Under game
	const updateStandingsCron = crontab.scheduleJob("0 6 * * 1,2,5", scraper.updateStandings,['nfl']);
	const updateStandingsCron2 = crontab.scheduleJob("0 7 * * *", scraper.updateStandings,['nba']);

	// for Tracker
	// const processOddsCron = crontab.scheduleJob("0 6 * * *", scraper.processOdds,['nba']);
	// const processTrackerCron = crontab.scheduleJob("5 6 * * *", scraper.processTracker,['nba']);
	// const getDailyOddsCron = crontab.scheduleJob("0 10 * * *", scraper.getDailyOdds,['nba']);
} 
if (process.env.ENVIRONMENT == 'local') {
	const backupsCron = crontab.scheduleJob('0 1 * * 2', () =>  {
		const now = new Date();
		console.log('Performing backup - '+now);
		// copy mongo db's to backup area
		var cmd = exec('mongodump --forceTableScan --uri='+process.env.BAF_MONGO_URI+' -o backup/mongodb/'+now.getFullYear()+'_'+(now.getMonth()+1)+'_'+now.getDate(), (error, stdout, stderr) => {
			if (error || stderr) {
				console.log(error);
				console.log(stderr);
			}
		});
		// move weekly ATS game odds file to backup area
		// cmd = exec('mv json/ats_* backup/ats', (error, stdout, stderr) => {
		//    if (error || stderr) {
		//       console.log(error);
		//       console.log(stderr);
		//    }
		// });
	});
}

