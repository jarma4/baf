// plivo = require('plivo'),
var sinchAuth = require('../models/sinch-auth'),
sinchSms = require('../models/sinch-messaging'),
Users = require('../models/dbschema').Users;

// var sms = plivo.RestAPI({
//   authId: 'MANJRMMDLJYME1MMYYOG',
//   authToken: 'ZjcyZmI5MGVhMGFlMWIzNWEyYzg0ZDFiOWJmMmUw'
// });
var auth = sinchAuth('61a9e95d-1134-414a-a883-f5d4111e6061', 'nhnHg5UWKECMfk59XBSIjw==');

function textUser(to, from, message){
   Users.findOne({_id: to}, function(err, user){
      if (err)
         console.log(err);
      else
         if(user.pref_text_receive)
            sinchSms.sendMessage('+1'+user.sms, 'B.A.F. - ' + message + from + ' - http://jarnigan.net:8083/bets');
         // sms.send_message({
         //    src: '+16622193664',
         //    dst: '+1'+user.sms,
         //    text: 'B.A.F. - ' + message + from + ' - http://jarnigan.net:8083/bets'
         // }, function (status, response) {
         //    console.log('API Response:\n', response);
         // });
   });
}

module.exports = textUser();
