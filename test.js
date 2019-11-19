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

console.log(Scraper.addNbaGames(new Date(2019,9,25), new Date(2019,12,31)));