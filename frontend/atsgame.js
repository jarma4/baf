function getAtsScoreboard() {
	let season = 2018;
	let week = getWeek(new Date(),'nfl');
   let day = new Date().getDay();
	let hour = new Date().getHours();

	// get scoreboard
	if(day == 3 || day == 4 || (day == 5 && hour > 18))
		week -= 1;
   postOptions.body = JSON.stringify({
      'week': week,
      'season': season
   });
   fetch('/api/getatsscoreboard', postOptions)
   .then(res => res.json())
   .then(retData => {
      let outp2='', outp3='', outp = '<table class="table table-condensed"><tr><th></th>';
      // create columns for each user
      $.each(retData, function(i, rec){
			outp += '<th>'+bafusers[rec.user]+'</th>';
         outp2 += '<td>'+retData[i].win+'</td>';
         outp3 += '<td>'+retData[i].pct+'</td>';
      });
      outp += '</tr><tr><td>Season</td>'+outp2+'</tr><td>$5 Bonus</td>'+outp3+'</table>';
      document.getElementById("atsScoreboard").innerHTML = outp;
	});
}

function getAtsPicks(season, week) {
	let day = new Date().getDay();
	let hour = new Date().getHours()

	$('#atsWeek').text('Week ' + week + ' Picks');
   if (week == getWeek(new Date(), 'nfl') && (day == 3 || day == 4 || (day == 5 && hour < 18))){
		$('.atsInc').removeClass('hidden');
      document.getElementById("atsPicks").innerHTML = '<h4 class="center">Come back Fri after 6</h4>';
   } else {
      // get picks
      postOptions.body = JSON.stringify({
         'season': season,
         'week': week
      });
      fetch('/api/getatspicks', postOptions)
      .then(res => res.json())
   	.then(retData => {
			let classAdd, totals = [];
			let outp = '<table class="table table-condensed">';
			if (retData.picks.length > 1) {  // showing everyone's picks
				$('.atsInc').removeClass('hidden');	// show arrow buttons
				outp += '<tr><th></th>';
				retData.picks.forEach((user, i) => {
					outp += '<th>'+bafusers[user.user]+'<br>(<span id="total'+i+'"></span>)</th>';
					totals[i] = 0;
				});
				outp += '</tr>';
			} else {
				$('#atsSubmit').removeClass('hidden');
			}

         retData.ats.forEach((rec, i) => {
				if (getWeek(new Date(rec.date),'nfl') == week) {
               if (retData.picks.length > 1) {
                  outp += '<tr><td>'+rec.team1.slice(0,3)+((Number(rec.spread)>=0)?'+':'')+rec.spread+'</td>';
						retData.picks.forEach((user, j) => {  // show each user's pick
							if (Number(user[i])==rec.ats) {
								totals[j] += 1;
								classAdd = ' class="text-success"';
							} else {
								classAdd = '';
							}
                     outp += '<td'+classAdd+'>'+((user[i] == '1')?rec.team1.slice(0,3):rec.team2.replace('@','').slice(0,3))+'</td>';
                  });						
               } else {
                  outp += '<tr><td class="td-odds"><button class="btn '+((retData.picks[0][i] == '1')?'btn-success':'btn-default')+' btn-toggle" data-game="'+i+'" data-team="1"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/nfl_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
                  outp += '<td class="td-odds"><button class="btn '+((retData.picks[0][i] == '2')?'btn-success':'btn-default')+' btn-toggle" data-game="'+i+'" data-team="2"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm2_'+i+'" class="logo-md" src="images/nfl_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></td></tr>';
               }
				}
			});
         outp += '</table>';
			document.getElementById("atsPicks").innerHTML = outp;
			if (retData.picks.length > 1) {
				totals.forEach((val, i) => {
					$('#total'+i).text(val);
				});
			} else {
				retData.ats.forEach((rec, i) => {
					$('#tm1_'+i).css('object-position', spritePosition('nfl', rec.team1));
					$('#tm2_'+i).css('object-position', spritePosition('nfl', rec.team2.substr(1)));
				});
			}
      })
   	.catch(retData => modalAlert(retData.type, retData.message));
   }
}

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
	let picks = [];
	$.each($('#atsPicks .btn-success'), (idx, game) => {
		picks.push(game.getAttribute('data-team'));
   });
   postOptions.body = JSON.stringify({
		'picks': JSON.stringify(picks),
		'season': 2018,
      'week': getWeek(new Date(), 'nfl')
   });
   fetch('/api/updateats', postOptions)
   .then(res => res.json())
   .then(retData => modalAlert(retData.type,retData.message))
   .catch(retData => modalAlert(retData.type,retData.message));
});

// back/forward button to get different scores
$('.atsInc').on('click', function(event){
   event.preventDefault();
   var tmp = $('#atsWeek').text().split(' ');
	if ((Number(tmp[1]) > 9 && $(this).val()=='-1') || (Number(tmp[1]) < getWeek(new Date(), 'nfl') && $(this).val()=='1'))
		getAtsPicks(2018, Number(tmp[1])+$(this).val()*1);
});
