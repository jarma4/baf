const { seasonStart } = require('../models/util');
const { Users, Records, Bets, Sports, OUgame, OUuser, Ats, Odds, Tracker} = require('../models/dbschema');
const express = require('ultimate-express'),
		bodyParser = require('body-parser'),
		fs = require('fs'),
		// Auth = require('./auth'),
		logger = require('pino')({}, fs.createWriteStream('./json/log.json', {'flags': 'a'})),
		session = require('client-sessions'),
		bcrypt = require('bcryptjs'),
		Util = require('../models/util'),
		mongoose = require('mongoose'),
		webpush = require('web-push');
		// Tourney = require('./tourney');

mongoose.set('strictQuery', true);
mongoose.connect(process.env.BAF_MONGO_URI)
.catch(err => console.log(err));

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

router.use(async (req, res, next) => {
	if (req.session && req.session.user) {
      try{
         const user = await Users.findOne({ _id: req.session.user._id });
         if (user) {
            req.user = user;
            if (user.secure != undefined) {
               JSON.parse(user.secure).pages.forEach(page => {
                  req[page] = true;
               });
            }
            delete req.user.password;
            req.session.user = user;
            res.locals.user = user;
         }
         next();
      } catch (err){
         console.log(err);
      }
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
		// res.send({'type':'command', 'message':'$("#loginModal").modal()'});
		res.send({'type':'command', 'message':'login'});
	} else {
		next();
	}
}

// fix for duplicate bets: bets come in with random serial#, saved on stack
// timer removes; if bet with same serial# comes in that is on stack, refused
let betStack = [];

// pulled out so EVERYONE bets can call multiple times along with single bets
function saveBet (req){
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
	}).save()
	.then(() => {
		logger.info('Bet added: user1='+req.session.user._id+" user2="+req.body.user2+" picks="+req.body.team1+" odds="+req.body.odds);
		return ({'type':'success', 'message':(req.body.watch==true)?'Odds watch set':'Bet Saved'});
	})
	.catch(err => {
		logger.error('Trouble adding bet: '+err);
		return ({'type':'danger', 'message':'Trouble adding bet'});
	});
	if (req.body.watch==false && req.body.type != 'give' && req.body.type != 'take') {
		changeUser (req.body.user2, 'bets', 1);
		// Util.textUser(req.body.user2, ((req.body.sport=='nba')?'NBA':'NFL')+' bet: '+req.body.user2+'='+req.body.team2+', '+req.session.user._id+'='+req.body.team1);
	}
}

// pulled out as function so can be called internally by watch bets being auto sent
async function makeBet (req) {
	// check stack if bet has already come through, exit if so
	if (betStack.indexOf(req.body.serial) != -1) {
		console.log('previous bet found with serial#'+req.body.serial);
		return;
	}

	// add bet serial# to stack to check for duplicates later
	betStack.push(req.body.serial);
	// remove after 10 seconds
	setTimeout(() => {
		betStack.splice(betStack.indexOf(req.body.serial),1);
	}, 10000);

	// if EVERYONE bet, need to go through user db and send to each
	if ((req.body.user2 == 'EVERYONE') && req.body.watch == false) {
		Users.find({$and: [
				{_id: {$nin:[req.session.user._id,'testuser']}},
				(req.body.sport == 'nfl')? {pref_nfl_everyone: true}:{pref_nba_everyone: true}]}, {_id: 1})
		.then(users => {
			users.forEach((single) => {
				req.body.user2 = single._id;
				saveBet(req);
			})
		})
		.catch (err => console.log(err));
	} else {
		saveBet(req);
	}
	if (req.body.watch==false && req.body.type != 'give' && req.body.type != 'take') {
		let message;
		if (req.body.type == 'spread') {
			const reverseOdds = (req.body.odds>=0)?0-req.body.odds:-1*req.body.odds;
			message = ((req.body.sport=='nba')?'NBA':'NFL')+' bet: '+req.body.user2+'='+req.body.team2+((reverseOdds>=0)?'+':'')+reverseOdds+', '+req.session.user._id+'='+req.body.team1+((req.body.odds>=0)?'+':'')+req.body.odds;
		} else {
			message = ((req.body.sport=='nba')?'NBA':'NFL')+' bet: '+req.body.team1+'/'+req.body.team2+' '+req.body.user2+'='+((req.body.type=='over')?'Under ':'Over ')+req.body.odds+', '+req.session.user._id+'='+((req.body.type=='over')?'Over ':'Under ')+req.body.odds;
		}
		Util.sendSlack(req.body.user2, message);
	}
}

