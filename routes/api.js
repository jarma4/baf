const { seasonStart } = require('../models/util');
const { Users, Records, Bets, Sports, OUgame, OUuser, Ats, Odds, Tracker} = require('../models/dbschema');
const express = require('express'),
		bodyParser = require('body-parser'),
		fs = require('fs'),
		// Auth = require('./auth'),
		logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
		session = require('client-sessions'),
		bcrypt = require('bcryptjs'),
		Util = require('../models/util'),
		mongoose = require('mongoose'),
		webpush = require('web-push'),
		Tourney = require('./tourney');

require('dotenv').config();

mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

router = express.Router();

module.exports = router;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(session({
  cookieName: 'session',
  secret: process.env.BAF_SESSION,
  duration: 14 * 24 * 60 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

router.use(function (req, res, next) {
  if (req.session && req.session.user) {
	 Users.findOne({ _id: req.session.user._id }, function (err, user) {
		if (user) {
		  req.user = user;
		  delete req.user.password;
		  req.session.user = user;
		  res.locals.user = user;
		}

		next();
	 });
  } else {
	 next();
  }
});

webpush.setVapidDetails("mailto:admin@2dollarbets.com", process.env.BAF_VAPPUB, process.env.BAF_VAPPRI);

function requireLogin (req, res, next) {
	// console.log('requirelogin'+req.user);
	if (!req.user) {
		// console.log('no auth');
		// res.redirect('/login');
		res.send({'type':'command', 'message':'$("#loginModal").modal()'});
	} else {
		next();
	}
}

// fix for duplicate bets: bets come in with random serial#, saved on stack
// timer removes; if bet with same serial# comes in that is on stack, refused
let betStack = [];

// pulled out so EVERYONE bets can call multiple times along with single bets
function saveBet (req){
	// console.log(req.body);
	let today = new Date();
	new Bets({
		week: (req.body.type != 'prop')?Util.getWeek(new Date(req.body.gametime), req.body.sport):0,
		season: (req.body.type != 'prop')?seasonStart[req.body.sport].getFullYear(): today.getFullYear(),
		gametime: req.body.gametime,
		date: (req.body.timeout)?today.setDate(today.getDate()+Number(req.body.timeout)):today,
		user1: req.session.user._id,
		user2: req.body.user2,
		odds: req.body.odds,
		type: req.body.type,
		team1: req.body.team1,
		team2: req.body.team2,
		amount: req.body.amount,
		sport: req.body.sport,
		fta: req.body.serial,
		paid: false,
		score1: 0,
		score2: 0,
		status: (req.body.watch === true)?((req.body.sport=='nfl')?10:(req.body.sport=='nba')?11:12):0,
		watch: (req.body.watch === true)?(req.body.watchsend === true)?11:1:'',
		limit: req.body.limit
	}).save(function(err){
	 if(err) {
			logger.error('Trouble adding bet: '+err);
			return ({'type':'danger', 'message':'Trouble adding bet'});
		} else {
			logger.info('Bet added: user1='+req.session.user._id+" user2="+req.body.user2+" picks="+req.body.team1+" odds="+req.body.odds);
			return ({'type':'success', 'message':(req.body.watch==true)?'Odds watch set':'Bet Saved'});
		}
	});
	if (req.body.watch==false && req.body.type != 'give' && req.body.type != 'take') {
		changeUser (req.body.user2, 'bets', 1);
		Util.textUser(req.body.user2, ((req.body.sport=='nba')?'NBA':'NFL')+' bet: '+req.body.user2+'='+req.body.team2+', '+req.session.user._id+'='+req.body.team1);
	}
}

// pulled out as function so can be called internally by watch bets being auto sent
function makeBet (req) {
	// check stack if bet has already come through, exit if so
	if (betStack.indexOf(req.body.serial) != -1) {
		console.log('previous bet found with serial#'+req.body.serial);
		return;
	}

	// add bet serial# to stack to check for duplicates later
	betStack.push(req.body.serial);
	// remove after 10 seconds
	setTimeout(function(){
		betStack.splice(betStack.indexOf(req.body.serial),1);
	}, 10000);

	// if EVERYONE bet, need to go through user db and send to each
	if ((req.body.user2 == 'EVERYONE') && req.body.watch == false) {
		Users.find({$and: [
							{_id: {$nin:[req.session.user._id,'testuser']}},
							(req.body.sport == 'nfl')? {pref_nfl_everyone: true}:{pref_nba_everyone: true}]}, {_id: 1}, function(err, users){
			users.forEach(function(single) {
				req.body.user2 = single._id;
				saveBet(req);
			});
		});
	} else {
		saveBet(req);
	}
}

router.post('/makebet', requireLogin, function (req, res) {
	makeBet(req);
	res.send({'type':'success', 'message':(req.body.watch==true)?'Odds watch set':'Bet Sent'});
});

router.post('/getbets', requireLogin, function(req,res){
	let sortedBets = [];
	Bets.find({$and:[
		{status:(req.body.status==1)?0:req.body.status},
		{type: {$in: ['spread', 'over', 'under']}},
		(Number(req.body.all))?{$and:[
											{user1: {$ne: req.session.user._id}},
											{user2: {$ne: req.session.user._id}}]}
									:(req.body.status=='0')?{user2: req.session.user._id}
									//  :(req.body.status=='0')?{$or:[{$and: [{user1: {$ne: req.session.user._id}}, {user2: 'EVERYONE'}]}, {user2: req.session.user._id}]}
																	:(req.body.status=='1')?{user1: req.session.user._id}
																								  :{$or:[
																										{user1: req.session.user._id},
																										{user2: req.session.user._id}]}]
		}, function(err, bets){
		if(err){
			console.log(err);
		} else {
			bets.forEach(function(single){
				// flip response data if someone else instigated bet
				if (single.user2 == req.session.user._id){
					// console.log(single.status+' '+single.user1+' '+single.user2);
					tmp = single.user1;
					tmp2 = single.team1;
					single.user1 = single.user2;
					single.team1 = single.team2;
					single.user2 = tmp;
					single.team2 = tmp2;
					single.status = 1;  // 1 means the other guy needs to act; 0 means req.session.user
					if (single.type == 'spread' && single.odds < 0)
						single.odds = Math.abs(single.odds);
					else if (single.type == 'spread')
						single.odds = -Math.abs(single.odds);
					if (single.type == 'over')
						single.type = 'under';
					else if (single.type == 'under')
						single.type = 'over';
				}
				sortedBets.push(single);
			});
			res.json(sortedBets);
		}
	}).sort({date:-1});
});

router.post('/changebet', requireLogin, function(req,res){
	// console.log(req.body);
	switch (req.body.action) {
		case 'delete':  // delete bet
			// if not save later bet or future, decrement bet flag notice
			let  tmp = new Promise((resolve, reject) => {
				Bets.findOne({_id:req.body.id}, function(err, singleBet){
					if(err) {
						console.log(err);
						reject();
					} else if (singleBet){
						if (singleBet.status === 0 && singleBet.type != 'give' && singleBet.type != 'take') {
							changeUser(singleBet.user2, 'bets', -1);
						}
						resolve();
					}
				});
			}).then(function() {
				Bets.remove({_id:req.body.id}, function(err){
					if(err)
						console.log(err);
					else {
						logger.info('Bet _id='+req.body.id+' deleted');
						res.send({'type':'success', 'message':'Bet deleted'});
					}
				});
			});
			break;
		case 'accepted':   // bet accepted
			let updateFields = {
				status: req.body.status,
				comment:req.body.comment
			};
			if (req.body.future)
				updateFields.user2 = req.session.user._id;
			// below query has id AND status in case first to act bet was already acted on but other people have been haven't updated locally
			Bets.findOneAndUpdate({_id: req.body.id, status: 0}, updateFields, function(err, acceptedBet){
				if(acceptedBet){
					logger.info('Bet'+((acceptedBet.fta)?'(fta)':'')+' _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
					changeUser(req.session.user._id, 'bets', -1);
					Util.textUser(acceptedBet.user1, acceptedBet.user2+' accepted your '+acceptedBet.team1+'/'+acceptedBet.team2+' bet', true);
					if (acceptedBet.limit > 1) {	// number of bets to give is limited but this not the last; update others
						Bets.update({$and:[{fta: acceptedBet.fta}, {user2:{$ne: req.session.user._id}}]},{$inc:{limit: -1}}, {multi: true}, function(err) {
								if (err)
									console.log(err);
							});
					} else if (acceptedBet.limit == 1)	{ // number of bets limited and this is last; cancel others
						Bets.find({$and:[{fta: acceptedBet.fta}, {status: 0}, {user2:{$ne: req.session.user._id}}]}, function(err, otherBets) {
							otherBets.forEach(otherBet => {
								changeUser(otherBet.user2, 'bets', -1);
							});
						}).then(function(){
							Bets.update({$and:[{fta: acceptedBet.fta}, {status: 0}, {user2:{$ne: req.session.user._id}}]},{status: 3, fta: 0}, {multi: true}, function(err) {
								if (err)
									console.log(err);
							});
						});
					}
					res.send({'type':'success', 'message':'Bet accepted'});
				} else {
					res.send({'type':'danger', 'message':'Bet not accepted, please refresh'});
				}
			});
			break;
		case 'refused':   // bet refused
			Bets.update({_id:req.body.id},{status:req.body.status, comment:req.body.comment}, function(err){
				if(err){
					console.log(err);
				} else {
					logger.info('Bet _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
					res.send({'type':'success', 'message':'Reply Sent'});
					changeUser(req.session.user._id, 'bets', -1);
				}
			});
			break;
		case 'change':
			Bets.update({_id: req.body.id}, req.body, function(err) {
				if(err)
					console.log(err);
				else {
					logger.info('Bet _id='+req.body.id+' changed - '+new Date());
					res.send({'type':'success', 'message':'Change made'});
				}
			});
			break;

	}
});

router.post('/weeklystats', requireLogin, function(req,res){
	let sortedBets = [];
	Bets.find({$and:[{season:seasonStart[req.body.sport].getFullYear()}, {sport: req.body.sport}, {week: req.body.date}, {status: {$in:[2,4,5,6]}}]}, function(err,complete){
		if(err){
			console.log(err);
		} else {
			complete.forEach(function(single){
				// flip response data if someone else instigated bet
				if (single.user1 != req.session.user._id){
					tmp = single.user1;
					tmp2 = single.team1;
					single.user1 = single.user2;
					single.team1 = single.team2;
					single.user2 = tmp;
					single.team2 = tmp2;
					if (single.odds < 0)
						single.odds = Math.abs(single.odds);
					else
						single.odds = -Math.abs(single.odds);
					if (single.status == 4)
						single.status = 5;
					else if (single.status == 5)
						single.status = 4;
				}
				sortedBets.push(single);
			});
			res.json(sortedBets);
		}
	}).sort({date: -1, user1: 1, });
});

router.post('/overallstats', requireLogin, function(req,res){
	let stats = [];
	if (req.body.season != 'All') {
		Records.find({user:{$ne: 'testuser'}, sport: req.body.sport, season: req.body.season, pct: {$exists: true}}, function(err,records){
			if (err) {
				console.log(err);
			} else {
				res.json(records);
			}
		}).sort({pct:-1});
	} else {
		Records.find({user:{$ne: 'testuser'}, sport: req.body.sport, pct: {$exist: true}}, function(err,records){
			if (err) {
				console.log(err);
			} else {
				res.json(records);
			}
		}).sort({pct:-1});
	}
});

router.post('/graphstats', requireLogin, function(req,res){
	let dates = [],
		results = {},
		currentWeek = 1;
	// if (Util.getWeek(new Date(), 'nfl') > 9) {
	// 	currentWeek = Util.getWeek(new Date(), 'nfl') / 2;
	// 	console.log(currentWeek);
	// }
	// console.log(req.body.period);
	// find all valid bets during period, keep numBets and process
	Bets.find({$and:[ (req.body.user == 'ALL')?{}:{$or:[{user1: req.body.user},
																		{user2: req.body.user}]},
							{status:{$in: [4,5,6]}},
							{sport: req.body.sport},
							{season: req.body.season},
							{week: {$gte: currentWeek}}]}, function(err, bets){
		if (err) {
			console.log(err);
		} else {
			bets.forEach(function(bet, index){
				// console.log(`${index} ${currentWeek} ${bet.week} ${bet.user1} ${bet.user2} ${bet.team1} ${bet.team2}`);
				// check if stop date to store data
				if (bet.week > currentWeek) {
					// store date for xaxis labels
					dates.push(currentWeek);
					// on date, save win % per user
					for (let username in results) {
						results[username].data.push(results[username].total/results[username].numBets);
					}
					// advance next date to stop on
					currentWeek = bet.week;
				}
				// if new user, create new record
				if (!results[bet.user1]) {
					results[bet.user1]={total: 0, numBets: 0};
					results[bet.user1].data = Array(dates.length).fill(NaN);
				}
				if (!results[bet.user2]) {
					results[bet.user2]={total: 0, numBets: 0};
					results[bet.user2].data = Array(dates.length).fill(NaN);
				}
				// increment counters
				if (bet.status == 4) {
					results[bet.user1].total++;
				} else if (bet.status == 5) {
					results[bet.user2].total++;
				} else {
					results[bet.user1].total+=0.5;
					results[bet.user2].total+=0.5;
				}
				results[bet.user1].numBets++;
				results[bet.user2].numBets++;
			});
			// push remaining info once done
			dates.push(currentWeek);
			for (let username in results) {
				results[username].data.push(results[username].total/results[username].numBets);
			}
		}
		res.send({
		  xaxis : dates,
		  datasets: results
		});
	}).sort({week: 1});
});

router.post('/userstats', requireLogin, function(req,res){
	Bets.find({$and:[{$or:[{user1: req.body.user},
								  {user2: req.body.user}],
						  sport: req.body.sport,
						  season: req.body.season},
						  {status:{$in:[4,5,6]}},
						  (req.body.week)?{week:req.body.week}:{}]}, function(err, bets){
		if (err) {
			console.log(err);
		} else {
			let winList = {};
			bets.forEach(function(bet){
				let target, status=bet.status;
				if (bet.user1 == req.body.user) {
					target = bet.user2;
				} else {
					// flip things
					target = bet.user1;
					if (bet.status == 5) {
						status = 4;
					} else if (bet.status == 4) {
						status = 5;
					}
				}
				// check if record exists
				if (!winList[target]) {
					winList[target] = {win:0, loss:0, push:0};
				}
				// record win loss push
				if (status == 4) {
					winList[target].win += 1;
				} else if (status == 5) {
					winList[target].loss += 1;
				} else {
					if (bet.user1 == req.body.user) {
						winList[bet.user2].push += 1;
					} else {
						winList[bet.user1].push += 1;
					}
				}
			});
			res.json({bets, winList});
		}
	}).sort({date:-1});
});

router.get('/getprops', requireLogin, function(req,res){
	Bets.find({type: 'prop'}, function(err, props){
		res.json(props);
	}).sort({date: -1}).limit(50);
});

router.post('/acceptprop', requireLogin, function(req,res){
	Bets.updateOne({_id: req.body.id}, {user2: req.session.user._id}, function(err){
		if (err) {
			console.log("Prop accept error: "+err);
		} else {
			logger.info("Prop accepted: "+req.body.id);
			res.send({'type':'success', 'message':'Prop updated'});
		}
	});
});

router.post('/getstandings', requireLogin, function(req,res){
	OUgame.find({season: Number(req.body.season), sport: req.body.sport}, function(err, standings){
		if (err)
			console.log(err);
		else
		OUuser.find({season: Number(req.body.season), sport: req.body.sport}, function(err, users){
			if (err)
				console.log(err);
			else
				res.json({standings, users});
		}).sort({user:1});
	}).sort({team:1});
});

router.post('/getousignup', requireLogin, function(req,res){
	// first find list of all users
	OUuser.find({season: Number(req.body.season), sport: req.body.sport}, function(err, users){
		if (err) {
			console.log('Error getting OU users - '+err);
		} else {
			// next find choices for current user
			OUuser.findOne({season: Number(req.body.season), sport: req.body.sport, user: req.session.user._id}, function(err, choices){
				if (choices) {
					OUgame.find({season: Number(req.body.season), sport: req.body.sport}, function(err, teams){
						if (err) {
							console.log(err);
						} else {
							// add users choice to results
							teams.forEach(function(team, index){
								teams[index].pick = choices[index];
							});
							if (err) {
								console.log(err);
							} else {
								res.json({users: users, choices: teams});
							}
						}
					}).sort({index:1}).lean(); // lean needed to modify mongoose object above
				} else {
					res.json({users: users});
				}
			});
		}
	}).sort({user:1});
});

router.post('/setouchoices', requireLogin, function(req,res){
	OUuser.updateOne({user: req.session.user._id, season: req.body.season, sport: req.body.sport}, JSON.parse(req.body.choices), function(err){
		if (err)
			console.log("OU choice change error: "+err);
		else {
			res.send({'type':'success', 'message':'Choices updated'});
		}
	});
});

router.post('/getouusers', requireLogin, function(req,res){
	OUuser.find({}, function(err,users){
		if (err)
			console.log('Error getting OU users - '+err);
		else
			res.json(users);
	}).sort({user:1});
});

router.post('/ousignup', requireLogin, function(req,res){
	OUuser.findOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport}, function(err, result){
		if (err)
			console.log(err);
		if (result) {
			res.send({'type':'danger', 'message':'Already joined'});
		} else {
			new OUuser({
				user: req.session.user._id,
				season: Number(req.body.season),
				sport: req.body.sport
			}).save(function(err){
				if (err)
					console.log('Error saving new OUuser: '+err);
				else
					res.send({'type':'success', 'message':'You are now signed up'});
			});
		}
	});
});

router.post('/gettourney', function (req, res) {
	if (new Date() < new Date("4/16/2022 12:00")){
		OUuser.findOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport}, function(err, result){
			if (err) {
				console.log(err);
			} else if (result) {
				res.json({results: [], users: result});
			} else {
				const newRecord = {
					user: req.session.user._id,
					season: Number(req.body.season),
					sport: req.body.sport
				};
				const nbaFirstRound = ['ATL', 'MIA', 'TOR', 'PHI', 'BKN', 'BOS', 'CHI', 'MIL', 'NOP', 'PHO', 'UTA', 'DAL', 'MIN', 'MEM', 'DEN', 'GS']; // 8, 1, 5, 4, 7, 2, 6, 3 ...
				for (let index=0; index < 30; ++index){
					if (index < 16) {
						newRecord[index] = nbaFirstRound[index];
					} else {
						newRecord[index] = '';
					}
				}
				new OUuser(newRecord).save(err => {
					if (err) {
						console.log('Error saving new OUuser: '+err);
					} else {
						res.json({results: [], users: newRecord});
					}
				});
			}
		});
	} else { // after selection time
		OUuser.find({season: Number(req.body.season), sport: req.body.sport}, function(err, users){
			if (err) {
				console.log(err);
			} else {
				let allPicks=[];
				users.forEach((user, userIndex)=>{
					let game = 0,userPicks = {};
					userPicks['user'] = user.user;
					for(let i=0; i < 30; ++i){
						if(user[i].endsWith('*')){
							userPicks[game] = user[i].slice(0,-1);
							++game;
						}
					}
					allPicks.push(userPicks);
				});
				OUgame.find({season: Number(req.body.season), sport: req.body.sport}, function(err, results){
					if (err) {
						console.log(err);
					} else {
						res.json({results: results, users: allPicks});
					}
				}).sort({index: 1});
			}
		});
	}
});   

router.post('/getbtascoreboard', requireLogin, (req,res) => {
	Records.find({season: Number(req.body.season), sport: 'bta'+req.body.sport}).sort({user:1})
	.then(totals => {
		Odds.count({sport:req.body.sport, season: Number(req.body.season)})
		.then (count => {
			res.send({totals, count});
		});
	});
});

router.post('/getbtapicks', requireLogin, function(req,res){
	let today = new Date(), targetDate = new Date(req.body.date);
	let results = {odds: [], picks: [], players: [], timeToPick: Util.checkSameDate(targetDate, today) && ((req.body.sport == 'nfl' && today.getDay() == 0 && today.getHours() < 12) || (req.body.sport == 'nba' && today.getHours() < 18))}; //(today.getHours() < 11 || (today.getHours() == 11 && today.getMinutes() < 30))
	Odds.find({season: Number(req.body.season), date: targetDate.setHours(0,0,0,0), sport: req.body.sport}, (err, odds) =>{
		if (err) {
			console.log('Error getting weeks ATS odds: '+err);
		} else {
			results.odds = odds;
			// get everyones picks even if before 6 so can send list of players; before 6 only single person's picks sent, otherwise all are sent
			Ats.find({date: targetDate, season: Number(req.body.season), sport: req.body.sport}, (err, allPicks) =>{
				if (err) {
					console.log(err);
				} else {
					if (results.timeToPick){ // before end of picking period, only send 1 person
						allPicks.forEach(pick => {
							if (pick.user == req.session.user._id) {
								results.picks = [pick];
							}
							results.players.push(pick.user);
						});
					} else {
						results.picks = allPicks;
					}
					res.send(results);
				}
			}).sort({user:1});
		}
   }).sort({index:1});
});

router.post('/createbtaodds', requireLogin, function(req,res){
	let today = new Date();
	// console.log(req.body);
	const targetDate = new Date(req.body.date);
	if ((req.body.sport == 'nfl' && today.getHours() > 11) || (req.body.sport == 'nba' && today.getHours() > 17)) {
		res.send({'type':'danger', 'message':'too late, try tomorrow'});
	} else {
		Odds.find({sport: req.body.sport, season: Number(req.body.season), date: req.body.date}, (err, odds) =>{
			if (err) {
				console.log('Error getting weeks ATS odds: '+err);
			} else if (!odds.length) {
				let index = 0;
				let current = JSON.parse(fs.readFileSync('json/'+req.body.sport+'_odds.json'));
				current.games.forEach(game => {
					if (new Date(game.date).getDate() == targetDate.getDate() && new Date(game.date).getMonth() == targetDate.getMonth()) {  //only look at today, may include future odds
						new Odds({
							team1: game.team1,
							team2: game.team2,
							spread: game.spread,
							date: game.date,
							sport: req.body.sport,
							week: Util.getWeek(targetDate, req.body.sport),
							date: targetDate.setHours(0,0,0,0),
							season: req.body.season,
							ats: 0,
							index: index++
						}).save(err2 => {
							if(err2)
								console.log('Error saving new odds: '+err);
						});
					}
				});
				console.log('Challenge started, copied odds to db',new Date());
				res.send({'type':'success', 'message':'Odds published for today'});
				// send out texts
				let pref_sport = {};
				pref_sport['pref_'+req.body.sport+'_everyone'] = true;
				Users.find({$and: [{_id: {$nin:[req.session.user._id,'testuser']}}, pref_sport]}, {_id: 1}, function(err, users){
					users.forEach(user => {
						Util.textUser(user._id, 'Someone has started a '+((req.body.sport == 'nfl')?'NFL':'NBA')+' Bet Them All challenge, join if you want');
					});
				});
			} else {
				console.log('Odds for today already exist');
				res.send({'type':'danger', 'message':'Odds for today already exist'});
			}
		});
	}
});

router.post('/updatebta', requireLogin, (req,res) => {
	let today = new Date();

	if((today.getHours >= 12)) {
		res.send({'type':'danger', 'message':'Games started, no changes'});
	} else {
		Ats.updateOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport, date: new Date(req.body.date).setHours(0,0,0,0)}, JSON.parse(req.body.picks), {upsert: true}, function(err, docs){
			if (err)
				console.log("ATS change error: "+err);
			else {
				res.send({'type':'success', 'message':'Picks updated'});
			}
		});
	}
});

