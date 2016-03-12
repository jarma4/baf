var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
   _id : String,  //really username
   password : String,
   sms : String,
   messages : Number,
   win_nfl: Number,
   win_nba: Number,
   loss_nfl: Number,
   loss_nba: Number,
   push_nfl: Number,
   push_nba: Number,
   pref_include_everyone: Boolean,
   pref_text_receive: Boolean,
   pref_text_accept: Boolean
});

var betsSchema = new mongoose.Schema({
   date : Date,
   user1 : String,
   user2 : String,
   amount : Number,
   team1 : String,
   team2 : String,
   odds: Number,
   type: String,
   status: Number,  //0-1=open,2=accepted,3=declined,4=win,5=loss,6=push, -1=saved nfl, -2=saved nba
   fta: Number,
   week: Number,
   gametime: Date,
   sport: String,
   comment: String
});

var msgSchema = new mongoose.Schema({
   date : Date,
   user : String,
   message : String
});

var scoresSchema = new mongoose.Schema({
   date : Date,
   team1 : String,
   score1 : Number,
   team2 : String,
   score2 : Number,
   winner: Number,
   week : Number,
   sport : String
});

var propsSchema = new mongoose.Schema({
   date : Date,
   user1 : String,
   user2 : String,
   amount : Number,
   prop: String
});

var standingsSchema = new mongoose.Schema({
   team : String,
   win : Number,
   loss : Number,
   projection: Number,
   line : Number,
   status: String,
   john : String,
   eric: String,
   russell: String,
   aaron: String,
});

var Users = mongoose.model('Users', usersSchema);
var Bets = mongoose.model('Bets', betsSchema);
var Scores = mongoose.model('Scores', scoresSchema);
var Messages = mongoose.model('Messages', msgSchema);
var Props = mongoose.model('Props', propsSchema);
var Standings = mongoose.model('Standings', standingsSchema);

module.exports = {
   Users: Users,
   Bets: Bets,
   Scores: Scores,
   Messages: Messages,
   Props: Props,
   Standings: Standings
};
