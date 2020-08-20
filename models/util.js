const  Users = require('./dbschema').Users,
   // Nexmo = require('nexmo'),
   sinchAuth = require('./sinch-auth'),
   sinchSms = require('./sinch-messaging'),
   mongoose = require('mongoose');
	
require('dotenv').config();
const telnyx = require('telnyx')(process.env.BAF_TELNYX);
// auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', process.env.BAF_SINCH);
   
// const nexmo = new Nexmo({
//    apiKey: process.env.BAF_NEXMOK,
//    apiSecret: process.env.BAF_NEXMOS
// });
var textList = {};

module.exports = {
   textUser: function (to, message, pref2){
		// console.log(message);
      Users.findOne({_id: to}, function(err,user){
         if (err) {
            console.log(err);
         } else if (user){
            if((user.pref_text_receive && !pref2) || (user.pref_text_accept && pref2)){
               // nexmo.message.sendSms('15129997944', '+1'+user.sms, message + ' ( https://2dollarbets.com/bets )');
               // increment list for user to be checked later
               if (textList[to]) {
                  textList[to]++;
               } else {
                  textList[to] = 1;
               }
               // only text user once every 2 minutes
               setTimeout(function(){
                  if (textList[to]) {
                     // console.log('text sending to '+user.sms);
                     telnyx.messages.create({
                        'from': '+18705888055', // Your Telnyx number
                        'to': '+1'+user.sms,
                        'text': message + ' - 2DB'
                     }).then(function(response){
                        console.log('texted',message); // asynchronously handled
                     });
                     // sinchSms.sendMessage('+1'+user.sms, message + ' ( https://2dollarbets.com/bets )');
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
      nfl: new Date(2020,8,10),
      nba: new Date(2019,9,22),
      ncaa: new Date(2020,2,16),
      soccer: new Date(2020,5,14)
   }
   // inSeason: {
   //    nfl: false,
   //    nba: false,
   //    ncaa: false,
   //    soccer: true
   // }
};
