const Scraper = require('./models/scraper');
const fs = require('fs');
const request = require('request');
// const exec = require('child_process').exec;
const cheerio = require('cheerio');
const Records = require('./models/dbschema').Records;
const Scores = require('./models/dbschema').Scores;
const OUgame = require('./models/dbschema').OUgame;
const OUuser = require('./models/dbschema').OUuser;
const Ats = require('./models/dbschema').Ats;
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf');

Ats.find({season: 2018, week: 7}, {'0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1}, (err, choices) => {
	let score = 0, promises=[];
	if (err) {
		console.log("Test error: "+err);
	} else {
		let index=0;
		for (let key in choices.toObject()) {
			if(key != '_id') {
				promises.push(Scores.findOne({sport:'nfl', season:req.body.season, week: req.body.week, index: key}, (err, result) => {
						// console.log(result);
						if(result){
							// console.log(`${++index} ${result.team1} ${result.score1} ${result.team2} ${result.score2} ${result.ats} ${choices[key]}`);
							if(choices[key] == result.ats) {
								++score;
							}
						}
				}));
			}
		}
		Promise.all(promises).then(() => {
			console.log(choices+' scored '+score);
		});
	}
});
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



