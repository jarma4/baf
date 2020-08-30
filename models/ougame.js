const	OUgame = require('./dbschema').OUgame;

module.exports = {
	initOUgame: function(season, sport) {
		let i = 0;
		for (let team in (sport == 'nfl')?nflTeams:nbaTeams) {
			let tmp = new OUgame ({
				sport: sport,
				season: season,
				team: team,
				index: i++,
				win: 0,
				loss: 0,
				line: 0,
				projection: 0,
				status: 'U'
			}).save(function(err){
				if(err) {
					console.log('Trouble adding OUgame team');
				} else {
					console.log('OUgame added '+team);
				}
			});
		}
	}
};