var mongoose = require('mongoose'),
   Users = require('../models/dbschema').Users;

mongoose.connect('mongodb://localhost/baf', {user:'baf', pass: process.env.BAF_MONGO});

Users.update({}, {bets: 0}, {multi: true}, function (err) {
   if (err)
      console.log('Problem: '+err);
   else
      console.log('Cleared bet notices');
});
