function getOdds (){
   let sport = getCookie('sport');
   if (!sport || $('.sportPick.'+sport).hasClass('hidden')) {
		sport = $('.sportPick.selected').text().toLowerCase();
		document.cookie = 'sport='+sport+';max-age=43200';
	} else {
		toggleSport(sport);
	}
   postOptions.body = JSON.stringify({
      "sport": sport
   });
	fetch('/api/getodds', postOptions)
   .then(res =>res.json())
   .then(retData => {
      let sportColor, prevDate=1, gameNum=0, listCount=(retData.games.length > 21)?Math.ceil(retData.games.length/3):7;
      // clear remnents of previous screens
      for (let i = 1; i < 4; i++) {
         $('#col'+i).empty();
      }
      // store info globally to be used elsewhere
      window.oddsDb = retData.games;

      let outp = '<table class="table">';
      $.each(retData.games, function(i,rec){
         let checkDisabled = '', btnColor1, btnColor2, date = new Date(rec.date);

         // gray out and disable if game already started
         if (date > new Date()) {
            btnColor1 = 'primary';
            btnColor2 = 'default';
         } else {
            checkDisabled = 'disabled ';
            btnColor1 = 'default';
            btnColor2 = 'default';
         }
         // non mobile will see multiple columns so start new if current full
         if (gameNum%listCount === 0 && gameNum/listCount > 0) {
            outp += '</table>';
            document.getElementById('col'+gameNum/listCount).innerHTML = outp;
            outp = '<table class="table">';
         }
         // draw date row if needed
         let tmpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         if (tmpDate > prevDate) {
            outp += '<tr class="modal-warning"><td colspan=3 class="center  odds-date-row">'+dayName[date.getDay()]+' '+monthName[date.getMonth()]+' '+date.getDate()+'</td></tr>';
			}
         outp += '<tr><td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+((rec.spread != undefined)?rec.spread:'*')+'</td></tr></table></button></td>';
         // +((date.getHours()>12)?(date.getHours()-12):date.getHours())+':'+('0'+date.getMinutes()).slice(-2)+((date.getHours()>11)?'pm':'am')
         outp += '<td class="td-odds td-middle"><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+(rec.over?rec.over:'')+'</button><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+(rec.over?rec.over:'')+'</button></td>';

         outp += '<td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+((rec.spread != undefined)?(0-rec.spread):'*')+'</td></tr></table></button></td></tr>';
         prevDate = tmpDate;
         gameNum++;
      });
      outp += '</table>';
      document.getElementById('col'+Math.ceil(gameNum/listCount)).innerHTML = outp;
      // set sprite position for each logo on buttons
      $.each(retData.games, function(i, rec){
         $('#tm1_'+i).css('object-position', spritePosition(sport, rec.team1));
         $('#tm2_'+i).css('object-position', spritePosition(sport, rec.team2.substr(1)));
      });
      $('#timestamp').text('updated:'+retData.time);
   })
	.catch(retData => modalAlert(retData.type,retData.message));
}

function getOdds2 (){
   let sport = $('.sportPick.selected').attr('class').split(/\s+/)[1];
   // if (!sport || $('#sport'+sport[0].toUpperCase()+sport.substr(1)).hasClass('dimmed'))
   //    let sport = ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'soccer';
   // toggleSport(sport);
   postOptions.body = JSON.stringify({
      "sport": sport
   });
	fetch('/api/getodds', postOptions)
   .then(res =>res.json())
   .then(retData => {
      let sportColor, prevDate=1, gameNum=0, listCount=(retData.games.length > 21)?Math.ceil(retData.games.length/3):7;
      // clear remnents of previous screens
      for (let i = 1; i < 4; i++) {
         $('#col'+i).empty();
      }
      // store info globally to be used elsewhere
      window.oddsDb = retData.games;

      let outp = '<table class="table">';
      $.each(retData.games, function(i,rec){
         let checkDisabled = '', btnColor1, btnColor2, date = new Date(rec.date);

         // gray out and disable if game already started
         if (date > new Date()) {
            btnColor1 = 'primary';
            btnColor2 = 'default';
         } else {
            checkDisabled = 'disabled ';
            btnColor1 = 'default';
            btnColor2 = 'default';
         }
         // non mobile will see multiple columns so start new if current full
         if (gameNum%listCount === 0 && gameNum/listCount > 0) {
            outp += '</table>';
            document.getElementById('col'+gameNum/listCount).innerHTML = outp;
            outp = '<table class="table">';
         }
         // draw date row if needed
         let tmpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         if (tmpDate > prevDate)
            outp += '<tr class="modal-warning"><td colspan=3 class="center  odds-date-row">'+dayName[date.getDay()]+' '+monthName[date.getMonth()]+' '+date.getDate()+'</td></tr>';
         outp += '<tr><td class=""><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2"><img id="tm1_'+i+'" class="logo-sm" src="images/'+sport+'_logo_sprite_small.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
         // +((date.getHours()>12)?(date.getHours()-12):date.getHours())+':'+('0'+date.getMinutes()).slice(-2)+((date.getHours()>11)?'pm':'am')
         outp += '<td class="td-odds td-middle"><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+rec.over+'</button><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+rec.over+'</button></td>';

         outp += '<td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2"><img id="tm2_'+i+'" class="logo-sm" src="images/'+sport+'_logo_sprite_small.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></tr>';
         prevDate = tmpDate;
         gameNum++;
      });
      outp += '</table>';
      document.getElementById('col'+Math.ceil(gameNum/listCount)).innerHTML = outp;
      // set sprite position for each logo on buttons
      $.each(retData.games, function(i, rec){
         $('#tm1_'+i).css('object-position', spritePosition2(sport, rec.team1));
         $('#tm2_'+i).css('object-position', spritePosition2(sport, rec.team2.substr(1)));
      });
      $('#timestamp').text('updated:'+retData.time);
   })
	.catch(retData => modalAlert(retData.type,retData.message));
}