router.post('/getTracker', requireLogin, (req,res) => {
	let promises = [];
	const today = new Date().setHours(0,0,0,0);
	promises.push(Tracker.find({user: 'system', season: Number(req.body.season), sport: req.body.sport}).sort({team:1}));
	promises.push(Odds.find({sport: req.body.sport, date: today}).sort({index:1}));
	// promises.push(Ats.findOne({user: req.session.user._id, sport: 'tracker'+req.body.sport, date: today},'-_id 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15')); //only send picks
	promises.push(Tracker.find({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport}).sort({team:1}));
	Promise.all(promises).then(results => {
		res.send(results);
	});
});

router.post('/getTrackerPicks', requireLogin, (req,res) => {
	let promises = [];
	const today = new Date(req.body.period).setHours(0,0,0,0);
	promises.push(Ats.findOne({user: req.session.user._id, sport: 'tracker'+req.body.sport, date: today},'-_id 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15'));
	promises.push(Odds.find({sport: req.body.sport, date: today}).sort({index:1}));
	Promise.all(promises).then(results=>{
		res.send(results);
	});
});

router.post('/trackerTeam', requireLogin, function(req,res){
	Odds.find({$or:[{team1: req.body.team},{team2: '@'+req.body.team}], sport: req.body.sport, season: req.body.season, ats: {$ne:0}}, (err, odds) => {
		if (err) {
			console.log('Error getting tracker team stats:'+err);
		} else {
			let userPicks={};
			Ats.find({sport: req.body.sport, season: req.body.season, user: req.session.user._id},'-_id date 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15', (err, picks) => {
				if (picks.length){
					odds.forEach(game => {
							
					});
					res.json({odds: odds, picks: userPicks});
				}
			});
		}
	});
});

