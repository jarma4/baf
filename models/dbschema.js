let mongoose = require('mongoose');

let usersSchema = new mongoose.Schema({
   _id : String,  //really username
   password : String,
   sms : String,
   push: String,
   bets : Number,
   debts : Number,
   pref_nfl_everyone: Boolean,
   pref_nba_everyone: Boolean,
   pref_text_receive: Boolean,
   pref_text_accept: Boolean,
   pref_default_page: String
});

let recordsSchema = new mongoose.Schema({
   user : String,
   sport : String,
   season : Number,
   loss: Number,
   win: Number,
   push: Number,
   pct: Number,
   correct: Number,
   try: Number
});

let betsSchema = new mongoose.Schema({
   date: Date,
   season : Number,
   user1 : String,
   user2 : String,
   amount : Number,
   team1 : String,
   team2 : String,
   odds: Number,
   type: String,     // spread, over, under, prop
   status: Number,   // 0-1=open, 2=accepted, 3=declined, 4=win, 5=loss, 6=push, 10-12=watch per sport
   fta: Number,
   watch: Number,    // 1=hasn't been seen; 2=has been seen and reported;+10 means auto send bet
   week: Number,
   gametime: Date,
   sport: String,
   comment: String,
	paid: Boolean,
	score1 : Number,
	score2 : Number,
	limit: Number
});

let sportsSchema = new mongoose.Schema({
   sport: String,
   start : Date,
   inseason : Boolean,
});

let ouGameSchema = new mongoose.Schema({
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

let ouUserSchema = new mongoose.Schema({
   user: String,
   season: Number,
   sport: String,  // nfl, nba, nfltourney, nbatourney
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

// stores BTA choices and also Tracker picks
let atsSchema = new mongoose.Schema({
   user: String,
   season: Number,
   week: Number,
   sport: String, //nba, nfl, tracknba
   0: Number,
   1: Number,
   2: Number,
   3: Number,
   4: Number,
   5: Number,
   6: Number,
   7: Number,
   8: Number,
   9: Number,
   10: Number,
   11: Number,
   12: Number,
   13: Number,
   14: Number,
	15: Number,
	date: Date,
	tiebreaker: Number
});

let oddsSchema = new mongoose.Schema({
   sport: String, //nba, nfl, trackernba
   season : Number,
   week: Number,
   date: Date,
   team1 : String,
   team2 : String,
   spread: Number,
	index: Number,
	total: Number,
	ats: Number,  // winner of game (3=push); 10 added when daily winner is chosen
	b2b1: Boolean,
	b2b2: Boolean
});

let trackerSchema = new mongoose.Schema({
   sport: String,
   season : Number,
	user: String,
   team : String,
   home_games: Number,
   away_games: Number,
   b2b_games: Number,
	home_won: Number,
	away_won: Number,
	b2b_won: Number,
},{collection:'tracker'});

let tmpSchema = new mongoose.Schema({
   sport: String,
   season : Number,
	user: String,
   team : String,
   home_games: Number,
   away_games: Number,
   b2b_games: Number,
	home_won: Number,
	away_won: Number,
	b2b_won: Number
},{collection:'tmp'});

module.exports = {
   Users : mongoose.model('Users', usersSchema),
   Records : mongoose.model('Records', recordsSchema),
   Bets : mongoose.model('Bets', betsSchema),
   Sports : mongoose.model('Sports', sportsSchema),
   OUgame : mongoose.model('OUgame', ouGameSchema),
   OUuser : mongoose.model('OUuser', ouUserSchema),
   Ats : mongoose.model('Ats', atsSchema),
   Odds : mongoose.model('Odds', oddsSchema),
   Tracker : mongoose.model('Tracker', trackerSchema),
   Tmp : mongoose.model('Tmp', tmpSchema)
};
