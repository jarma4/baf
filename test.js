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

let sport = 'nba';

let url = 'http://www.oddsshark.com/'+((sport=='soccer')?'soccer/world-cup':sport)+'/odds';
console.log(`checking odds ${sport} @ ${url}`);
request(url, function (err, response, body) {
	if(!err && response.statusCode == 200) {
		let $ = cheerio.load(body);
		console.log($('.op-item-row-wrapper','#op-results').length);
		console.log($('.op-item-row-wrapper','#op-results').not('.no-odds-wrapper').length);
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