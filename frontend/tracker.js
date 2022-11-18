var dailyOdds;

function getTracker() {
   postOptions.body = JSON.stringify({
		'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1], 
		'season': $('#trackerYear').val()
   });
   fetch('/api/getTracker', postOptions)
   .then(res => res.json())
   .then(retData => {
		// save daily odds for picks later
		dailyOdds = retData[1];
      let outp = '<table class="table table-condensed"><tr><th onclick="sortTable(tracker, 0)">Team</th><th>G</th><th onclick="sortTable(tracker, 2)">All</th><th onclick="sortTable(tracker, 3)">Home</th><th onclick="sortTable(tracker, 4)">Away</th><th onclick="sortTable(tracker, 5)">B2B</th><th onclick="sortTable(tracker, 6)">L10</th></tr>';
		let system1,system2,system3,user1,user2,user3;
      $.each(retData[0], (index, rec) => {
			system1=(rec.home_games+rec.away_games)?((rec.home_won+rec.away_won)/(rec.home_games+rec.away_games)).toPrecision(3):0;
			system2=(rec.home_games)?(rec.home_won/rec.home_games).toPrecision(3):0;
			system3=(rec.away_games)?(rec.away_won/rec.away_games).toPrecision(3):0;
			outp += '<tr><td><a href="#" data-toggle="modal" data-target="#teamModal" data-team="'+rec.team+'">'+rec.team+'</a></td><td>'+(rec.home_games+rec.away_games)+'</td><td>'+system1+'</td><td>'+system2+'</td><td>'+system3+'</td><td>'+((rec.b2b_games != 0)?(rec.b2b_won/rec.b2b_games).toPrecision(3):0)+' ('+rec.b2b_games+')</td><td>'+rec.last10+'</td></tr>';
			if (retData[2].length){
				user1=(retData[2][index].home_games+retData[2][index].away_games)?((retData[2][index].home_won+retData[2][index].away_won)/(retData[2][index].home_games+retData[2][index].away_games)).toPrecision(3):0;
				user2=(retData[2][index].home_games)?(retData[2][index].home_won/retData[2][index].home_games).toPrecision(3):0;
				user3=(retData[2][index].away_games)?(retData[2][index].away_won/retData[2][index].away_games).toPrecision(3):0;
				outp += '<tr class="userPicks hidden"><td class="center notoppadding help-heading">you</td><td class="notoppadding">'+(retData[2][index].home_games+retData[2][index].away_games)+'</td><td class="notoppadding '+((user1>system1)?'heading-succes':(user1<system1)?'heading-dange':'')+'">'+user1+'</td><td class="notoppadding '+((user1>system1)?'heading-succes':(user1<system1)?'heading-dange':'')+'">'+user2+'</td><td class="notoppadding '+((user1>system1)?'heading-succes':(user1<system1)?'heading-dange':'')+'">'+user3+'</td><td class="notoppadding">'+((retData[2][index].b2b_games != 0)?(retData[2][index].b2b_won/retData[2][index].b2b_games).toPrecision(3)+'('+retData[2][index].b2b_games+')':0)+'</td></tr>';
			}
      });
      outp += '</table>';
      document.getElementById('tracker').innerHTML = outp;
	});
}

function getTrackerPicks(sport, period) {
	const today = new Date();
	$('#picksDate').text(`${dayName[period.getDay()]} ${monthName[period.getMonth()]} ${period.getDate()}`);
	$('#picksDate').data('date',period);
	document.getElementById('dailyPicks').innerHTML = '';
	// document.getElementById("dailyPicksBtn").classList.remove('hidden');
	postOptions.body = JSON.stringify({
		'sport': sport, 
		'season': $('#trackerYear').val(),
		'period': period
   });
   fetch('/api/getTrackerPicks', postOptions)
   .then(res => res.json())
   .then(results => {
		if(results[0] != null && Object.keys(results[0]).length != 0) {
			let outp = '<ul>';
			for (const key in results[0]) {
				outp += '<li>'+((results[0][key] == 1)?`${results[1][key].team1} ${results[1][key].spread} over ${results[1][key].team2}`:`${results[1][key].team2} ${-1*results[1][key].spread} over ${results[1][key].team1}`)+'</li>';
			}
			outp += '</ol>';
			document.getElementById('dailyPicks').innerHTML = outp;
			document.getElementById("dailyPicksBtn").classList.add('hidden');
			// document.getElementsByClassName("help-heading").classList.remove('hidden');
		} else if (period.getDate() == today.getDate() && period.getMonth() == today.getMonth()){
			document.getElementById("dailyPicksBtn").classList.remove('hidden');
		}
	});

}

