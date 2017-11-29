function getOdds (){
   var sport = document.cookie.split('=')[1];
   if (!sport || $('#sport'+sport[0].toUpperCase()+sport.substr(1)).hasClass('dimmed'))
      sport = ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa';
   toggleSport(sport);
	$.ajax({
		type: 'GET',
		url: '/api/'+sport+'odds',
		// data: reqString,
		dataType: 'json',
      success:function(retData){
         var sportColor, prevDate=1, gameNum=0, listCount=11;
         // clear remnents of previous screens
         for (var i = 1; i < 5; i++) {
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
            outp += '<tr><td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btn-'+btnColor1+'"><tr><td rowspan="2" width="20px"><img id="tm1_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team1+'</td></tr><tr><td class="center bold">'+rec.spread+'</td></tr></table></button></td>';
            // +((date.getHours()>12)?(date.getHours()-12):date.getHours())+':'+('0'+date.getMinutes()).slice(-2)+((date.getHours()>11)?'pm':'am')
            outp += '<td class="td-odds td-middle"><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+rec.over+'</button><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+rec.over+'</button></td>';

            outp += '<td class="td-odds"><button '+checkDisabled+'class="btn pushDown btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'"><table class="btn-'+btnColor1+'"><tr><td rowspan="2"><img id="tm2_'+i+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png?ver=1"></td><td class="center">'+rec.team2+'</td></tr><tr><td class="center bold">'+(0-rec.spread)+'</td></tr></table></button></td></tr>';
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
      },
		error: function(retData){
		}
	});
}

function spritePosition (sport, team) {
   var width = 56, height = 40, cols = 6, index,
      nfl_teams = ['NFL', 'ARI', 'CAR', 'CHI', 'DAL', 'DET', 'GB', 'MIN', 'NO', 'NYG','PHI','SEA','SF','LAR', 'TB', 'WAS', 'BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'KC', 'JAC', 'IND', 'MIA', 'NE', 'NYJ', 'OAK', 'PIT', 'LAC', 'TEN', 'ATL'];
      nba_teams = ['NBA', 'BOS', 'BKN', 'CHR', 'CLE', 'DAL', 'DET', 'IND', 'LAC', 'LAL','MIA','NOH','NY','OKC', 'ORL', 'PHI', 'PHO', 'SAC', 'TOR', 'UTA', 'WAS', 'ATL', 'CHI', 'DEN', 'GS', 'HOU', 'MEM', 'MIL', 'MIN', 'POR', 'SAN'];
   if (sport == 'nfl')
      index = nfl_teams.indexOf(team);
   else
      index = nba_teams.indexOf(team);
   if (index < 0)
      index = 0;
   return index%cols*width*-1+'px '+Math.floor(index/cols)*height*-1+'px';
}
