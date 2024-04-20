const {Bets, Ats, Tracker, Odds, Sports, Users} = require('./models/dbschema');
const Scraper = require('./models/scraper');
const mongoose = require('mongoose');
const fs = require('fs');
const request = require('request');
const exec = require('child_process').exec;
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Util = require('./models/util');
const { getDefaultSettings } = require('http2');
const { previousDay } = require('./models/util');
const { match } = require('assert');
const {App} = require('@slack/bolt');

require('dotenv').config();
mongoose.connect(process.env.BAF_MONGO_URI)
.then(()=>{})
.catch(err=>{
	console.log(err);
});

Util.sendSlack('jarma4', 'latest timeStamp');

const message = {
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Test message"
			}
		}
	]
}



// Bets.updateMany({week:53}, {$set:{week: 1}}, (err, bets) => {
// 	if (err) {
// 		console.log('Error finding teams tha played yesterday: ', err);
// 	} else {
// 		console.log(bets.length);
// 	}

// });

// let scores = [];
// request('https://www.cbssports.com/nfl/scoreboard/all/2023/regular/2/', function (err, response, body) {
// 	if(!err && response.statusCode == 200) {
// 		const $ = cheerio.load(body);
// 		const scoresClass = $('.game-status.postgame');
// 		for (let idx = 0; idx < scoresClass.length; idx++){
// 			const teams = $(scoresClass[idx]).parent().next().find('.team-name-link');
// 			const scores = $(scoresClass[idx]).parent().next().find('td.total');
// 			console.log(teams.first().text(), scores.first().text(),teams.last().text(), scores.last().text());
// 			// console.log(matchup.first().text(), matchup.first().parent().parent().find('td').last().text().replace(/\s/g,''));
// 			// console.log(matchup.last().text(), matchup.last().parent().parent().find('td').last().text().replace(/\s/g,''));
// 		}
// 	}
// });
	
// process.exit(1);
