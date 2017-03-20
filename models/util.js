var sinchAuth = require('./sinch-auth'),
    auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', process.env.BAF_SINCH),
    sinchSms = require('./sinch-messaging'),
    Users = require('./dbschema').Users,
    mongoose = require('mongoose');

// mongoose.connect('mongodb://127.0.0.1/baf', {user:'baf', pass: process.env.BAF_MONGO});
var seasonStart = new Date(2016,8,7);
var nflWeeks = [];
var dst = 0;
for (var i=0;i<22;i++){
   if (i > 7)
      dst = 3600000;
   nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+dst));
}

module.exports = {
   textUser: function (to, message, pref2){
      Users.findOne({_id: to}, function(err,user){
         if (err) {
            console.log(err);
         } else if (user){
            if((user.pref_text_receive && !pref2) || (user.pref_text_accept && pref2)){
               sinchSms.sendMessage('+1'+user.sms, message + ' ( http://2dollarbets.com/bets )');

            // sms.send_message({
            //    src: '+16622193664',
            //    dst: '+1'+user.sms,
            //    text: 'B.A.F. - ' + message + from + ' - http://2dollarbets.com/bets'
            // }, function (status, response) {
            //    console.log('API Response:\n', response);
            // });
            }
         }
      });
   },
   getWeek: function(date, sport){
      var seasonStart = {
            nfl: new Date(2016,8,7),
            nba: new Date(2016,9,20),
            ncaa: new Date(2017,2,16)
         },
         dayTicks = 24 * 60 * 60 * 1000;
      return Math.ceil((date - ((sport=='nba')?seasonStart.nba:(sport=='nfl')?seasonStart.nfl:seasonStart.ncaa)) / dayTicks / 7);
   }

};
