var request = require('request'),
   cheerio = require('cheerio'),
   Promise = require('promise'),
   fs = require('fs');
   // mongoose = require('mongoose'),
   // Users = require('./models/dbschema').Users,
   // Stats = require('./models/dbschema').Stats;
// mongoose.connect('mongodb://127.0.0.1/vcl');

getPage('https://www.reddit.com/prefs/friends/').then(function(body){
   var beforeDate = new Date(new Date() - 1000*60*60*24*550);
   var $ = cheerio.load(body);
   $('.user').each(function(i){
      var friend = $(this).find('a').text(),
         posts = $(this).text().split('(');
      if (posts[1].replace(')','') < 500)
         console.log(friend+' has '+posts[1].replace(')','')+' posts');
      getPage('https://www.reddit.com/user/' + friend + '/submitted').then(function(body){
         var $$ = cheerio.load(body);
         var lastSubmit = new Date($$('.tagline > time').first().attr('datetime'));
         if ( lastSubmit < beforeDate)
            console.log(friend+' --- '+lastSubmit);
      });
   });
   console.log('Total friends=' + $('.user').length);
});

function getPage (target) {
   return new Promise(function (resolve, reject) {
      var jar = request.jar();
      jar.setCookie(request.cookie('reddit_session=8456970%2C2016-05-09T20%3A17%3A19%2C2bd16354ce136bb67dfe84612418ed5d2439299a'), target);
      request({
      	'url':target,
      	'jar': jar
      	}, function (err, response, body) {
            if (err) {
               reject(err);
            } else if(response.statusCode === 200) {
               resolve(body);
            }
      });
   });
}
