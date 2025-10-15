const  { Users, Sports, Tracker } = require('./dbschema');
const { App } = require('@slack/bolt');

process.loadEnvFile();

let seasonStart = {};
const slack = new App({
	signingSecret: process.env.SLACK_SECRET,
	token: process.env.SLACK_TOKEN
});

module.exports = {
	init_seasonStart: () => {
		Sports.find({inseason: true})
		.then(sports => {
			sports.forEach(sport => {
				seasonStart[sport.sport] = sport.start;
			})
		})
		.catch (err => console.log(`Error getting seasonStarts: ${err}`));
	},
	seasonStart,
	sendSlack: (recipient, message) => {
		// console.log(recipient, message);
		// return;
		let sendTo, slackCount = [];
		if (recipient == 'EVERYONE') {
			sendTo = '2db';
		} else {
			Users.findOne({_id: recipient})
			.then(user => {
				sendTo = '@'+user.slack;
			})
			.catch(err => console.log(err));
		};
		// keep counter per user to be checked later
		if (slackCount[sendTo]){
			slackCount[sendTo]++;
		} else {
			slackCount[sendTo] = 1;
		}
		// only slack user once every 90 seconds
		setTimeout(async ()=>{
			if (slackCount[sendTo]){
				await slack.client.chat.postMessage({
					token: process.env.SLACK_TOKEN,
					channel: sendTo,
					text: message  // a rich message w/ markdown can be sent
				})
				.catch(err => console.log(err));
				slackCount[sendTo] = 0; //reset so slacks in setTimeout queue will not happen
			}
		}, 90000);
	},
	init_tracker: (user, sport, season) => {
		let index = 0;
		for (let team in (sport == 'nfl')?module.exports.nflTeams:module.exports.nbaTeams) {
			let tmp = new Tracker ({
				sport: sport,
				season: season,
				user: user,
				team: (sport == 'nfl')?module.exports.nflTeams[team]:module.exports.nbaTeams[team],
				home_games: 0,
				away_games: 0,
				b2b_games: 0,
				home_won: 0,
				away_won: 0,
				b2b_won: 0
			}).save(err => {
				if(err) {
					console.log('Trouble adding Tracker team', err);
				} else {
					console.log('Tracker added '+team);
				}
			});
		}		
	},
   getWeek: (date, sport) => {
      var dayTicks = 24 * 60 * 60 * 1000;
      return Math.ceil((date - (module.exports.seasonStart[sport])) / dayTicks / 7);
   },
	checkSameDate: (date1, date2) =>{
		return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate();
	},
	previousDay: date => {
		const temp=new Date(date);
		return new Date(temp.setDate(temp.getDate()-1));
	},
	dailyB2b: {},
	monthName : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
	dayName : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	nflTeams: {
		'Cardinals': 'ARI', 'Falcons': 'ATL', 'Ravens': 'BAL', 'Bills': 'BUF', 'Panthers': 'CAR', 'Bears': 'CHI', 'Bengals': 'CIN', 'Browns': 'CLE', 'Cowboys': 'DAL', 'Broncos': 'DEN', 'Lions': 'DET', 'Packers': 'GB', 'Texans': 'HOU', 'Colts': 'IND', 'Jaguars': 'JAC', 'Chiefs': 'KC', 'Chargers': 'LAC', 'Rams': 'LA', 'Dolphins': 'MIA', 'Vikings': 'MIN', 'Giants': 'NYG', 'Jets': 'NYJ', 'Patriots': 'NE', 'Saints': 'NO', 'Raiders': 'LV', 'Eagles': 'PHI', 'Steelers': 'PIT', '49ers': 'SF', 'Seahawks': 'SEA', 'Buccaneers': 'TB', 'Titans': 'TEN', 'Commanders': 'WAS'},
	nflTeams2: {
		'Arizona': 'ARI', 'Atlanta': 'ATL', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Cincinnati': 'CIN', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Green Bay': 'GB', 'Houston': 'HOU', 'Indianapolis': 'IND', 'Jacksonville': 'JAC', 'Kansas City': 'KC', 'L.A. Chargers': 'LAC', 'L.A. Rams': 'LA', 'Miami': 'MIA', 'Minnesota': 'MIN', 'N.Y. Giants': 'NYG', 'N.Y. Jets': 'NYJ', 'New England': 'NE', 'New Orleans': 'NO', 'Las Vegas': 'LV', 'Philadelphia': 'PHI', 'Pittsburgh': 'PIT', 'San Francisco': 'SF', 'Seattle': 'SEA', 'Tampa Bay': 'TB', 'Tennessee': 'TEN', 'Washington': 'WAS'},
	nbaTeams: {
		'Hawks': 'ATL', 'Bulls': 'CHI', 'Mavericks': 'DAL', 'Pistons': 'DET',  'Timberwolves': 'MIN', 'Pelicans': 'NOP', 'Knicks': 'NYK', 'Nets': 'BKN', '76ers': 'PHI', 'Thunder': 'OKC', 'Clippers': 'LAC','Lakers': 'LAL', 'Wizards': 'WAS', 'Cavaliers': 'CLE', 'Nuggets': 'DEN', 'Rockets': 'HOU', 'Pacers': 'IND', 'Heat': 'MIA', 'Celtics': 'BOS', 'Warriors': 'GSW', 'Golden State': 'GS', 'Spurs': 'SAS', 'Kings': 'SAC', 'Trail Blazers': 'POR', 'Magic': 'ORL', 'Hornets': 'CHA', 'Suns': 'PHX', 'Raptors': 'TOR', 'Bucks': 'MIL', 'Jazz': 'UTA', 'Grizzlies': 'MEM'
	}
};