router.post('/trackerPicks', requireLogin, (req,res) => {
	let today = new Date();
	if((today.getHours >= 23)) {
		res.send({'type':'danger', 'message':'Games started, no changes'});
	} else {
		Ats.updateOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport, date: new Date(req.body.date).setHours(0,0,0,0)}, JSON.parse(req.body.picks), {upsert: true}, function(err, docs){
			if (err) {
				res.send({'type':'danger', 'message':'Picks not updated'});
				console.log("ATS change error: "+err);
			} else {
				res.send({'type':'success', 'message':'Picks updated'});
			}
		});
	}
});

router.post('/setprefs', requireLogin, function(req,res){
	if (req.body.password) {
		req.body.password = bcrypt.hashSync(req.body.password, 10);
	}
	Users.update({_id:req.session.user},req.body, function(err){
		if(err){
			console.log(err);
		} else {
			console.log('Preferences changed for '+req.session.user._id+' - '+new Date());
			res.send({'type':'success', 'message':'Preferences changed'});
		}
	});
});

router.get('/getprefs',function(req,res){
	Users.findOne({_id: req.session.user}, {_id:1,  pref_nfl_everyone:1, pref_nba_everyone:1, pref_text_receive:1, pref_text_accept:1, sms: 1, pref_default_page: 1}, function(err,user){
		res.json(user);
	});
});

