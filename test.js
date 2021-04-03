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
const Ats = require('./models/dbschema').Ats;
const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const { Bets, Users } = require('./models/dbschema');
const PhoneNumberRegulatoryRequirements = require('telnyx/lib/resources/PhoneNumberRegulatoryRequirements');

require('dotenv').config();

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});


let promises = [];
promises.push(new Promise((resolve, reject)=>{ // find number of games for today
	Odds.find({date: new Date(2021,2,17).setHours(0,0,0,0)}, (err, odds) => {
		if(err) {
			reject();
		} else {
			resolve(odds);
		}
	}).sort({index:1});
}));
promises.push(new Promise((resolve, reject)=>{ // find number of games done today
	Odds.find({date: new Date(2021,2,17).setHours(0,0,0,0), ats: {$in:[1,2,3]}}, (err, done) => {
		if(err) {
			reject();
		} else {
			resolve(done.length);
		}
	}).sort({index:1});
}));
promises.push(new Promise((resolve, reject)=>{ // find players for today
	Ats.find({date: new Date(2021,2,17).setHours(0,0,0,0)}, (err, picks) => {
		if(err) {
			reject();
		} else {
			resolve(picks);
		}
	}).sort({user:1});
}));
Promise.all(promises).then(retData =>{
	if (retData[0].length == retData[1]) { // if all games today are done
		let totals = new Array(retData[2].length).fill(0);
		retData[0].forEach((rec, i) => {  // go through odds for all games
			retData[2].forEach((user, j) => {  // check vs each person
				if (Number(user[i])==rec.ats) {
					totals[j] += 1;
				}
			});
		});
		console.log(totals);
		let max = Math.max(...totals);
		let winners = [];
		totals.filter((el, idx) => el == max ? winners.push(idx):'');
		console.log(winners);
		// winners.forEach(idx => {

			// Records.updateOne({season:2020, sport:'bta', user: retData[2][idx].user}, {$inc: {win: 1/winners.length}}, err => {
			// 	if (err) {
			// 		console.log(`Error incrementing BTA result for ${retData[2][idx].user}`);
			// 	} else {
			// 		console.log(`Updated BTA win for ${retData[2][idx].user}`);
			// 	}
			// });
		// });
		Odds.updateMany({date: new Date(2021,2,17).setHours(0,0,0,0), ats: {$in:[1,2,3]}}, {$inc: {ats: 10}}, (err, done) => { 
			if(err) {
				console.log('Error marking done games', err);
			} else {
				console.log('Updated BTA odds to finished');
			}
		}).sort({index:1});
	}

});



// Records.find({season:2020,sport:'nba'}, function(err, retData){
// 	console.log(retData);
// 	if (err){
// 		console.log(err)
// 	} else {
// 		console.log(retData)
// 		retData.forEach(record => {
// 			Records.updateOne({_id: record._id}, {pct: (record.win+0.5*record.push)/(record.win+record.loss+record.push)}, err => {
// 				if (err)
// 					console.log(err);
// 			});
// 		});		
// 	}
// });