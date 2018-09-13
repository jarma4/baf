var  Users = require('./dbschema').Users,
   // Nexmo = require('nexmo'),
   sinchAuth = require('./sinch-auth'),
   auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', process.env.BAF_SINCH),
   sinchSms = require('./sinch-messaging'),
   mongoose = require('mongoose');

require('dotenv').config()
   
// const nexmo = new Nexmo({
//    apiKey: process.env.BAF_NEXMOK,
//    apiSecret: process.env.BAF_NEXMOS
// });
var textList = {};

module.exports = {
   textUser: function (to, message, pref2){
      Users.findOne({_id: to}, function(err,user){
         if (err) {
            console.log(err);
         } else if (user){
            if((user.pref_text_receive && !pref2) || (user.pref_text_accept && pref2)){
               // nexmo.message.sendSms('15129997944', '+1'+user.sms, message + ' ( http://2dollarbets.com/bets )');
               // increment list for user to be checked later
               if (textList[to]) {
                  textList[to]++;
               } else {
                  textList[to] = 1;
               }
               // only text user once every 2 minutes
               setTimeout(function(){
                  if (textList[to]) {
                     sinchSms.sendMessage('+1'+user.sms, message + ' ( http://2dollarbets.com/bets )');
                     textList[to] = 0;
                  }
               }, 90000);
            }
         }
      });
   },
   getWeek: function(date, sport){
      var dayTicks = 24 * 60 * 60 * 1000;
      return Math.ceil((date - ((sport=='nba')?module.exports.seasonStart.nba:(sport=='nfl')?module.exports.seasonStart.nfl:module.exports.seasonStart.ncaa)) / dayTicks / 7);
   },
   seasonStart: {
      nfl: new Date(2018,8,5),
      nba: new Date(2018,9,17),
      ncaa: new Date(2019,2,16),
      soccer: new Date(2019,5,14)
   },
   inSeason: {
      nfl: false,
      nba: false,
      ncaa: false,
      soccer: true
   }
};