function markPaid(betid, user) {
	Bets.findByIdAndUpdate({_id:betid}, {paid: true}, function(err, single){
		if(err){
			console.log(err);
		} else {    // need to also mark debt flag in user db for notifications
			if(single.user1 != user){
				let tmp = single.user1;
				let tmp2 = single.team1;
				single.user1 = single.user2;
				single.team1 = single.team2;
				single.user2 = tmp;
				single.team2 = tmp2;
			}
			// below changes winner/loser debt flags: debts owed in first 4 bits, debts owed to next 4 bits
			Users.update({_id: single.user1}, {$inc:{debts: -(1<<4)}}, function (err) {  //reduce winners flag
				if(err)
					console.log(err);
			});
			Users.update({_id: single.user2}, {$inc:{debts: -1}}, function (err) {   //increase loser flag
				if(err)
					console.log(err);
			});
			logger.info('Bet#'+betid+' marked paid by '+user+' - '+new Date());
			return 1;
		}
	});
}

// assumed only called by winner of bet
router.post('/debtpaid', requireLogin, function(req,res){
	if(markPaid(req.body.id, req.session.user._id))
		res.send({'type':'success', 'message':'Bet marked paid'});
	else {
		res.send({'type':'danger', 'message':'Trouble marking bet paid, try again'});

	}
});

