function getBtaScoreboard(sport, season, type) {
   postOptions.body = JSON.stringify({
		'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1], 
		'season': $('#btaYear').val()
   });
   fetch('/api/getbtascoreboard', postOptions)
   .then(res => res.json())
   .then(retData => {
      let outp2='', outp3='', outp = '<table class="table table-condensed"><tr><th></th>';
      // create columns for each user
      $.each(retData.totals, function(i, rec){
			outp += '<th>'+bafusers[rec.user]+'</th>';
         outp2 += '<td>'+retData.totals[i].win.toFixed(1)+'</td>';
         // outp3 += '<td>'+retData.totals[i].pct+'</td>';
      });
      // outp += '</tr><tr><td>Season</td>'+outp2+'</tr><tr><td>$5 Bonus</td>'+outp3+'</tr></table>';
      outp += '</tr><tr><td>Season</td>'+outp2+'</tr></table>';
      document.getElementById((type=='bta')?'btaScoreboard':'btaScoreboard').innerHTML = outp;
	});
}

function getBtaPicks(sport, season, period) {
	$('#btaDate').text(`${dayName[period.getDay()]} ${monthName[period.getMonth()]} ${period.getDate()}`);
	$('#btaDate').data('date',period);

	postOptions.body = JSON.stringify({
		'sport': sport,
		'season': season,
		'date': period
	});
	fetch('/api/getbtapicks', postOptions)
	.then(res => res.json())
	.then(retData => {
		let outp, today = new Date();
		// const dayOf = checkSameDate(today, period) && ((sport == 'nfl')?(period.getDay()==0 && today.getHours() < 12): today.getHours() < 18);
		if (!retData.timeToPick) { // in past or time to pick over, showing everyone's picks
			if (retData.picks.length > 1)  {
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
						if (Number(user[i])==rec.ats || Number(user[i])==(rec.ats-10)) {
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
				document.getElementById("btaPicksArea").innerHTML = outp;
				totals.forEach((val, i) => {
					$('#total'+i).text(val);
				});		
				$('#btaPicksArea').removeClass('hidden');
			}
		} else { // day of
			if (!retData.odds.length && ((sport == 'nfl')?(period.getDay()==0 && today.getHours() < 11): today.getHours() < 17)) { // no challenge yet but is day to challenge
				$('#btaChallengeBtn').removeClass('hidden');
				document.getElementById("btaInfoArea").innerHTML = '';
			} else {
				if(retData.picks.length < 2) {
					outp = '<p class="center title">It\'s on, '+retData.odds.length+' games today!</p>';
					outp += '<p class="help-heading"> Who\'s In:';
					outp += '<table><tr>';
					if (retData.players.length) {
						retData.players.forEach((player, i)=>{
							if (i%3 === 0)
								outp += '</tr><tr>';
							outp += '<td class="cellgutter">'+player+'</td>';
						});
					} else {
						outp += '<td class="cellgutter"> nobody </td>';
					}
					outp += '</tr></table>';
					$('#btaChoiceBtn').removeClass('hidden');
				} else {
					outp = '<p class="center title">Games started, results:</p>';
				}
				document.getElementById("btaInfoArea").innerHTML = outp;
				$('#btaInfoArea').removeClass('hidden');

				outp = '<p class="help-heading pushDown"> Your Choices(in green):';
				outp += '<table class="table table-condensed">';
				retData.odds.forEach((rec, i) => {
					outp += '<tr><td class="td-odds"><button class="btn btn-toggle '+((!retData.picks.length || retData.picks[0][i] == '1')?'btn-success':'btn-default')+'" data-game="'+i+'" data-team="1"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
					outp += '<td class="td-odds"><button class="btn btn-toggle '+((retData.picks.length && retData.picks[0][i] == '2')?'btn-success':'btn-default')+'" data-game="'+i+'" data-team="2"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></td></tr>';
				});
				if (retData.picks.length) {
					$('#btaPicksArea').removeClass('hidden');
					$('#btaChoiceBtn').text('Save');
				}
				outp += '</table>';
				document.getElementById("btaPicksArea").innerHTML = outp;
				retData.odds.forEach((rec, i) => {
					$('#tm1_'+i).css('object-position', spritePosition(sport, rec.team1));
					$('#tm2_'+i).css('object-position', spritePosition(sport, rec.team2.substr(1)));
				});
			}
		}
	})
	.catch(retData => modalAlert(retData.type, retData.message));
}

$('#btaChoiceBtn').on('click', event => {
	if ($('#btaChoiceBtn').text() == 'Join') {
		$('#btaPicksArea').removeClass('hidden');
		$('#btaChoiceBtn').text('Save');
	} else { // button was Save
		let picks = {};
		$.each($('#btaPicksArea .btn-success'), (idx, game) => {
			picks[idx] = game.getAttribute('data-team');
		});
		postOptions.body = JSON.stringify({
			'picks': JSON.stringify(picks),
			'season': $('#btaYear').val(),
			'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
			'date': new Date($('#btaDate').data('date'))
		});
		fetch('/api/updatebta', postOptions)
		.then(res => res.json())
		.then(retData => modalAlert(retData.type,retData.message))
		.catch(retData => modalAlert(retData.type,retData.message));	
	}
});
	
$('#btaChallengeBtn').on('click', event => {
	postOptions.body = JSON.stringify({
		'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
		'season': $('#btaYear').val(), 
		'date': new Date($('#btaDate').data('date'))
   });
   fetch('/api/createbtaodds', postOptions)
   .then(res => res.json())
   .then(retData => {
		modalAlert(retData.type,retData.message);
		$('#btaChallengeBtn').addClass('hidden');
		resetBta();
		getBtaPicks($('.sportPick.selected').attr('class').split(/\s+/)[1], $('#btaYear').val(), new Date($('#btaDate').data('date')));

	})
   .catch(retData => modalAlert(retData.type,retData.message));
});

$('#btaYear').on('change', function(){
	resetBta();
	getBtaPicks($('.sportPick.selected').attr('class').split(/\s+/)[1], $('#btaYear').val(), new Date())
	$('#btaScoreboard').empty();
	getBtaScoreboard($('.sportPick.selected').attr('class').split(/\s+/)[1], $('#btaYear').val())
});

function toggleBta(game){
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

$('#btaPicksArea').delegate('.btn-toggle', 'click' , event => {
	event.preventDefault();
	let button = $(event.currentTarget);

	toggleBta(button.data('game'));
});

$('#btaSubmit').on('click', event => {
	let picks = {};
	$.each($('#btaPicksArea .btn-success'), (idx, game) => {
		picks[idx] = game.getAttribute('data-team');
   });
   postOptions.body = JSON.stringify({
		'picks': JSON.stringify(picks),
		'season': $('#btaYear').val(),
		'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
      'date': new Date().setHours(0,0,0,0)
   });
   fetch('/api/updatebta', postOptions)
   .then(res => res.json())
   .then(retData => modalAlert(retData.type,retData.message))
   .catch(retData => modalAlert(retData.type,retData.message));
});

function resetBta() {
	// $('#btaInfoArea').addClass('hidden');
	document.getElementById("btaInfoArea").innerHTML = '<p class="title center">Results</p>';
	$('#btaPicksArea').addClass('hidden');
	$('#btaChoiceBtn').addClass('hidden');
	$('#btaChallengeBtn').addClass('hidden');
	$('#btaChoiceBtn').text('Join');
};

// back/forward button to get different scores
$('.btaInc').on('click', function(event){
   event.preventDefault();
   // var tmp = $('#atsWeek').text().split(' ');
	// if ((Number(tmp[1]) > 9 && $(this).val()=='-1') || (Number(tmp[1]) < 17 && Number(tmp[1]) < getWeek(new Date(), 'nfl') && $(this).val()=='1'))
	resetBta();
	getBtaPicks($('.sportPick.selected').attr('class').split(/\s+/)[1], $('#btaYear').val(), new Date(Number($('#btaDate').data('date'))+$(this).val()*(24*60*60*1000)));
});
