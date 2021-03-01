function getAtsScoreboard(season, type) {
   postOptions.body = JSON.stringify({
		'season': season, 
		'type': type
   });
   fetch('/api/getatsscoreboard', postOptions)
   .then(res => res.json())
   .then(retData => {
      let outp2='', outp3='', outp = '<table class="table table-condensed"><tr><th></th>';
      // create columns for each user
      $.each(retData.totals, function(i, rec){
			outp += '<th>'+bafusers[rec.user]+'</th>';
         outp2 += '<td>'+retData.totals[i].win+'</td>';
         // outp3 += '<td>'+retData.totals[i].pct+'</td>';
      });
      // outp += '</tr><tr><td>Season</td>'+outp2+'</tr><tr><td>$5 Bonus</td>'+outp3+'</tr></table>';
      outp += '</tr><tr><td>Season</td>'+outp2+'</tr></table>';
      document.getElementById((type=='bta')?'btaScoreboard':'atsScoreboard').innerHTML = outp;
	});
}

function getAtsPicks(sport, season, period) {
	let today = new Date();

	today.setHours(0,0,0,0);
	if (sport == 'nba') {
		$('#atsDate').text(`${dayName[period.getDay()]} ${monthName[period.getMonth()]} ${period.getDate()}`);
		$('#atsDate').data('date',period);
	} else {
		$('#atsDate').text('Week ' + period + ' Picks');
	}

	postOptions.body = JSON.stringify({
		'sport': sport,
		'season': season,
		'date': period.setHours(0,0,0,0)
	});
	fetch('/api/getatspicks', postOptions)
	.then(res => res.json())
	.then(retData => {
		let outp;
		if (!retData.odds.length && period.getTime() === today.getTime()) { // no odds or challenge
			$('#btaChallenge').removeClass('hidden');
		} else {
			if (period.getTime() === today.getTime()) {
				$('#btaBtn').removeClass('hidden');
				// fill list of players
				outp = '<table><tr>';
				if (retData.players.length) {
					retData.players.forEach((player, i)=>{
						if (i%3 === 0)
							outp += '</tr><tr>';
						outp += '<td class="cellgutter">'+player+'</td>';
					});
				} else {
					outp += '<td class="cellgutter"> none </td>';
				}
				outp += '</tr></table>';
				document.getElementById("btaList").innerHTML = outp;
			}
			if (retData.picks.length > 1)  { // time to pick over, showing everyone's picks
				$('#atsPicks').removeClass('hidden');
				let classAdd, totals = [];
				outp = '<table class="table table-condensed"><tr><th></th>';  // add row with users names and future totals
				retData.picks.forEach((user, i) => {
					outp += '<th>'+bafusers[user.user]+'<br>(<span id="total'+i+'"></span>)</th>';
					totals[i] = 0;
				});
				outp += '</tr>';
				// now add picks for each
				retData.odds.forEach((rec, i) => {
					outp += '<tr><td>'+rec.team1.slice(0,3)+((Number(rec.spread)>=0)?'+':'')+rec.spread+'</td>';
					retData.picks.forEach((user, j) => {  // show each user's pick
						if (Number(user[i])==rec.ats) {
							totals[j] += 1;
							classAdd = ' class="text-success"';
						} else {
							classAdd = '';
						}
						outp += '<td'+classAdd+'>'+((user[i] == '1')?rec.team1.slice(0,3):(user[i] == '2')?rec.team2.replace('@','').slice(0,3):'none')+'</td>';
					});
					outp += '</tr>';	
				});
				outp += '</table>';
				document.getElementById("atsPicks").innerHTML = outp;
				totals.forEach((val, i) => {
					$('#total'+i).text(val);
				});		
				// $('#atsSubmit').addClass('hidden');	// show save button
			
			} else {
				if (period.getTime() === today.getTime()) {
					outp = '<p class="center title">It\'s on, '+retData.odds.length+' games tonight!</p>';
					document.getElementById("btaInfo").innerHTML = outp;
				}
				outp = '<table class="table table-condensed">';
				retData.odds.forEach((rec, i) => {
					outp += '<tr><td class="td-odds"><button class="btn btn-toggle '+((!retData.picks.length || retData.picks[0][i] == '1')?'btn-success':'btn-default')+'" data-game="'+i+'" data-team="1"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
					outp += '<td class="td-odds"><button class="btn btn-toggle '+((retData.picks.length && retData.picks[0][i] == '2')?'btn-success':'btn-default')+'" data-game="'+i+'" data-team="2"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></td></tr>';
				});
				if (retData.picks.length) {
					$('#atsPicks').removeClass('hidden');
					$('#btaBtn').text('Save');
				}
				outp += '</table>';
				document.getElementById("atsPicks").innerHTML = outp;
				retData.odds.forEach((rec, i) => {
					$('#tm1_'+i).css('object-position', spritePosition(sport, rec.team1));
					$('#tm2_'+i).css('object-position', spritePosition(sport, rec.team2.substr(1)));
				});
			}
		}
	})
	.catch(retData => modalAlert(retData.type, retData.message));
}

