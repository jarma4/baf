// var request = require('request'),
// fs = require('fs'),
// exec = require('child_process').exec,
// cheerio = require('cheerio'),
var Users = require('./models/dbschema').Users,
Bets = require('./models/dbschema').Bets,
Messages = require('./models/dbschema').Messages,
Promise = require('promise'),
// OUGame = require('./models/dbschema').OUGame,
// // Scores = require('./models/dbschema').Scores,
mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/baf');

Bets.findByIdAndUpdate({_id: '56edbc685279d25312866da3'}, {paid:true}, function(err,singleBet){
   console.log(singleBet);
   if (err)
      console.log('ERROR: '+err);
   // Users.findOne({_id: singleBet.user1}, function(err,user){
   //    console.log('user='+user);
   //    if (err)
   //       console.log(err);
   //    console.log('user debts='+user.debts);
   // });
});

//    var today = new Date();
//    Messages.findOne({date: {$gte: today.setDate(today.getDate()-3)}}, function(err, messages) {
//       if (messages){
//          answer.type = 'message';
//          answer.msgboard = true;
//       }
//       res.send(answer);
//    });
// });

// var url = 'http://www.oddsshark.com/nba/ats-standings';
// request(url, function (err, response, body) {
//    if(!err && response.statusCode === 200) {
//       var $ = cheerio.load(body);
//
//       var teams = ['Golden State','LA Clippers','San Antonio','Oklahoma City','Cleveland','Houston','Memphis','Atlanta','Chicago','New Orleans','Miami','Washington','Toronto','Milwaukee','Boston','Utah','Indiana','Phoenix','Detroit','Dallas','Sacramento','Orlando','Charlotte','New York','LA Lakers','Minnesota','Brooklyn','Portland','Denver','Philadelphia'];
//
//       teams.forEach(function(name){
//          var record = $('.base-table a:contains('+name+')').parent().next().text().split('-');
//          var newproj = Number(record[0])/(Number(record[0])+Number(record[1]))*82;
//          OUGame.findOne({team: name}, function(err, rec) {
//             OUGame.update({team: name}, {win: record[0], loss: record[1], projection: newproj, status: (newproj > rec.line)?'Over':'Under'}, function(err, resp){
//                if (err)
//                   console.log('error');
//                if (resp.n)
//                   console.log('updated '+name+' record');
//             });
//          });
//       });
//    }
// });
