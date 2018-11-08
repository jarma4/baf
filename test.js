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
require('dotenv').config();
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf');

Scraper.tallyBets('nba');

// Records.findOne({user: user, sport: sport, season: 2018}, function (err, record) {
		// 	if (!record) {
// 		var tmp = new Records({
// 			user: user,
// 			season: 2018,
// 			sport: sport,
// 			win: 0,
// 			loss: 0,
// 			push: 0,
// 			pct: 0
// 		});
// 		tmp.save(function(err){
// 			if(err) {
// 				console.log(`Trouble adding new record for ${user}`);
// 			} else {
// 				console.log(`Added new record for ${user}`);
// 			}
// 		});
// 		console.log(tmp._id);
// 	}

// 	Records.find({_id: ((!record)?tmp._id:record._id)}, function(err, resp){
// 		if (err)
// 			console.log('pct error');
// 		else
// 			console.log(resp);
// 	});
// });



