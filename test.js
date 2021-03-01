const Scraper = require('./models/scraper');
const fs = require('fs');
const request = require('request');
// const exec = require('child_process').exec;
const cheerio = require('cheerio');
const Util = require('./models/util');
const Records = require('./models/dbschema').Records;
// const Scores = require('./models/dbschema').Scores;
// const OUgame = require('./models/dbschema').OUgame;
// const OUuser = require('./models/dbschema').OUuser;
// const Ats = require('./models/dbschema').Ats;
const Odds = require('./models/dbschema').Odds;
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const { Bets, Users } = require('./models/dbschema');
const PhoneNumberRegulatoryRequirements = require('telnyx/lib/resources/PhoneNumberRegulatoryRequirements');

require('dotenv').config();

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

function publishOdds(sport) {
	let index = 0;
	let current = JSON.parse(fs.readFileSync('json/'+sport+'_odds.json'));
	let today = new Date();
	current.games.forEach(game => {
		if (new Date(game.date).getDate() == today.getDate() && new Date(game.date).getMonth() == today.getMonth()) {  //only look at today, may include future odds
			Odds.updateOne({team1: game.team1, team2: game.team2, season: 2020, sport: sport, date: today.setHours(0,0,0,0)}, {spread: game.spread}, (err, result) => {
				if(result.nModified) {
					console.log('Odds modified');
				} else if (!result.n) {
					new Odds({
						team1: game.team1,
						team2: game.team2,
						spread: game.spread,
						date: game.date,
						sport: sport,
						week: Util.getWeek(today, sport),
						date: today.setHours(0,0,0,0),
						season: 2020,
						ats: 0,
						index: index++
					}).save(err2 => {
						if(err2)
							console.log('Error saving new odds: '+err);
						else
							console.log('New odds saved');
					});
				}
			});
		}
	});
	console.log('Copied odds to db');
}

publishOdds('nba');