// prepopulate modal items with data from database
$('#betModal').on('show.bs.modal', function (event) {
   let vs1, vs2, odds, button = $(event.relatedTarget);

   // odds database in certain order, need to order bet elements so that user
   // choice is first before sent
   if (button.data('team') == 1) {
      vs1 = window.oddsDb[button.data('game')].team1;
      vs2 = window.oddsDb[button.data('game')].team2;
      if (button.data('type') == 'spread')
         odds = window.oddsDb[button.data('game')].spread;
      else if (button.data('type') == 'over' || button.data('type') == 'under')
			odds = window.oddsDb[button.data('game')].over;
		else if (button.data('type') == 'firsthalf')
			odds = window.oddsDb[button.data('game')].firsthalf;
		else
			odds = window.oddsDb[button.data('game')].secondhalf;
   } else {
      vs1 = window.oddsDb[button.data('game')].team2;
      vs2 = window.oddsDb[button.data('game')].team1;
      if (button.data('type') == 'spread')
         odds = 0 - window.oddsDb[button.data('game')].spread;  //odds are for 1st team, need to reverse when taking second
      else if (button.data('type') == 'over' || button.data('type') == 'under')
			odds = window.oddsDb[button.data('game')].over;
		else if (button.data('type') == 'firsthalf')
			odds = window.oddsDb[button.data('game')].firsthalf;
		else
			odds = window.oddsDb[button.data('game')].secondhalf;
   }

   // now ordered, prepopulate items
   $('#betTeam1').val(vs1);
   $('#betTeam2').val(vs2);
   // $('#betOdds').val(odds);
   $('#betOdds').val(odds);
   $('#betOddsNew').val(odds);
   $('#betSport').val(button.data('sport'));
   $('#betType').val(button.data('type'));
   $('#betGametime').val(button.data('gametime'));
   if (button.data('type') == 'spread')
      $('#betTitle').text('You want: '+vs1+' '+odds+' vs '+vs2);
   else if (button.data('type') == 'over' || button.data('type') == 'under')
		$('#betTitle').text('You want: ' + ((button.data('team') == 1)?'Over ':'Under ') + odds);
	else
		$('#betTitle').text('You want '+((button.data('type') == 'firsthalf')?'First Half':'Second Half')+': '+vs1+' '+odds+' vs '+vs2);
   resetBetStuff();
});

$('#betSubmit').on('click', function(event) {
   postApi('makebet', {
      'user2': $('#userList').val(),
      'odds': Number(($('#oddsWatch').is(":checked"))?$('#betOddsNew').val():$('#betOdds').val()),
      'type': $('#betType').val(),
      'team1': $('#betTeam1').val(),
      'team2': $('#betTeam2').val(),
      'sport': $('#betSport').val(),
      'gametime': $('#betGametime').val(),
      'serial': Math.random(),
      'watch': $('#oddsWatch').is(":checked"),
		'watchsend': $('#oddsWatchSend').is(":checked"),
		'limit': $('#betLimitCheckbox').is(":checked")?$('#betLimit').val():0
	});
   getBets(($('#sportNfl').hasClass('selected'))?10:11,'watchBets','watch');
});

function resetBetStuff(){
   // $('#betUserlist').removeClass('nodisplay');
	// $('#userList').prop('disabled', false);
	$('#userList option[value="EVERYONE"]').prop('selected', true)
	$('#betSubmit').text('Send Bet');
	$('#oddsWatch').prop('checked', false);
   $('#oddsWatchArea').addClass('nodisplay');
	$('#betLimitCheckbox').prop('checked', false);
   $('#betLimitPicker').addClass('nodisplay');
   $('#betLimit').val(0);
}

$('#betLimitCheckbox').on('click', function(event) {
	$('#betLimitPicker').toggleClass('nodisplay');
	if ($("#betLimitCheckbox").is(":checked")) {
      $('#betLimit').val(1);
   } else {
      $('#betLimitCheckbox').val(0);
   }
});

$('#userList').on('change', function(){
	if ($('#userList').val() == 'EVERYONE'){
		$('#betLimitArea').removeClass('nodisplay');
		$('#betLimitCheckbox').prop('checked', false);
		$('#betLimitPicker').addClass('nodisplay');
		$('#betLimit').removeClass('bg-danger');
		$('#betLimit').val(1);
	} else {
		$('#betLimitArea').addClass('nodisplay');
	}
});
