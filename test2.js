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
const Ats = require('./models/dbschema').Ats;
const Odds = require('./models/dbschema').Odds;
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const { Bets, Users } = require('./models/dbschema');
const PhoneNumberRegulatoryRequirements = require('telnyx/lib/resources/PhoneNumberRegulatoryRequirements');
const { getHeapStatistics } = require('v8');

require('dotenv').config();

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

const user = 'Jmcgeady', sport = 'nba', season = 'ALL';


function getStats (user, sport) {
	console.log('in function')
	Bets.find({sport: sport, $or: [{user1: user}, {user2: user}], status: {$in:[4,5,6]}}, (err, bets) => {
		if (err) {
			console.log('Error getting ATS users');
		} else {
			console.log(bets.length);
		}

	});
}

// if (season == 'ALL') {
// 	console.log();
// } else {
	getStats(user, sport);
// }