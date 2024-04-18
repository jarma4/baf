const  { Users, Tracker } = require('./dbschema');
const { App } = require('@slack/bolt');
	
require('dotenv').config();
const slack = new App({
	signingSecret: process.env.SLACK_SECRET,
	token: process.env.SLACK_TOKEN
});

module.exports = {
	sendSlack: async (message) => {
		// console.log(`Slack message test: ${message}`);
		// return;
		await slack.client.chat.postMessage({
			token: process.env.SLACK_TOKEN,
			channel: '2db',
			text: message
		});
	},
	textUser: (to, message, pref2) => {
		// console.log(`in text ${message}`);
		// return;
      Users.findOne({_id: to}, (err,user) => {
         if (err) {
            console.log(err);
         } else if (user){
            if((user.pref_text_receive && !pref2) || (user.pref_text_accept && pref2)){
               // increment list for user to be checked later
               if (textList[to]) {
                  textList[to]++;
               } else {
                  textList[to] = 1;
               }
					// only text user once every 90 seconds
               setTimeout(() => {
                  if (textList[to]) {
                     // console.log('text sending to '+user.sms);
                     telnyx.messages.create({
                        'from': process.env.TEXTFROM,
                        'to': '+1'+user.sms,
                        'text': message + ' - 2DB'
                     }).then(response => {
                        console.log('texted',message); // asynchronously handled
                     }).catch(err=>{
								console.log('Error texting: ', err);
							});
                     textList[to] = 0;
                  }
               }, 90000);
            }
         }
      });
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
	seasonStart: {
      nfl: new Date(2023,8,7),
      nba: new Date(2023,9,24),
      ncaab: new Date(2023,2,16)
	},
	previousDay: date => {
		const temp=new Date(date);
		return new Date(temp.setDate(temp.getDate()-1));
	},
	dailyB2b: {},
	monthName : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	nflTeams: {
		'Arizona': 'ARI', 'Atlanta': 'ATL', 'Baltimore': 'BAL', 'Buffalo': 'BUF', 'Carolina': 'CAR', 'Chicago': 'CHI', 'Cincinnati': 'CIN', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Green Bay': 'GB', 'Houston': 'HOU', 'Indianapolis': 'IND', 'Jacksonville': 'JAC', 'Kansas City': 'KC', 'LA Chargers': 'LAC', 'LA Rams': 'LAR', 'Miami': 'MIA', 'Minnesota': 'MIN', 'NY Giants': 'NYG', 'NY Jets': 'NYJ', 'New England': 'NE', 'New Orleans': 'NO', 'Las Vegas': 'LV', 'Philadelphia': 'PHI', 'Pittsburgh': 'PIT', 'San Francisco': 'SF', 'Seattle': 'SEA', 'Tampa Bay': 'TB', 'Tennessee': 'TEN', 'Washington': 'WAS'},
	nflTeams2: {
		'Cardinals': 'ARI', 'Falcons': 'ATL', 'Ravens': 'BAL', 'Bills': 'BUF', 'Panthers': 'CAR', 'Bears': 'CHI', 'Bengals': 'CIN', 'Browns': 'CLE', 'Cowboys': 'DAL', 'Broncos': 'DEN', 'Lions': 'DET', 'Packers': 'GB', 'Texans': 'HOU', 'Colts': 'IND', 'Jaguars': 'JAC', 'Chiefs': 'KC', 'Chargers': 'LAC', 'Rams': 'LAR', 'Dolphins': 'MIA', 'Vikings': 'MIN', 'Giants': 'NYG', 'Jets': 'NYJ', 'Patriots': 'NE', 'Saints': 'NO', 'Raiders': 'LV', 'Eagles': 'PHI', 'Steelers': 'PIT', '49ers': 'SF', 'Seahawks': 'SEA', 'Buccaneers': 'TB', 'Titans': 'TEN', 'Commanders': 'WAS'},
	nbaTeams: {
		'Atlanta': 'ATL', 'Boston': 'BOS', 'Brooklyn': 'BKN', 'Charlotte': 'CHR', 'Chicago': 'CHI', 'Cleveland': 'CLE', 'Dallas': 'DAL', 'Denver': 'DEN', 'Detroit': 'DET', 'Golden State': 'GS','Golden St.': 'GS', 'Houston': 'HOU', 'Indiana': 'IND', 'L.A. Clippers': 'LAC','LA Lakers': 'LAL','LA Clippers': 'LAC','L.A. Lakers': 'LAL', 'Memphis': 'MEM', 'Miami': 'MIA', 'Milwaukee': 'MIL', 'Minnesota': 'MIN', 'New Orleans': 'NOP', 'New York': 'NY', 'Oklahoma City': 'OKC', 'Orlando': 'ORL', 'Philadelphia': 'PHI', 'Phoenix': 'PHO', 'Portland': 'POR', 'Sacramento': 'SAC', 'San Antonio': 'SAN', 'Toronto': 'TOR', 'Utah': 'UTA', 'Washington': 'WAS', },
	nbaTeams2: {
		'Hawks': 'ATL', 'Bulls': 'CHI', 'Mavericks': 'DAL', 'Pistons': 'DET',  'Timberwolves': 'MIN', 'Pelicans': 'NOP', 'Knicks': 'NY', 'Nets': 'BKN', '76ers': 'PHI', 'Thunder': 'OKC', 'Clippers': 'LAC','Lakers': 'LAL', 'Wizards': 'WAS', 'Cavaliers': 'CLE', 'Nuggets': 'DEN', 'Rockets': 'HOU', 'Pacers': 'IND', 'Heat': 'MIA', 'Celtics': 'BOS', 'Warriors': 'GS', 'Golden State': 'GS', 'Spurs': 'SAN', 'Kings': 'SAC', 'Trail Blazers': 'POR', 'Magic': 'ORL', 'Hornets': 'CHR', 'Suns': 'PHO', 'Raptors': 'TOR', 'Bucks': 'MIL', 'Jazz': 'UTA', 'Grizzlies': 'MEM'
	}
};
