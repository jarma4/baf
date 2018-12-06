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
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf')

Scraper.tallyAts(2018, 13, 'nfl');

function getAts(season, week) {
	let results = [], playerPromises = [];
	return new Promise((resolve, reject) =>{
		Odds.find({sport:'nfl', season: season, week: week}, (err, odds) => {
			Ats.find({season: season, week: week}, {'user': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1}, (err, players) => {
				if (err) {
					console.log("Test error: "+err);
				} else {
               players.forEach(choices => {
                  // console.log(choices);
					   playerPromises.push(new Promise((resolve, reject) =>{
                     let index=0, score = 0;
							for (let key=0; key < odds.length; key++) {
                        console.log(choices[key], odds[key].ats);
                        if(choices[key] == odds[key].ats) {
                           // console.log(`--------${choices.user} ${result.team1} ${result.team2}`);
                           ++score;
								}
							}
							console.log(choices.user, score);
							results.push({user: choices.user, win: score});
							resolve();
						}));
					});
					Promise.all(playerPromises).then(() => {
						resolve (results);
					});
				}
			}).sort({user:1});
		});
	});
}
// let season=2018; 
// let week=10;
// Ats.findOne({user: 'jarma4', season: season, week: week}, {'user': 1, '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 1, '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1}, (err, choices) => {
//    if (err) {
//       console.log("Test error: "+err);
//    } else {
//       let index=0, score = 0, choicesPromises=[];
//       for (let key in choices.toObject()) {
//          if(key != '_id' && key != 'user') {
//             choicesPromises.push(Odds.findOne({sport:'nfl', season: season, week: week, index: key}, (err, result) => {
//                if(result){
//                   if(choices[key] == result.ats) {
//                      console.log(`--------${choices.user} ${key} ${result.team1} ${result.team2}`)
//                      ++score;
//                   }
//                }
//             }));
//          }
//       }
//       Promise.all(choicesPromises).then(() => {
//          results.push({user: choices.user, win: score});
//          console.log(results);
//       });
//    }
// });

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