$('#teamModal').on('show.bs.modal', event => {
	const button = $(event.relatedTarget);
	const team = button.data('team');
	postOptions.body = JSON.stringify({
      team: team,
      sport:  $('.sportPick.selected').attr('class').split(/\s+/)[1],
      season: $('#trackerYear').val()
   });
   fetch('/api/trackerTeam', postOptions)
	.then(res => res.json())
   .then(retData => {
		const showUser = retData.picks.length > 0;
   	let outp = '<table class="table"><tr><th>Date</th><th>Opp</th><th>Spread</th><th>W/L</th>'+((showUser)?'<th class="help-heading">You</th>':'')+'<th>H/A</th><th>B2B</th></tr>';
   	retData.odds.forEach((rec, index) => {
         const date=new Date(rec.date);
			const side = (rec.team1 == team)?'away':'home';
   		outp += '<tr><td>'+(date.getMonth()+1)+'/'+date.getDate()+'</a></td>'+'<td>'+((side == 'away')?rec.team2.slice(1):rec.team1)+'</td><td>'+rec.spread+'</td><td>'+(((side == 'away' && (rec.ats == 1 || rec.ats == 11)) || (side == 'home' && (rec.ats == 2 || rec.ats == 12)))?'W':'L')+'</td>';
			outp += (showUser)?'<td>'+((side == 'away' && (rec.ats == 1 || rec.ats == 11) && retData.picks[index].userPick == 1) || (side == 'home' && (rec.ats == 2 || rec.ats == 12) && retData.picks[index].userPick == 2)?'W':(retData.picks[index].userPick == 0)?'':'L')+'</td>':'';
			outp += '<td>'+((side == 'home')?'H':'A')+'</td><td>'+(((side == 'away' && rec.b2b1)||(side == 'home' && rec.b2b2))?'Y':'N')+'</td></tr>';
   	});
   	outp += '</table>';
   	document.getElementById("trackerHistory").innerHTML = outp;
   	document.getElementById("teamTitle").innerHTML = `ATS History for ${team}`;
   })
   .catch(retData => modalAlert(retData.type, retData.message));
});

$('#picksModal').on('show.bs.modal', event => {
	let outp = '<table class="table table-condensed">';
	let sport = 'nba';
	window.dailyOdds.forEach((rec, i) => {
		outp += '<tr><td class="td-odds"><button class="btn btn-toggle btn-default" data-game="'+i+'" data-team="1"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
		outp += '<td class="td-odds"><button class="btn btn-toggle btn-default" data-game="'+i+'" data-team="2"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></td></tr>';
	});
	outp += '</table>';
	document.getElementById("trackerPicksArea").innerHTML = outp;
	window.dailyOdds.forEach((rec, i) => {
		$('#tm1_'+i).css('object-position', spritePosition(sport, rec.team1));
		$('#tm2_'+i).css('object-position', spritePosition(sport, rec.team2.substr(1)));
	});
});

$('#trackerPicksArea').delegate('.btn-toggle', 'click' , event => {
	event.preventDefault();
	const picked = $(event.currentTarget);
	const buttons=$('button[data-game="'+picked.data('game')+'"]');
	if (buttons[0].classList.contains('btn-default') && buttons[1].classList.contains('btn-default')){
		picked.removeClass('btn-default');
		picked.addClass('btn-success');
	} else if(picked.data('team') == 1){
		buttons[0].classList.remove('btn-default');
		buttons[0].classList.add('btn-success');
		buttons[1].classList.add('btn-default');
		buttons[1].classList.remove('btn-success');
	} else {
		buttons[1].classList.remove('btn-default');
		buttons[1].classList.add('btn-success');
		buttons[0].classList.add('btn-default');
		buttons[0].classList.remove('btn-success');
	}
});

$('#trackerSubmitBtn').on('click', event => {
	let picks = {};
	$('#picksModal').modal('hide');
	$.each($('#trackerPicksArea .btn-success'), (idx, game) => {
		picks[game.getAttribute('data-game')] = game.getAttribute('data-team');
   });
   postOptions.body = JSON.stringify({
		'picks': JSON.stringify(picks),
		'season': $('#trackerYear').val(),
		'sport': 'trackernba',
      'date': new Date().setHours(0,0,0,0)
   });
   fetch('/api/trackerPicks', postOptions)
   .then(res => res.json())
   .then(retData => {
		modalAlert(retData.type,retData.message);
		getTrackerPicks('nba', new Date());
	})
   .catch(retData => modalAlert(retData.type,retData.message));
});

// back/forward button to get different scores
$('.picksInc').on('click', function(event){
	event.preventDefault();
	document.getElementById("dailyPicksBtn").classList.add('hidden');
   // let parsed = $('#picksDate').text().split(' ');
	const currentDate = new Date($('#picksDate').text()+' '+$('#trackerYear').val());
	if ((currentDate > seasonStart[$('.sportPick.selected').attr('class').split(/\s+/)[1]] && $(this).val()=='-1') || (currentDate.getTime() != new Date(new Date().setHours(0,0,0,0)).getTime() && $(this).val()=='1')){
		getTrackerPicks($('.sportPick.selected').attr('class').split(/\s+/)[1], new Date(Number($('#picksDate').data('date'))+$(this).val()*(24*60*60*1000)));
	}
});

$('#picksToggle').on('change', function(event) {
	if(this.checked){
		Array.from(document.getElementsByClassName('userPicks'), row => {
			row.classList.remove('hidden');
		});
	} else {
		Array.from(document.getElementsByClassName('userPicks'), row => {
			row.classList.add('hidden');
		});
	}
});

