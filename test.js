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
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', { useNewUrlParser: true });


// request(url, function (err, response, content) {
// 	if(!err && response.statusCode == 200) {
// 		console.log('found page');
// 		// fs.writeFile('page2.html', content, _ => console.log('HTML saved'));
// 		var $ = cheerio.load(content);
// 		$('.matchup .live').each((idx, game) => {
// 			console.log('game: ', $(game).children('.status').text())
// 			// console.log($(this).children().first());
// 		});
// 	}
// });