router.post('/makebet', requireLogin, (req, res) => {
	makeBet(req);
	res.send({'type':'success', 'message':(req.body.watch==true)?'Odds watch set':'Bet Sent'});
});

router.post('/getbets', requireLogin, async (req, res)=>{
	let sortedBets = [];
	Bets.find({$and:[{status:(req.body.status==1)?0:req.body.status}, {type: {$in: ['spread', 'over', 'under']}}, (Number(req.body.all))?{$and:[{user1: {$ne: req.session.user._id}}, {user2: {$ne: req.session.user._id}}]}
			:(req.body.status=='0')?{user2: req.session.user._id}
				:(req.body.status=='1')?{user1: req.session.user._id}
				:{$or:[
					{user1: req.session.user._id},
					{user2: req.session.user._id}]}]
	}).sort({date:-1})
	.then(bets => {
		bets.forEach(single => {
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
	})
	.catch (err => console.log(err));
});

router.post('/changebet', requireLogin, async (req, res)=>{
	// console.log(req.body);
	switch (req.body.action) {
		case 'delete':  // delete bet
			// if not save later bet or future, decrement bet flag notice
			let  tmp = new Promise(async (resolve, reject) => {
				Bets.findOne({_id:req.body.id})
				.then(singleBet => {
					if (singleBet){
						if (singleBet.status === 0 && singleBet.type != 'give' && singleBet.type != 'take') {
							changeUser(singleBet.user2, 'bets', -1);
						}
						resolve();
					}
				})
				.catch(err => {
					console.log(err);
					reject();
				});
			})
			.then(() => {
				Bets.deleteOne({_id:req.body.id})
				.then(() => {
					logger.info('Bet _id='+req.body.id+' deleted');
					res.send({'type':'success', 'message':'Bet deleted'});
				})
				.catch (err => console.log(err));
			});
			break;
		case 'accepted':   // bet accepted
			let updateFields = {
				status: req.body.status,
				comment:req.body.comment
			};
			if (req.body.future) {
				updateFields.user2 = req.session.user._id;
			}
			// below query has id AND status in case first to act bet was already acted on but other people have been haven't updated locally
			Bets.findOneAndUpdate({_id: req.body.id, status: 0}, updateFields)
			.then(acceptedBet => {
				if(acceptedBet){
					logger.info('Bet'+((acceptedBet.fta)?'(fta)':'')+' _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
					changeUser(req.session.user._id, 'bets', -1);
					Util.sendSlack(acceptedBet.user1, acceptedBet.user2+' accepted your '+acceptedBet.team1+'/'+acceptedBet.team2+' bet', true);
					if (acceptedBet.limit > 1) {	// number of bets to give is limited but this not the last; update others
						Bets.updateMany({$and:[{fta: acceptedBet.fta}, {user2:{$ne: req.session.user._id}}]},{$inc:{limit: -1}}, {multi: true})
						.catch(err => console.log(err));
					} else if (acceptedBet.limit == 1)	{ // number of bets limited and this is last; cancel others
						Bets.find({$and:[{fta: acceptedBet.fta}, {status: 0}, {user2:{$ne: req.session.user._id}}]})
						.then(otherBets => {
							otherBets.forEach(otherBet => {
								changeUser(otherBet.user2, 'bets', -1);
							});
							Bets.updateMany({$and:[{fta: acceptedBet.fta}, {status: 0}, {user2:{$ne: req.session.user._id}}]},{status: 3, fta: 0}, {multi: true})
							.catch(err => console.log(err));
						})
						.catch (err => console.log(err));
					}
					res.send({'type':'success', 'message':'Bet accepted'});
				} else {
					res.send({'type':'danger', 'message':'Bet not accepted, please refresh'});
				}
			})	
			.catch (err => console.log(err));
			break;
		case 'refused':   // bet refused
			Bets.updateOne({_id:req.body.id},{status:req.body.status, comment:req.body.comment})
			.then(() => {
				logger.info('Bet _id='+req.body.id+' changed to '+req.body.status+' - '+new Date());
				res.send({'type':'success', 'message':'Reply Sent'});
				changeUser(req.session.user._id, 'bets', -1);
			})
			.catch (err => console.log(err));
			break;
		case 'change':
			Bets.updateOne({_id: req.body.id}, req.body)
			.then(() => {
				logger.info('Bet _id='+req.body.id+' changed - '+new Date());
				res.send({'type':'success', 'message':'Change made'});
			})
			.catch (err => console.log(err));
			break;
	}
});

router.post('/weeklystats', requireLogin, async (req, res)=>{
	let sortedBets = [];
	try {
		const complete = await Bets.find({$and:[{season:seasonStart[req.body.sport].getFullYear()}, {sport: req.body.sport}, {week: req.body.date}, {status: {$in:[2,4,5,6]}}]}).sort({date: -1, user1: 1, });
		complete.forEach(single => {
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
	} catch(err){
		console.log(err);
	}
});

router.post('/overallstats', requireLogin, async (req, res)=>{
	let stats = [];
	if (req.body.season != 'All') {
		try {
			const records = await Records.find({user:{$ne: 'testuser'}, sport: req.body.sport, season: req.body.season, pct: {$exists: true}}).sort({pct:-1});
			res.json(records);
		} catch (err) {
			console.log(err);
		}
	} else {
		try {
			const records = await Records.find({user:{$ne: 'testuser'}, sport: req.body.sport, pct: {$exist: true}}).sort({pct:-1});
			res.json(records);
		} catch (err) {
			console.log(err);
		}

	}
});

router.post('/graphstats', requireLogin, async (req, res)=>{
	let dates = [],
		results = {},
		currentWeek = 1;
	// if (Util.getWeek(new Date(), 'nfl') > 9) {
	// 	currentWeek = Util.getWeek(new Date(), 'nfl') / 2;
	// 	console.log(currentWeek);
	// }
	// console.log(req.body.period);
	// find all valid bets during period, keep numBets and process
	try {
		const bets = await Bets.find({$and:[ 
			(req.body.user == 'ALL')?
				{}:
				{$or:[
					{user1: req.body.user},
					{user2: req.body.user}]},
			{status:{$in: [4,5,6]}},
			{sport: req.body.sport},
			{season: req.body.season},
			{week: {$gte: currentWeek}}]}).sort({week: 1});
		bets.forEach((bet, index) => {
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
		res.send({xaxis : dates, datasets: results});
	} catch(err) {
		console.log(err);
	}
});

router.post('/userstats', requireLogin, async (req, res)=>{
	try {
		const bets = await Bets.find({$and:[{$or:[{user1: req.body.user},
									{user2: req.body.user}],
							sport: req.body.sport,
							season: req.body.season},
							{status:{$in:[4,5,6]}},
							(req.body.week)?{week:req.body.week}:{}]}).sort({date:-1});
		let winList = {};
		bets.forEach(bet => {
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
	} catch (err) {
		console.log(err);
	}
});

router.get('/getprops', requireLogin, async (req, res)=>{
	try {
		const props = await Bets.find({type: 'prop'}).sort({date: -1}).limit(50);
		res.json(props);		
	} catch (err) {
		console.log(err);
	}
});

router.post('/acceptprop', requireLogin, (req, res)=>{
	Bets.updateOne({_id: req.body.id}, {user2: req.session.user._id})
	.then(() => {
		logger.info("Prop accepted: "+req.body.id);
		res.send({'type':'success', 'message':'Prop updated'});
	})
	.catch(err => console.log("Prop accept error: "+err));
});

router.post('/getstandings', requireLogin, async (req, res)=>{
	try {
		const standings = await OUgame.find({season: Number(req.body.season), sport: req.body.sport}).sort({team:1});
		try {
			const users = await OUuser.find({season: Number(req.body.season), sport: req.body.sport}).sort({user:1});
			res.json({standings, users});			
		} catch (error) {
			console.log(err);
		}		
	} catch (err) {
		console.log(err);
	}
});

router.post('/getousignup', requireLogin, (req, res)=>{
	// first find list of all users
	OUuser.find({season: Number(req.body.season), sport: req.body.sport}, {_id:0, user: 1},).sort({user:1})
	.then(users => {
		// next find choices for current user
		OUuser.findOne({season: Number(req.body.season), sport: req.body.sport, user: req.session.user._id})
		.then(choices => {
			if (choices) {
				OUgame.find({season: Number(req.body.season), sport: req.body.sport}).sort({index:1}).lean()
				.then (teams => {
					// add users choice to results
					teams.forEach((team, index) => {
						teams[index].pick = choices[index];
					});
					res.json({users: users, choices: teams});
				}) // lean needed to modify mongoose object above
				.catch(err => console.log(err));
			} else {
				res.json({users: users});
			}
		})
		.catch(err => console.log(err));
	})
	.catch(err => console.log('Error getting OU users - '+err));
});

router.post('/setouchoices', requireLogin, (req, res)=>{
	OUuser.updateOne({user: req.session.user._id, season: req.body.season, sport: req.body.sport}, JSON.parse(req.body.choices), {upsert : true })
	.then(() => res.send({'type':'success', 'message':'Choices updated'}))
	.catch(err => console.log("OU choice change error: "+err));
});

router.post('/getouusers', requireLogin, (req, res)=>{
	OUuser.find({}).sort({user:1})
	.then(users => res.json(users))
	.catch(err =>console.log('Error getting OU users - '+err));
});

router.post('/ousignup', requireLogin, (req, res)=>{
	OUuser.findOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport})
	.then(result => {
		if (result) {
			res.send({'type':'danger', 'message':'Already joined'});
		} else {
			new OUuser({
				user: req.session.user._id,
				season: Number(req.body.season),
				sport: req.body.sport
			}).save()
			.then(() => res.send({'type':'success', 'message':'You are now signed up'}))
			.catch(err => console.log('Error saving new OUuser: '+err));
		}
	})
	.catch(err => console.log(err));
});

router.post('/gettourney', (req, res) => {
	Sports.findOne({sport: req.body.sport.substring(0,3)})
	.then (sportInfo => {
		if (new Date() < sportInfo.playoffs){ //still time to pick
			// OUuser.find({season: Number(req.body.season), sport: req.body.sport}, '-_id user', (err, players) => {
			// 	if (err) {
			// 		console.log(err);
			// 	}
			// });
			OUuser.find({season: Number(req.body.season), sport: req.body.sport}, '-_id 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 user')
			.then((allPicks) => {
				let players = [], picks=[];
				allPicks.forEach(pick => {
					if (pick.user == req.session.user._id) {
						picks.push(pick);
					}
					players.push(pick.user);
				});
				res.json({results: [], seeding: [sportInfo.seeding1, sportInfo.seeding2], players: players, picks: picks});
			})
			.catch((err)=> console.log(err));			
		} else { // after selection time
			OUuser.find({season: Number(req.body.season), sport: req.body.sport})
			.then((users)=>{
				let allPicks=[];
				users.forEach((user, userIndex)=>{
					let game = 0,userPicks = {};
					userPicks['user'] = user.user;
					for(let i=0; i < (req.body.sport.substring(0,3) == 'nfl'?26:30); ++i){
						if(user[i].endsWith('*')){
							userPicks[game] = user[i].slice(0,-1);
							++game;
						}
					}
					allPicks.push(userPicks);
				});
				OUgame.find({season: Number(req.body.season), sport: req.body.sport}).sort({index: 1})
				.then((results)=>{
					res.json({results: results, users: allPicks});
				})
				.catch((err)=> console.log(err));
			})
			.catch((err)=> console.log(err));
		}
	})
	.catch((err) => console.log(err));
});   

router.post('/getbtascoreboard', requireLogin, (req,res) => {
	Records.find({season: Number(req.body.season), sport: 'bta'+req.body.sport}).sort({user:1})
	.then(totals => {
		Odds.countDocuments({sport:req.body.sport, season: Number(req.body.season)})
		.then (count => {
			res.send({totals, count});
		});
	});
});

router.post('/getbtapicks', requireLogin, async (req, res)=>{
	let today = new Date(), targetDate = new Date(req.body.date);
	let results = {odds: [], picks: [], players: [], timeToPick: Util.checkSameDate(targetDate, today) && ((req.body.sport == 'nfl' && today.getDay() == 0 && today.getHours() < 12) || (req.body.sport == 'nba' && today.getHours() < 18))}; //(today.getHours() < 11 || (today.getHours() == 11 && today.getMinutes() < 30))
	try {
		const odds = await Odds.find({season: Number(req.body.season), date: targetDate.setHours(0,0,0,0), sport: req.body.sport, bta: true}).sort({index:1});
		results.odds = odds;
		// get everyones picks even if before 6 so can send list of players; before 6 only single person's picks sent, otherwise all are sent
		try {
			const allPicks = await Ats.find({date: targetDate, season: Number(req.body.season), sport: req.body.sport}).sort({user:1});
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
		} catch (err) {
			console.log(err);
		}
	} catch(err){
		console.log(err);
	}
});

router.post('/createbtaodds', requireLogin, (req, res)=>{
	const today = new Date();
	const targetDate = new Date(req.body.date);
	if ((req.body.sport == 'nfl' && today.getHours() > 11) || (req.body.sport == 'nba' && today.getHours() > 17)) {
		res.send({'type':'danger', 'message':'too late, try tomorrow'});
	} else {
		Odds.find({sport: req.body.sport, season: Number(req.body.season), date: req.body.date})
		.then(odds => {
			if (!odds.length) {
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
							bta: true,
							index: index++
						}).save()
						.catch(err => console.log('Error saving new odds: '+err));
					}
				});
				console.log('Challenge started, copied odds to db',new Date());
				res.send({'type':'success', 'message':'Odds published for today'});
				// send out texts
				Util.sendSlack('ALL', 'Someone has started a '+((req.body.sport == 'nfl')?'NFL':'NBA')+' Bet Them All challenge, join if you want');
			} else {
				console.log('Odds for today already exist');
				res.send({'type':'danger', 'message':'Odds for today already exist'});
			}
		})
		.catch(err => console.log('Error getting weeks ATS odds: '+err));
	}
});

router.post('/updatebta', requireLogin, (req,res) => {
	const today = new Date();
	if((today.getHours >= 12)) {
		res.send({'type':'danger', 'message':'Games started, no changes'});
	} else {
		Ats.updateOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport, date: new Date(req.body.date).setHours(0,0,0,0)}, JSON.parse(req.body.picks), {upsert: true})
		.then(() => res.send({'type':'success', 'message':'Picks updated'}))
		.catch(err => console.log("ATS change error: "+err));
	}
});

