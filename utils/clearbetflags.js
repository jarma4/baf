var mongoose = require('mongoose'),
   Users = require('../models/dbschema').Users;


process.loadEnvFile();

mongoose.set('strictQuery', true);
mongoose.connect(process.env.BAF_MONGO_URI)
.catch(err => console.log(err));

Users.updateMany({}, {$set: {bets: 0}})
.then(() =>  console.log('Cleared bet notices'))
.catch(err => console.log(err));
