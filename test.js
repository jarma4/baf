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
const puppeteer = require('puppeteer');

require('dotenv').config();
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', { useNewUrlParser: true });

async function pressbtn() {
	const browser = await puppeteer.launch({headless: false});
   const page = await browser.newPage();
   // const url = "https://www.banggood.com/pointsmall.html"
   const url = "https://2dollarbets.com/log"
	await page.goto(url);
	// console.log('checking halftime',new Date());
	let content = await page.content();
	return content;
}
console.log(pressbtn());
// var day=new Date('Feb 8 2019');
// while(day < new Date('Apr 11 2019')) {
//    Scores.find({date: day}, (err, rec)=>{
//       if(err)
//          console.log('Error: ', err)
//       else if (rec)
//          Scraper.addNbaGames(day,day);
//    });
//    day.setDate(day.getDate()+1);
// }

// request('http://www.lasvegassportsbetting.com/live-odds/line_history.php?host=LVSB&book=182&game=509&period=2&date=2019-02-08', function (err, response, content) {
// 	if(!err && response.statusCode == 200) {
// 		console.log('found page');
// 		// fs.writeFile('page2.html', content, _ => console.log('HTML saved'));
// 		var $ = cheerio.load(content);
// 		let odds = $('td.data').first().next().next().text();
// 		if (odds.charAt(0) == '+')
// 			console.log(Number(odds.split('-')[0]))
// 		else
// 			console.log(0-Number(odds.split('-')[1]))
// 			// console.log($(this).children().first());
// 	}
// });