//retrieves both bets owed to someone else and someone else owing user
router.get('/getdebts', requireLogin, function(req,res){
	let sortedBets = [];
	Bets.find({$and:[{$or:[{user1: req.session.user},{user2: req.session.user}]},{status:{$in:[4,5]}}, {paid:false}]}, function(err,bets){
		bets.forEach(function(single){
			if (single.user1 != req.session.user._id){   //serve back to user as if bet initiator
				let tmp = single.user1;
				let tmp2 = single.team1;
				single.user1 = single.user2;
				single.team1 = single.team2;
				single.user2 = tmp;
				single.team2 = tmp2;
				if (single.status == 4)
					single.status = 5;
				else {
					single.status = 4;
				}
			}
			sortedBets.push(single);
		});
		res.json(sortedBets);
	}).sort({date: -1});
});

router.post('/resolvefinish', requireLogin, function(req,res){

	function findAndMark(winner, loser){
		Bets.find({$and:[{paid: false}, {$or:[{$and:[{status: 4}, {user1: winner}, {user2: loser}]},{$and:[{status: 5}, {user1: loser}, {user2: winner}]}]}]}, function(err, bets){
			bets.forEach(function(bet) {
				markPaid(bet._id, winner);
			});
		}).sort({date: 1}).limit(Number(req.body.num));
	}

	if (req.body.name.includes('/')) {
		findAndMark(req.session.user._id, req.body.name.split('/')[0]);
		findAndMark(req.body.name.split('/')[0], req.body.name.split('/')[1]);
		findAndMark(req.body.name.split('/')[1], req.session.user._id);
		logger.info(`${req.session.user._id} auto resolved 3-way offsetting bet between ${req.body.name.split('/')[0]} and ${req.body.name.split('/')[1]}`);
		Util.textUser(req.body.name.split('/')[0], 'Notice: '+req.session.user._id+' auto resolved '+req.body.num+' 3-way offsetting bets between you & '+req.body.name.split('/')[1]+' - no further action required');
		Util.textUser(req.body.name.split('/')[1], 'Notice: '+req.session.user._id+' auto resolved '+req.body.num+' 3-way offsetting bets between you & '+req.body.name.split('/')[0]+' - no further action required');
	} else {
		findAndMark(req.session.user._id, req.body.name);
		findAndMark(req.body.name, req.session.user._id);
		logger.info(`${req.session.user._id} auto resolved bet with ${req.body.name}`);
		Util.textUser(req.body.name, 'Notice: '+req.session.user._id+' marked paid '+req.body.num+' pair offsetting bets between you - no further action required');
	}
	res.send({'type':'success', 'message':'Offset debts recorded'});
});