$('#btaBtn').on('click', event => {
	if ($('#btaBtn').text() == 'Join') {
		$('#atsPicks').removeClass('hidden');
		$('#btaBtn').text('Save');
	} else {
		let picks = {};
		$.each($('#atsPicks .btn-success'), (idx, game) => {
			picks[idx] = game.getAttribute('data-team');
		});
		postOptions.body = JSON.stringify({
			'picks': JSON.stringify(picks),
			'season': 2020,
			'sport': 'nba',
			'date': new Date().setHours(0,0,0,0)
		});
		fetch('/api/updateats', postOptions)
		.then(res => res.json())
		.then(retData => modalAlert(retData.type,retData.message))
		.catch(retData => modalAlert(retData.type,retData.message));	
	}
});
	
$('#btaChallenge').on('click', event => {
	postOptions.body = JSON.stringify({
		'season': 2020, 
		'sport': 'nba',
		'date': new Date().setHours(0,0,0,0)
   });
   fetch('/api/getbtaodds', postOptions)
   .then(res => res.json())
   .then(retData => {
		modalAlert(retData.type,retData.message);
		$('#btaChallenge').addClass('hidden');
		getAtsPicks('nba', 2020, new Date());

	})
   .catch(retData => modalAlert(retData.type,retData.message));
});

function toggleAts(game){
	$.each($('button[data-game="'+game+'"]'), (idx, choice) => {
		if (choice.classList.contains('btn-success')) {
			choice.classList.remove('btn-success');
			choice.classList.add('btn-default');
		} else {
			choice.classList.remove('btn-default');
			choice.classList.add('btn-success');
		}
	});
}

$('#atsPicks').delegate('.btn-toggle', 'click' , event => {
	event.preventDefault();
	let button = $(event.currentTarget);

	toggleAts(button.data('game'));
});

$('#atsSubmit').on('click', event => {
	let picks = {};
	$.each($('#atsPicks .btn-success'), (idx, game) => {
		picks[idx] = game.getAttribute('data-team');
   });
   postOptions.body = JSON.stringify({
		'picks': JSON.stringify(picks),
		'season': 2020,
		'sport': 'nba',
      'date': new Date().setHours(0,0,0,0)
   });
   fetch('/api/updateats', postOptions)
   .then(res => res.json())
   .then(retData => modalAlert(retData.type,retData.message))
   .catch(retData => modalAlert(retData.type,retData.message));
});

function resetBta() {
	$('#atsPicks').addClass('hidden');
	$('#btaBtn').addClass('hidden');
	$('#btaChallenge').addClass('hidden');
	$('#btaInfo').text('');
};

// back/forward button to get different scores
$('.atsInc').on('click', function(event){
   event.preventDefault();
   // var tmp = $('#atsWeek').text().split(' ');
	// if ((Number(tmp[1]) > 9 && $(this).val()=='-1') || (Number(tmp[1]) < 17 && Number(tmp[1]) < getWeek(new Date(), 'nfl') && $(this).val()=='1'))
	resetBta();
	getAtsPicks('nba', 2020, new Date(Number($('#atsDate').data('date'))+$(this).val()*(24*60*60*1000)));
});
