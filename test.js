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

function checkSameDate(date1, date2){
	return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate();
}

const now = new Date(2021,10,1);
const midnight = new Date()
midnight.setHours(0,0,0,0);

console.log(checkSameDate(now, midnight));


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