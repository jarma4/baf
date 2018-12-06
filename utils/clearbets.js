var mongoose = require('mongoose'),
   Users = require('../models/dbschema').Users;


require('dotenv').config();
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf');

Users.update({}, {bets: 0}, {multi: true}, function (err) {
   if (err)
      console.log('Problem: '+err);
   else
      console.log('Cleared bet notices');
});
