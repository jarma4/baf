var sinchAuth = require('./sinch-auth'),
    auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', process.env.BAF_SINCH),
    sinchSms = require('./sinch-messaging'),
    Users = require('./dbschema').Users,
    mongoose = require('mongoose');

// mongoose.connect('mongodb://127.0.0.1/baf', {user:'baf', pass: process.env.BAF_MONGO});

module.exports = {
   textUser: function (to, message, pref2){
      Users.findOne({_id: to}, function(err,user){
         if (err) {
            console.log(err);
         } else if (user){
            if((user.pref_text_receive && !pref2) || (user.pref_text_accept && pref2)){
               sinchSms.sendMessage('+1'+user.sms, message + ' ( http://2dollarbets.com/bets )');
            }
         }
      });
   },
   getWeek: function(date, sport){
      var seasonStart = {
            nfl: new Date(2017,8,7),
            nba: new Date(2017,9,20),
            ncaa: new Date(2018,2,16)
         },
         dayTicks = 24 * 60 * 60 * 1000;
      return Math.ceil((date - ((sport=='nba')?seasonStart.nba:(sport=='nfl')?seasonStart.nfl:seasonStart.ncaa)) / dayTicks / 7);
   }

};