router.post('/getTracker', requireLogin, (req,res) => {
	let promises = [];
	const today = new Date().setHours(0,0,0,0);
	promises.push(Tracker.find({user: 'system', season: Number(req.body.season), sport: req.body.sport}).sort({team:1}));
	promises.push(Odds.find({sport: req.body.sport, date: today, bta: {$exists: false}}).sort({index:1}));
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
	promises.push(Odds.find({sport: req.body.sport, date: today, bta: {$exists: false}}).sort({index:1}));
	Promise.all(promises).then(results=>{
		res.send(results);
	});
});

router.post('/trackerTeam', requireLogin, (req, res)=>{
	let promises = [];
	promises.push(Odds.find({$or:[{team1: req.body.team},{team2: '@'+req.body.team}], sport: req.body.sport, season: req.body.season, ats: {$ne:0}, bta: {$exists: false}}).sort({date:1}));
	promises.push(Ats.find({sport: 'tracker'+req.body.sport, season: req.body.season, user: req.session.user._id},'-_id date 0 1 2 3 4 5 6 7 8 9 10 11 1	2 13 14 15').sort({date:1}));
	Promise.all(promises).then(results => {
		let userPicks = [];
		if (results[1].length){ // don't bother going through if no user picks
			let gameIndex, pickIndex;
			for(gameIndex = 0; gameIndex < results[0].length; gameIndex++) { // go through all odds then check if user has pick
				gameDate = new Date(results[0][gameIndex].date);
				for (pickIndex = 0; pickIndex < results[1].length; pickIndex++){ // go through all user picks
					userDate = new Date(results[1][pickIndex].date);
					if(userDate.getTime() == gameDate.getTime()){
						userPicks.push({date: gameDate, userPick: results[1][pickIndex][results[0][gameIndex].index]});
						break; //done looking through picks
					} else if (userDate > gameDate || pickIndex+1 == results[1].length) {
						userPicks.push({date: gameDate, userPick: 0}); // past game date, didn't make a pick
						break; //done looking through picks
					}
				}
			}
		}
		res.json({odds: results[0], picks: userPicks});
	});
});

