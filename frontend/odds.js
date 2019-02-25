function getOdds (){
   var sport = $('.sportPick.selected').attr('class').split(/\s+/)[1];
   // if (!sport || $('#sport'+sport[0].toUpperCase()+sport.substr(1)).hasClass('dimmed'))
   //    var sport = ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'soccer';
   // toggleSport(sport);
   postOptions.body = JSON.stringify({
      "sport": sport
   });
	fetch('/api/getodds', postOptions)
   .then(res =>res.json())
   .then(retData => {
      var sportColor, prevDate=1, gameNum=0, listCount=(retData.games.length > 21)?Math.ceil(retData.games.length/3):7;
      // clear remnents of previous screens
      for (var i = 1; i < 4; i++) {
         $('#col'+i).empty();
      }
      // store info globally to be used elsewhere
      window.oddsDb = retData.games;

      var outp = '<table class="table">';
      $.each(retData.games, function(i,rec){
         var checkDisabled = '', btnColor1, btnColor2, date = new Date(rec.date);

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
         var tmpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         if (tmpDate > prevDate)
            outp += '<tr class="modal-warning"><td colspan=3 class="center  odds-date-row">'+dayName[date.getDay()]+' '+monthName[date.getMonth()]+' '+date.getDate()+'</td></tr>';
         outp += '<tr><td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
         // +((date.getHours()>12)?(date.getHours()-12):date.getHours())+':'+('0'+date.getMinutes()).slice(-2)+((date.getHours()>11)?'pm':'am')
         outp += '<td class="td-odds td-middle"><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+rec.over+'</button><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+rec.over+'</button></td>';

         outp += '<td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></tr>';
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
   var sport = $('.sportPick.selected').attr('class').split(/\s+/)[1];
   // if (!sport || $('#sport'+sport[0].toUpperCase()+sport.substr(1)).hasClass('dimmed'))
   //    var sport = ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'soccer';
   // toggleSport(sport);
   postOptions.body = JSON.stringify({
      "sport": sport
   });
	fetch('/api/getodds', postOptions)
   .then(res =>res.json())
   .then(retData => {
      var sportColor, prevDate=1, gameNum=0, listCount=(retData.games.length > 21)?Math.ceil(retData.games.length/3):7;
      // clear remnents of previous screens
      for (var i = 1; i < 4; i++) {
         $('#col'+i).empty();
      }
      // store info globally to be used elsewhere
      window.oddsDb = retData.games;

      var outp = '<table class="table">';
      $.each(retData.games, function(i,rec){
         let checkDisabled = '', checkDisabled2 = 'disabled ', btnColor1, btnColor2, date = new Date(rec.date);

         // gray out and disable if game already started
         if (date > new Date()) {
            btnColor1 = 'primary';
            btnColor2 = 'default';
         } else {
            checkDisabled = 'disabled ';
            btnColor1 = 'default';
            btnColor2 = 'default';
         }

         if (rec.inhalftime) {
				checkDisabled2 = '';
				btnColor2 = 'primary';
         }
         // non mobile will see multiple columns so start new if current full
         if (gameNum%listCount === 0 && gameNum/listCount > 0) {
            outp += '</table>';
            document.getElementById('col'+gameNum/listCount).innerHTML = outp;
            outp = '<table class="table">';
         }
         // draw date row if needed
         var tmpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         if (tmpDate > prevDate)
				outp += '<tr class="modal-warning"><td colspan=5 class="center  odds-date-row">'+dayName[date.getDay()]+' '+monthName[date.getMonth()]+' '+date.getDate()+'</td></tr>';
			// visitor spread
         outp += '<tr><td class="td-odds"><button id=btn-override '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1.slice(0,5)+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
			//over under
         outp += '<td class="td-odds td-middle"><button id=btn-override '+checkDisabled+'class="btn btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+rec.over+'</button><button id=btn-override '+checkDisabled+'class="btn btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+rec.over+'</button></td>';
         // first/second half
			outp += '<td class="td-odds td-middle"><button id=btn-override '+checkDisabled+'class="btn btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="firsthalf" data-sport="'+sport+'" data-gametime="'+rec.date+'">1H '+rec.firsthalf+'</button><button id=btn-override '+checkDisabled2+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="secondhalf" data-sport="'+sport+'" data-gametime="'+rec.date+'">2H '+rec.secondhalf+'</button></td>';
			// home spread
         outp += '<td class="td-odds"><button id=btn-override '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btnIcon"><tr><td rowspan="2"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2.slice(0,5)+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></tr>';
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

// prepopulate modal items with data from database
$('#betModal').on('show.bs.modal', function (event) {
   var vs1, vs2, odds, button = $(event.relatedTarget);

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
   resetOddsWatch();
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
      'watchsend': $('#oddsWatchSend').is(":checked")
	});
   getBets(($('#sportNfl').hasClass('selected'))?10:11,'watchBets','watch');
});

function spritePosition (sport, team) {
   var width = 56, height = 40, cols = 6, index,
      nfl_teams = ['NFL', 'ARI', 'CAR', 'CHI', 'DAL', 'DET', 'GB', 'MIN', 'NO', 'NYG','PHI','SEA','SF','LAR', 'TB', 'WAS', 'BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'KC', 'JAC', 'IND', 'MIA', 'NE', 'NYJ', 'OAK', 'PIT', 'LAC', 'TEN', 'ATL'];
      nba_teams = ['NBA', 'BOS', 'BKN', 'CHR', 'CLE', 'DAL', 'DET', 'IND', 'LAC', 'LAL','MIA','NOP','NY','OKC', 'ORL', 'PHI', 'PHO', 'SAC', 'TOR', 'UTA', 'WAS', 'ATL', 'CHI', 'DEN', 'GS', 'HOU', 'MEM', 'MIL', 'MIN', 'POR', 'SAN'];
   if (sport == 'nfl')
      index = nfl_teams.indexOf(team);
   else
      index = nba_teams.indexOf(team);
   if (index < 0)
      index = 0;
   return index%cols*width*-1+'px '+Math.floor(index/cols)*height*-1+'px';
}
