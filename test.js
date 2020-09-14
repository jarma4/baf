const Scraper = require('./models/scraper');
const fs = require('fs');
const request = require('request');
// const exec = require('child_process').exec;
const cheerio = require('cheerio');
const Util = require('./models/util');
const Records = require('./models/dbschema').Records;
const Scores = require('./models/dbschema').Scores;
const OUgame = require('./models/dbschema').OUgame;
const OUuser = require('./models/dbschema').OUuser;
const Ats = require('./models/dbschema').Ats;
const Odds = require('./models/dbschema').Odds;
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');

require('dotenv').config();
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', { useNewUrlParser: true });

test(1);

function test(wk) {
   let url = 'https://www.cbssports.com/nfl/scoreboard/all/'+new Date().getFullYear()+'/regular/'+wk;
	console.log(url);
	request(url, function (err, response, body) {
		if(!err && response.statusCode === 200) {
			let $ = cheerio.load(body);
			$('.single-score-card.postgame').each(function(){
            // console.log($(this).find('a.team').first().text());
				console.log($(this).find('a.team').first().text()+$(this).find('a.team').first().parent().next().next().next().next().next().text()+' vs '+$(this).find('a.team').last().text());
				// let tmp = new Scores({
				// 	score1: 0,
				// 	score2: 0,
				// 	winner: 0,
				// 	season: 2019,
				// 	sport: 'nba',
				// 	date: dateCopy,
				// 	team1: nbaTeams2[$(this).find('.team-name').first().text()],
				// 	team2: nbaTeams2[$(this).find('.team-name').last().text()]
				// }).save(function(err){
				// 	if(err) {
				// 		console.log('Trouble adding game');
				// 	} else {
				// 		console.log('game added');
				// 	}
				// });
			});
		}
	});
}