function getDebtList (person){
	return new Promise ((resolve, reject) => {
		let debtList = {owes: {}, isowed: {}};

		Bets.find({$and:[{paid: false}, {status: {$in:[4,5]}}, {$or:[{user1: person}, {user2: person}]}]}, function(err, bets){
			bets.forEach(function(bet){
				if ((bet.status == 4 && bet.user1 == person) || (bet.status == 5 && bet.user2 == person)) {
					// swap users in case the latter above
					if (bet.user2 == person)
						bet.user2 = bet.user1;
					if (!debtList.isowed[bet.user2]) {
						debtList.isowed[bet.user2] = 1;
					} else {
						debtList.isowed[bet.user2] += 1;
					}
				} else {
					// swap users in case the latter above
					if (bet.user2 == person)
						bet.user2 = bet.user1;
					if (!debtList.owes[bet.user2]) {
						debtList.owes[bet.user2] = 1;
					} else {
						debtList.owes[bet.user2] += 1;
					}
				}
			});
			resolve(debtList);      
		});
	});
}

router.get('/resolvedebts', requireLogin, function(req,res){
	let results = [],
		promises = [];

	getDebtList(req.session.user._id)
	.then(debtList1 => {
		promises.push(new Promise((resolve, reject) =>{
			// check isowed 2way list first
			for (let debtor in debtList1.isowed) {
				// find 2way match
				if (debtList1.owes[debtor]) {
					results.push({name: debtor, num: Math.min(debtList1.owes[debtor], debtList1.isowed[debtor])});
				} else { //check for isowed 3way
					promises.push(new Promise((resolve, reject)=>{
						getDebtList(debtor)
						.then(function(debtList2){
							for (let debtor2 in debtList2.isowed) {
								if (debtList1.owes[debtor2]) {
									results.push({name: debtor+'/'+debtor2, num: Math.min(debtList1.owes[debtor2], debtList2.isowed[debtor2])});
								}
							}
							resolve();  //done with isowed 3way check
						});
					}));
				}
			}
			resolve();  //done with isowed 2way check
		}));

		Promise.all(promises).then(function(){
			res.send(results);   
		});
	});
});

