const  { Users, Tracker } = require('./dbschema');
const { App } = require('@slack/bolt');

process.loadEnvFile();

const slack = new App({
	signingSecret: process.env.SLACK_SECRET,
	token: process.env.SLACK_TOKEN
});
const seasonStart = {
	nfl: new Date(2024,8,5),
	nba: new Date(2024,9,22),
	ncaab: new Date(2023,2,16)
};
module.exports = {
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
	seasonStart,
	previousDay: date => {
		const temp=new Date(date);
		return new Date(temp.setDate(temp.getDate()-1));
	},
	dailyB2b: {},
	monthName : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	nflTeams: {
		'Arizona': 'ARI', 'Atlanta': 'ATL', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Cincinnati': 'CIN', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Green Bay': 'GB', 'Houston': 'HOU', 'Indianapolis': 'IND', 'Jacksonville': 'JAC', 'Kansas City': 'KC', 'L.A. Chargers': 'LAC', 'L.A. Rams': 'LAR', 'Miami': 'MIA', 'Minnesota': 'MIN', 'N.Y. Giants': 'NYG', 'N.Y. Jets': 'NYJ', 'New England': 'NE', 'New Orleans': 'NO', 'Las Vegas': 'LV', 'Philadelphia': 'PHI', 'Pittsburgh': 'PIT', 'San Francisco': 'SF', 'Seattle': 'SEA', 'Tampa Bay': 'TB', 'Tennessee': 'TEN', 'Washington': 'WAS'},
	nflTeams2: {
		'Cardinals': 'ARI', 'Falcons': 'ATL', 'Ravens': 'BAL', 'Bills': 'BUF', 'Panthers': 'CAR', 'Bears': 'CHI', 'Bengals': 'CIN', 'Browns': 'CLE', 'Cowboys': 'DAL', 'Broncos': 'DEN', 'Lions': 'DET', 'Packers': 'GB', 'Texans': 'HOU', 'Colts': 'IND', 'Jaguars': 'JAX', 'Chiefs': 'KC', 'Chargers': 'LAC', 'Rams': 'LAR', 'Dolphins': 'MIA', 'Vikings': 'MIN', 'Giants': 'NYG', 'Jets': 'NYJ', 'Patriots': 'NE', 'Saints': 'NO', 'Raiders': 'LV', 'Eagles': 'PHI', 'Steelers': 'PIT', '49ers': 'SF', 'Seahawks': 'SEA', 'Buccaneers': 'TB', 'Titans': 'TEN', 'Commanders': 'WAS'},
	nflTeams3: {
		'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL', 'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI', 'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL', 'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB', 'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAC', 'Kansas City Chiefs': 'KC', 'Los Angeles Chargers': 'LAC', 'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA', 'Minnesota Vikings': 'MIN', 'New York Giants': 'NYG', 'New York Jets': 'NYJ', 'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'Las Vegas Raiders': 'LV', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT', 'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB', 'Tennessee Titans': 'TEN', 'Washington Commanders': 'WAS'},
	nbaTeams: {
		'Atlanta': 'ATL', 'Boston': 'BOS', 'Brooklyn': 'BKN', 'Charlotte': 'CHR', 'Chicago': 'CHI', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Golden State': 'GS','Golden St.': 'GS', 'Houston': 'HOU', 'Indiana': 'IND', 'L.A. Clippers': 'LAC','LA Lakers': 'LAL','LA Clippers': 'LAC','L.A. Lakers': 'LAL', 'Memphis': 'MEM', 'Miami': 'MIA', 'Milwaukee': 'MIL', 'Minnesota': 'MIN', 'New Orleans': 'NOP', 'New York': 'NY', 'Oklahoma City': 'OKC', 'Orlando': 'ORL', 'Philadelphia': 'PHI', 'Phoenix': 'PHO', 'Portland': 'POR', 'Sacramento': 'SAC', 'San Antonio': 'SAN', 'Toronto': 'TOR', 'Utah': 'UTA', 'Washington': 'WAS', },
	nbaTeams2: {
		'Hawks': 'ATL', 'Bulls': 'CHI', 'Mavericks': 'DAL', 'Pistons': 'DET',  'Timberwolves': 'MIN', 'Pelicans': 'NO', 'Knicks': 'NY', 'Nets': 'BKN', '76ers': 'PHI', 'Thunder': 'OKC', 'Clippers': 'LAC','Lakers': 'LAL', 'Wizards': 'WAS', 'Cavaliers': 'CLE', 'Nuggets': 'DEN', 'Rockets': 'HOU', 'Pacers': 'IND', 'Heat': 'MIA', 'Celtics': 'BOS', 'Warriors': 'GS', 'Golden State': 'GS', 'Spurs': 'SA', 'Kings': 'SAC', 'Trail Blazers': 'POR', 'Magic': 'ORL', 'Hornets': 'CHA', 'Suns': 'PHO', 'Raptors': 'TOR', 'Bucks': 'MIL', 'Jazz': 'UTA', 'Grizzlies': 'MEM'
	}, 
	nbaTeams3: {
		'Atlanta Hawks': 'ATL', 'Chicago Bulls': 'CHI', 'Dallas Mavericks': 'DAL', 'Detroit Pistons': 'DET',  'Minnesota Timberwolves': 'MIN', 'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NY', 'Brooklyn Nets': 'BKN', 'Philadelphia 76ers': 'PHI', 'Oklahoma City Thunder': 'OKC', 'La Clippers': 'LAC','Los Angeles Lakers': 'LAL', 'Washington Wizards': 'WAS', 'Cleveland Cavaliers': 'CLE', 'Denver Nuggets': 'DEN', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND', 'Miami Heat': 'MIA', 'Boston Celtics': 'BOS', 'Golden State Warriors': 'GS', 'San Antonio Spurs': 'SAN', 'Sacramento Kings': 'SAC', 'Portland Trail Blazers': 'POR', 'Orlando Magic': 'ORL', 'Charlotte Hornets': 'CHR', 'Phoenix Suns': 'PHO', 'Toronto Raptors': 'TOR', 'Milwaukee Bucks': 'MIL', 'Utah Jazz': 'UTA', 'Memphis Grizzlies': 'MEM'
	}
};
