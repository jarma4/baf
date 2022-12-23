const {OUgame, OUuser} = require('../models/dbschema');


module.exports = {
	getStandings: req => {
		OUgame.find({season: Number(req.body.season), sport: req.body.sport}, function(err, standings){
			if (err) {
				console.log(err);
			} else {
				OUuser.find({season: Number(req.body.season), sport: req.body.sport}, function(err, users){
					if (err)
						console.log(err);
					else
						return {standings, users};
				}).sort({user:1});
			}
		}).sort({team:1});
	},	
	getousignup: req =>{
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
									return {users: users, choices: teams};
								}
							}
						}).sort({index:1}).lean(); // lean needed to modify mongoose object above
					} else {
						return {users: users};
					}
				});
			}
		}).sort({user:1});
	},
	getTourney: req => {
		// NEED PROMISE
		const nbaFirstRound = ['MIA', 'ATL', 'PHI', 'TOR', 'BOS', 'BKN', 'MIL', 'CHI', 'PHO', 'LAC', 'DAL', 'UTA', 'MEM', 'MIN', 'GS', 'DEN'];
		OUuser.findOne({user: req.session.user._id, season: Number(req.body.season), sport: req.body.sport}, function(err, result){
			if (err)
				console.log(err);
			if (result) {
				return {'type':'danger', 'message':'Already joined'};
			} else {
				const newRecord = {
					user: req.session.user._id,
					season: Number(req.body.season),
					sport: req.body.sport
				};
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
						console.log('moreturning ',newRecord);
						return newRecord;
					}
				});
			}
		});
	},
	setouchoices: req=>{
		OUuser.updateOne({user: req.session.user._id, season: req.body.season, sport: req.body.sport}, JSON.parse(req.body.choices), function(err){
			if (err)
				console.log("OU choice change error: "+err);
			else {
				return {'type':'success', 'message':'Choices updated'};
			}
		});
	}
};