router.post('/trackerPicks', requireLogin, (req,res) => {
	let today = new Date();
	if((today.getHours >= 23)) {
		res.send({'type':'danger', 'message':'Games started, no changes'});
	} else {
		Ats.updateOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport, date: new Date(req.body.date).setHours(0,0,0,0)}, JSON.parse(req.body.picks), {upsert: true}, (err, docs) => {
			if (err) {
				res.send({'type':'danger', 'message':'Picks not updated'});
				console.log("ATS change error: "+err);
			} else {
				res.send({'type':'success', 'message':'Picks updated'});
			}
		});
	}
});

router.post('/setprefs', requireLogin, (req, res)=>{
	if (req.body.password) {
		req.body.password = bcrypt.hashSync(req.body.password, 10);
	}
	Users.updateOne({_id:req.session.user},req.body, (err)=>{
		if(err){
			console.log(err);
		} else {
			console.log('Preferences changed for '+req.session.user._id+' - '+new Date());
			res.send({'type':'success', 'message':'Preferences changed'});
		}
	});
});

router.get('/getprefs',(req, res)=>{
	Users.findOne({_id: req.session.user}, {_id:1,  pref_nfl_everyone:1, pref_nba_everyone:1, pref_text_accept:1, slack: 1, pref_default_page: 1})
	.then(user => res.json(user))
	.catch(err => console.log(err));
});