router.post('/getfutureoffers', requireLogin, function(req,res){
	Bets.find({$and:[{status: req.body.status}, {$or: [{type: 'give'}, {type: 'take'}]}]}, function(err, offers){
		res.json({
			sessionId: req.session.user._id,
			offers: offers
		});
	});
});

router.get('/getfutures', function (req, res) {
	if (fs.existsSync('json/futures.json'))
		res.sendFile('./json/futures.json', {'root':__dirname+'/..'});
});

router.get('/getlogs', function (req, res) {
	// if (fs.existsSync('json/log.json')) {
	//    res.sendFile('./json/log2.json', {'root':__dirname+'/..'});
	// }
	Users.findOne({_id: req.session.user}, function(err,user){
		if (err) {
			console.log(err);
		} else if(user) {
			// create message
			const payload = JSON.stringify({ title: "Push Test", body: 'body'});
			// Pass object into sendNotification
			webpush.sendNotification(JSON.parse(user.push), payload)
			.catch(err => console.error(err));
		}
	});
});

router.post("/pushsubscribe", (req, res) => {
	console.log('pushsubscribe');
	Users.update({_id:req.session.user}, {push: JSON.stringify(req.body)}, function(err){
		if(err){
			console.log(err);
		} else {
			console.log('saved to db');
		}
	});
	const subscription = req.body;
	res.status(201).json({});
});

