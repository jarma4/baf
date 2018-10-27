function getAtsgame() {
	let sport = 'nfl';
	let season = 2018;
	let week = getWeek(new Date(),'nfl');

	$('#week').text('Week ' + week + ' Picks');
   if (inSeason[sport]< 0){
      // $('.signup').removeClass('hidden');
      // $('.active').addClass('hidden');
      // ouSignup();
   } else if (inSeason[sport] == 1){
      // $('.active').removeClass('hidden');
      // $('.signup').addClass('hidden');

      // get scoreboard
      postOptions.body = JSON.stringify({
         'sport': 'ats',
         'season': 2018
      });
      fetch('/api/getatsscoreboard', postOptions)
      .then(res => res.json())
   	.then(retData => {
         let outp2='', outp = '<table class="table table-condensed"><tr>';
         // create columns for each user
         $.each(retData, function(i, rec){
            outp += '<th>'+bafusers[rec.user]+'</th>';
            outp2 += '<th>'+rec.win+'</th>';
         });
         outp += '</tr><tr>'+outp2+'</tr></table>';
         document.getElementById("atsScoreboard").innerHTML = outp;
      });

      // get picks
      postOptions.body = JSON.stringify({
         'season': season,
         'week': week
      });
      fetch('/api/getatspicks', postOptions)
      .then(res => res.json())
   	.then(retData => {
         let outp = '<table class="table table-condensed">';

         retData.ats.games.forEach((rec, i) => {
				if (getWeek(new Date(rec.date),'nfl') == week) {
					outp += '<tr><td class="td-odds"><button class="btn '+((retData.picks[i] == '1')?'btn-success':'btn-default')+' btn-toggle" data-game="'+i+'" data-team="1"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
					outp += '<td class="td-odds"><button class="btn '+((retData.picks[i] == '2')?'btn-success':'btn-default')+' btn-toggle" data-game="'+i+'" data-team="2"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></td></tr>';
				}
         });
         outp += '</table>';
			document.getElementById("atsPicks").innerHTML = outp;
			retData.ats.games.forEach((rec, i) => {
				$('#tm1_'+i).css('object-position', spritePosition(sport, rec.team1));
				$('#tm2_'+i).css('object-position', spritePosition(sport, rec.team2.substr(1)));
			});
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

$('#atsTest').on('click', event => {
   postOptions.body = JSON.stringify({
      'season': 2018,
      'week': 7 //getWeek(new Date(), 'nfl')
   });
   fetch('/api/testats', postOptions)
   .then(res => res.json())
   .then(retData => modalAlert(retData.type,retData.message))
   .catch(retData => modalAlert(retData.type,retData.message));
});