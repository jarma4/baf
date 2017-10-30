var mongoose = require('mongoose');

var usersSchema = new mongoose.Schema({
   _id : String,  //really username
   password : String,
   sms : String,
   bets : Number,
   debts : Number,
   pref_nfl_everyone: Boolean,
   pref_nba_everyone: Boolean,
   pref_text_receive: Boolean,
   pref_text_accept: Boolean,
   pref_default_page: String
});

var recordsSchema = new mongoose.Schema({
   user : String,
   sport : String,
   season : Number,
   loss: Number,
   win: Number,
   push: Number,
   pct: Number
});

var betsSchema = new mongoose.Schema({
   date: Date,
   season : Number,
   user1 : String,
   user2 : String,
   amount : Number,
   team1 : String,
   team2 : String,
   odds: Number,
   type: String,     // spread, over, under
   status: Number,   // 0-1=open, 2=accepted, 3=declined, 4=win, 5=loss, 6=push, 10-12=watch per sport
   fta: Number,
   watch: Number,    // 1=hasn't been seen; 2=has been seen and reported;+10 means auto send bet
   week: Number,
   gametime: Date,
   sport: String,
   comment: String,
   paid: Boolean
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
   sport : String,
   season: Number
});

var propsSchema = new mongoose.Schema({
   date : Date,
   user1 : String,
   user2 : String,
   amount : Number,
   prop: String,
   odds: Number,
   winner: Number
});

var ouGameSchema = new mongoose.Schema({
   team : String,
   win : Number,
   loss : Number,
   projection: Number,
   line : Number,
   status: String,
   season: Number,
   sport: String,
   index: Number,
   john: String,
   eric: String,
   russell: String,
   aaron: String,
   tony: String,
   sergio: String
},{collection:'ougame'});

var ouUserSchema = new mongoose.Schema({
   user: String,
   season: Number,
   sport: String,
   0: String,
   1: String,
   2: String,
   3: String,
   4: String,
   5: String,
   6: String,
   7: String,
   8: String,
   9: String,
   10: String,
   11: String,
   12: String,
   13: String,
   14: String,
   15: String,
   16: String,
   17: String,
   18: String,
   19: String,
   20: String,
   21: String,
   22: String,
   23: String,
   24: String,
   25: String,
   26: String,
   27: String,
   28: String,
   29: String,
   30: String,
   31: String
},{collection:'ouuser'});

var logsSchema = new mongoose.Schema({
   time: Date,
   level: Number,
   message: String
});
// mongoose.model('Users', usersSchema);
// mongoose.model('Bets', betsSchema);
// mongoose.model('Scores', scoresSchema);
// mongoose.model('Messages', msgSchema);
// mongoose.model('Props', propsSchema);
// mongoose.model('OUgame', standingsSchema);
var Users = mongoose.model('Users', usersSchema);
var Records = mongoose.model('Records', recordsSchema);
var Bets = mongoose.model('Bets', betsSchema);
var Scores = mongoose.model('Scores', scoresSchema);
var Messages = mongoose.model('Messages', msgSchema);
var Props = mongoose.model('Props', propsSchema);
var OUgame = mongoose.model('OUgame', ouGameSchema);
var OUuser = mongoose.model('OUuser', ouUserSchema);
var Logs = mongoose.model('Logs', logsSchema);

module.exports = {
   Users: Users,
   Records: Records,
   Bets: Bets,
   Scores: Scores,
   Messages: Messages,
   Props: Props,
   OUgame: OUgame,
   OUuser: OUuser,
   Logs: Logs
};
