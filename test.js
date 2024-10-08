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
// const {App} = require('@slack/bolt');
const {MongoClient} = require('mongodb');

process.loadEnvFile();

mongoose.set('strictQuery', true);
mongoose.connect(process.env.BAF_MONGO_URI)
.then(()=>{})
.catch(err=>{
	console.log(err);
});


//cheerio
const url = 'https://www.mybookie.ag/sportsbook/nfl/';
request(url, (err, response, body) => {
	console.log('response code=',response.statusCode)
	if(!err && response.statusCode == 200) {
		// get odds for teams
		const $ = cheerio.load(body);
		const games = $('.game-line__home-line');
		for (idx=0; idx< games.length; idx++){
			const info = $(games[idx]).find('.lines-odds').first();
			// console.log($(games[idx]).parent().parent().prev().find('span.game-line__time__date__hour').attr('data-time'));
			console.log(info.attr('data-team'), info.attr('data-team-vs'), info.attr('data-points'));
			console.log($(info).next().next().attr('data-points'));

		};
	}
});
// Mongo example
// Bets.updateMany({week:53}, {$set:{week: 1}}, (err, bets) => {
// 	if (err) {
// 		console.log('Error finding teams tha played yesterday: ', err);
// 	} else {
// 		console.log(bets.length);
// 	}
// });

// Cheerio example
// request('https://www.cbssports.com/nba/odds', (err, response, body) => {
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