function markPaid(betid, user) {
	Bets.findByIdAndUpdate({_id:betid}, {paid: true}).sort({date: -1})
	 .then( single => {
		// need to also mark debt flag in user db for notifications
		if(single.user1 != user){
			let tmp = single.user1;
			let tmp2 = single.team1;
			single.user1 = single.user2;
			single.team1 = single.team2;
			single.user2 = tmp;
			single.team2 = tmp2;
		}
		// below changes winner/loser debt flags: debts owed in first 4 bits, debts owed to next 4 bits
		Users.updateOne({_id: single.user1}, {$inc:{debts: -(1<<4)}})  //reduce winners flag
		.catch(err => console.log(err));
		Users.updateOne({_id: single.user2}, {$inc:{debts: -1}})  //increase loser flag
		.catch(err => console.log(err));
		logger.info('Bet#'+betid+' marked paid by '+user+' - '+new Date());
		return 1;
	})
	.catch(err => console.log(err));
}

// assumed only called by winner of bet
router.post('/debtpaid', requireLogin, (req, res)=>{
	if(markPaid(req.body.id, req.session.user._id)) {
		res.send({'type':'success', 'message':'Bet marked paid'});
	} else {
		res.send({'type':'danger', 'message':'Trouble marking bet paid, try again'});
	}
});