router.post('/getodds', function (req, res) {
	res.sendFile('./json/'+req.body.sport+'_odds.json', {'root':__dirname+'/..'});
}); 

// gets userlist for bet select list
router.get('/users', requireLogin, function(req,res){
	Users.find({_id: {$ne:req.session.user}}, {_id: 1, pref_default_page: 1}, function(err,user){
		res.json(user);
	}).sort({_id:1});
});

// called when new page is loaded
router.get('/doorbell', requireLogin, function(req,res){
	let today = new Date(),
		answer = {
			type: 'message',
			sports: []
			// username: req.session.user._id
		};

		let sportsPromise = new Promise((resolve, reject)=>{
		Sports.find({inseason: true}, {sport:1, start: 1}, (err, sports)=>{
			if (err)
				reject(err);
			sports.forEach(sport => {
				answer.sports.push(sport);
			});
			resolve();
		});
	});
	let betsPromise = new Promise((resolve, reject)=>{
		Users.findOne({_id: req.session.user}, (err,user)=>{
			if (err)
				reject(err);
			if (user){
				answer.bets = user.bets;
				answer.debts = user.debts;
			}
			resolve();
		});
	});
	let futuresPromise = new Promise((resolve, reject)=>{
		Bets.findOne({$and:[{status: 0},{$or: [{type: 'give'}, {type: 'take'}]}]}, function(err, future) {
			if (err)
				reject(err);
			if (future) {
				answer.futures = true;
			}
			resolve();
		});
	});
	let propsPromise = new Promise((resolve, reject)=>{
		Bets.findOne({$and:[{type: 'prop'}, {user2: 'OPEN'}, {date:{$gt:new Date().setHours(0,0)-(1000*60*60*24*7)}}]}, function(err, prop) {
			if (err)
				reject(err);
			if (prop) {
				answer.props = true;
			}
			resolve();
		});
	});
	Promise.all([sportsPromise, betsPromise, futuresPromise, propsPromise]).then(values=>{
		// console.log(answer);
		res.send(answer);
	});
});

function changeUser(user, key, inc) {
	let tmp = {};
	tmp[key] = inc;
	Users.update({_id: user}, {$inc: tmp}, function(err){
		if(err)
			console.log('Trouble with changing user '+key);
	});
}
