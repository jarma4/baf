const Scraper = require('./models/scraper');
// const fs = require('fs');
const request = require('request');
// const exec = require('child_process').exec;
const cheerio = require('cheerio');
OUgame = require('./models/dbschema').OUgame;
OUuser = require('./models/dbschema').OUuser;
const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf');

OUgame.find({season:2017, sport:'nba'}, (err, teams)=>{
   if(!err) {
      teams.forEach(record => {
         new OUgame({
            line: 0,
            loss: 0,
            win: 0, 
            projection:0,
            status: 'Under',
            team: record.team,
            season:2018,
            sport:'nba'
         }).save(err =>{
            if(err)
               console.log('record not saved');
         })
         
      });
   }
})
// Scraper.addNflGames(2,17,2018);

