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
// const puppeteer = require('puppeteer');
const { Bets, Users } = require('./models/dbschema');
const PhoneNumberRegulatoryRequirements = require('telnyx/lib/resources/PhoneNumberRegulatoryRequirements');

require('dotenv').config();

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

// const url = 'http://www.oddsshark.com/nba/odds';
// request(url, function (err, response, body) {
// 	if(!err && response.statusCode == 200) {
// 		const $ = cheerio.load(body);
// 		let pingpong = 0;
// 		console.log($('.op-matchup-team','#op-content-wrapper').length/2);
// 		$('.op-matchup-team','#op-content-wrapper').each(function() {
// 			if (pingpong++ % 2 == 0) {
// 				console.log(JSON.parse($(this).parent().parent().prevAll('.no-group-name').attr('data-op-date')).short_date); //prevAll gives list, closest one is always last
// 			}
// 		});
// 	}
// });

Records.update({season: 2021, sport: 'nba', user: 'jarma4'}, {$inc: {win:1}}, (err, res, three) => { 
	if(err) {
		console.log('Error: ', err);
	} else {
		console.log(res);
		console.log(three);
		
	}
});
// Records.update({season: 2021, sport: 'nba', user: 'jjjj'}, {$inc: {win:1}}, (err, res) => { 
// 	if(err) {
// 		console.log('Error: ', err);
// 	} else {
// 		console.log(`user not there, update=${res.n}`);
// 	}
// });

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