//retrieves both bets owed to someone else and someone else owing user
router.get('/getdebts', requireLogin, (req, res)=>{
	let sortedBets = [];
	Bets.find({$and:[{$or:[{user1: req.session.user},{user2: req.session.user}]},{status:{$in:[4,5]}}, {paid:false}]}).sort({date: -1})
	.then( bets => {
		bets.forEach(single => {
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
	})
	.catch(err => console.log(err));
});

router.post('/resolvefinish', requireLogin, (req, res)=>{

	function findAndMark(winner, loser){
		Bets.find({$and:[{paid: false}, {$or:[{$and:[{status: 4}, {user1: winner}, {user2: loser}]},{$and:[{status: 5}, {user1: loser}, {user2: winner}]}]}]}, (err, bets) => {
			bets.forEach(bet =>  {
				markPaid(bet._id, winner);
			});
		}).sort({date: 1}).limit(Number(req.body.num));
	}

	if (req.body.name.includes('/')) {
		findAndMark(req.session.user._id, req.body.name.split('/')[0]);
		findAndMark(req.body.name.split('/')[0], req.body.name.split('/')[1]);
		findAndMark(req.body.name.split('/')[1], req.session.user._id);
		logger.info(`${req.session.user._id} auto resolved 3-way offsetting bet between ${req.body.name.split('/')[0]} and ${req.body.name.split('/')[1]}`);
		Util.sendSlack(req.body.name.split('/')[0], 'Notice: '+req.session.user._id+' auto resolved '+req.body.num+' 3-way offsetting bets between you & '+req.body.name.split('/')[1]+' - no further action required');
		Util.sendSlack(req.body.name.split('/')[1], 'Notice: '+req.session.user._id+' auto resolved '+req.body.num+' 3-way offsetting bets between you & '+req.body.name.split('/')[0]+' - no further action required');
	} else {
		findAndMark(req.session.user._id, req.body.name);
		findAndMark(req.body.name, req.session.user._id);
		logger.info(`${req.session.user._id} auto resolved bet with ${req.body.name}`);
		Util.sendSlack(req.body.name, 'Notice: '+req.session.user._id+' marked paid '+req.body.num+' pair offsetting bets between you - no further action required');
	}
	res.send({'type':'success', 'message':'Offset debts recorded'});
});

function getDebtList (person){
	return new Promise ((resolve, reject) => {
		let debtList = {owes: {}, isowed: {}};

		Bets.find({$and:[{paid: false}, {status: {$in:[4,5]}}, {$or:[{user1: person}, {user2: person}]}]})
		.then (bets => {
			bets.forEach(bet => {
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

router.get('/resolvedebts', requireLogin, (req, res)=>{
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
						.then(debtList2 => {
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

		Promise.all(promises).then(() => {
			res.send(results);   
		});
	});
});

router.post('/getfutureoffers', requireLogin, async (req, res)=>{
	try {
		const offers = await Bets.find({$and:[{status: req.body.status}, {$or: [{type: 'give'}, {type: 'take'}]}]});
		res.json({
			sessionId: req.session.user._id,
			offers: offers
		});		
	} catch (err) {
		console.log(err);
	}
});

router.get('/getfutures', (req, res) => {
	if (fs.existsSync('json/futures.json'))
		res.sendFile('./json/futures.json', {'root':__dirname+'/..'});
});

router.get('/getlogs', (req, res) => {
	// if (fs.existsSync('json/log.json')) {
	//    res.sendFile('./json/log2.json', {'root':__dirname+'/..'});
	// }
	Users.findOne({_id: req.session.user}, (err,user) => {
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
	Users.updateOne({_id:req.session.user}, {push: JSON.stringify(req.body)}, (err)=>{
		if(err){
			console.log(err);
		} else {
			console.log('saved to db');
		}
	});
	const subscription = req.body;
	res.status(201).json({});
});

router.post('/getodds', (req, res) => {
	res.sendFile('./json/'+req.body.sport+'_odds.json', {'root':__dirname+'/..'});
}); 

// gets userlist for bet select list
router.get('/users', requireLogin, async (req, res)=>{
	Users.find({_id: {$ne:req.session.user}}, {_id: 1, pref_default_page: 1}).sort({_id:1})
	.then (user => res.json(user))
	.catch (err => console.log(err));
});

// called when new page is loaded
router.get('/doorbell', requireLogin, (req, res)=>{
	let promises = [];
	let answer = {
		type: 'message',
		username: req.session.user._id,
		sports: []
	};

	promises.push(Sports.find({inseason: true}, {sport:1, start: 1}));
	promises.push(Users.findOne({_id: req.session.user}));
	promises.push(Bets.findOne({$and:[{status: 0},{$or: [{type: 'give'}, {type: 'take'}]}]}));
	promises.push(Bets.findOne({$and:[{type: 'prop'}, {$or:[{user2: 'OPEN'}, {user2:req.session.user}]}, {date:{$gt:new Date().setHours(0,0)-(1000*60*60*24*7)}}]}));
	Promise.all(promises).then(results =>{
		results[0].forEach(sport => {
			answer.sports.push(sport);
		});
		answer.bets = results[1].bets;
		answer.debts = results[1].debts;
		answer.futures = results[2]?true:false;
		answer.props = results[3]?true:false;
		// console.log(answer);
		res.send(answer);
	});
});

async function changeUser(user, key, inc) {
	let tmp = {};
	tmp[key] = inc;
	Users.updateOne({_id: user}, {$inc: tmp})
	.catch (err => console.log('Trouble with changing user '+key));
}
