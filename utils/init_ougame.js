const	OUgame = require('../models/dbschema').OUgame,
	mongoose = require('mongoose'),
	Util = require('../models/util');

require('dotenv').config();
mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf', {useNewUrlParser: true, useUnifiedTopology: true});

let i = 0;
let args = process.argv.splice(2);
console.log(args);
if (args[0] != 'nba' && args[0] != 'nfl') {
	console.log('Usage: init_ougame [nfl, nba] YEAR');
	process.exit();
}
for (let team in (args[0] == 'nfl')?Util.nflTeams:Util.nbaTeams) {
	let tmp = new OUgame ({
		sport: args[0],
		season: args[1],
		team: team,
		index: i++,
		win: 0,
		loss: 0,
		line: 0,
		projection: 0,
		status: 'U'
	}).save(err => {
		if(err) {
			console.log('Trouble adding OUgame team', err);
		} else {
			console.log('OUgame added '+team);
		}
	});
}
