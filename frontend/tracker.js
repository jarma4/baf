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
		// daily picks not made so far, show button
		if (retData[2] == null) {
			document.getElementById('dailyPicksBtn').classList.remove('hidden');
		} else {
			showPicks(retData[2]);
		}
		// show over Tracker stats
      let outp = '<table class="table table-condensed"><tr><th>Team</th><th>G</th><th>All</th><th>Home</th><th>Away</th><th>B2B</th></tr>';
		let system1,system2,system3,user1,user2,user3;
      $.each(retData[0], (index, rec) => {
			system1=(rec.home_games+rec.away_games)?((rec.home_won+rec.away_won)/(rec.home_games+rec.away_games)).toPrecision(3):0;
			system2=(rec.home_games)?(rec.home_won/rec.home_games).toPrecision(3):0;
			system3=(rec.away_games)?(rec.away_won/rec.away_games).toPrecision(3):0;
			outp += '<tr><td><a href="#" data-toggle="modal" data-target="#teamModal" data-team="'+rec.team+'">'+rec.team+'</a></td><td>'+(rec.home_games+rec.away_games)+'</td><td>'+system1+'</td><td>'+system2+'</td><td>'+system3+'</td><td>'+((rec.b2b_games != 0)?(rec.wonB2b/rec.games).toPrecision(3):0)+'</td></tr>';
			user1=(retData[3][index].home_games+retData[3][index].away_games)?((retData[3][index].home_won+retData[3][index].away_won)/(retData[3][index].home_games+retData[3][index].away_games)).toPrecision(3):0;
			user2=(retData[3][index].home_games)?(retData[3][index].home_won/retData[3][index].home_games).toPrecision(3):0;
			user3=(retData[3][index].away_games)?(retData[3][index].away_won/retData[3][index].away_games).toPrecision(3):0;
			outp += '<tr><td class="center notoppadding help-heading">you</td><td class="notoppadding">'+(retData[3][index].home_games+retData[3][index].away_games)+'</td><td class="notoppadding '+((user1>system1)?'heading-success':(user1<system1)?'heading-danger':'')+'">'+user1+'</td><td class="notoppadding '+((user1>system1)?'heading-success':(user1<system1)?'heading-danger':'')+'">'+user2+'</td><td class="notoppadding '+((user1>system1)?'heading-success':(user1<system1)?'heading-danger':'')+'">'+user3+'</td><td class="notoppadding">'+((retData[3][index].b2b_games != 0)?(retData[3][index].wonB2b/retData[3][index].games).toPrecision(3):0)+'</td></tr>';
      });
      outp += '</table>';
      document.getElementById('tracker').innerHTML = outp;
	});
}

$('#trackerToggle').on('click' , event => {
	if ($('#trackerToggle').text() == 'vs Your Picks'){
		$('#trackerToggle').text('Overall');
	} else {
		$('#trackerToggle').text('vs Your Picks');
	}
});

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
   	let outp = '<table class="table"><tr><th>Date</th><th>Opp</th><th>Spread</th><th>W/L</th><th>H/A</th><th>B2B</th></tr>';
   	$.each(retData, function(i,rec){
         const date=new Date(rec.date);
			const side = (rec.team1 == team)?'away':'home';
   		outp += '<tr><td>'+(date.getMonth()+1)+'/'+date.getDate()+'</a></td>';
         outp += '<td>'+((side == 'away')?rec.team2.slice(1):rec.team1)+'</td><td>'+rec.spread+'</td>';
			outp += '<td>'+(((side == 'away' && (rec.ats == 1 || rec.ats == 11)) || (side == 'home' && (rec.ats == 2 || rec.ats == 12)))?'W':'L')+'</td><td>'+((side == 'home')?'H':'A')+'</td><td>N</td></tr>';
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

function showPicks(picks) {
	let outp = '<ul>';
	for (const key in picks) {
		outp += '<li>'+((picks[key] == 1)?`${dailyOdds[key].team1} ${dailyOdds[key].spread} over ${dailyOdds[key].team2}`:`${dailyOdds[key].team2} ${-1*dailyOdds[key].spread} over ${dailyOdds[key].team1}`)+'</li>';
	}
	outp += '</ol>';
	document.getElementById('dailyPicks').innerHTML = outp;
	document.getElementById("dailyPicksBtn").classList.add('hidden');
	// document.getElementsByClassName("help-heading").classList.remove('hidden');
}

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
		showPicks(picks);
	})
   .catch(retData => modalAlert(retData.type,retData.message));
});

function resetTracker() {
	// $('#trackerInfoArea').addClass('hidden');
	// document.getElementById("trackerInfoArea").innerHTML = '<p class="title center">Another Time</p>';
	// $('#trackerPicksArea').addClass('hidden');
}

$('#trackerYear').on('change', function(){
	// resetTracker();
	// getTracker($('.sportPick.selected').attr('class').split(/\s+/)[1], $('#trackerYear').val(), new Date())
});

