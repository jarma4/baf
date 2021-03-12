// back/forward button to get different scores
$('.statsInc').on('click', function(event){
   event.preventDefault();
   var parsed = $('#statsPeriod').text().split(' ');
   // if (parsed[0]=='Week') {
      if ((Number(parsed[1]) > 1 && $(this).val()=='-1') || (Number(parsed[1]) < ($('#sportNfl').hasClass('selected'))?23:32 && $(this).val()=='1'))
         weeklyStats(Number(parsed[1])+$(this).val()*1);
   // } else {
   //    weeklyStats(new Date(Number(new Date($('#statsDate').val()))+$(this).val()*(24*60*60*1000)));
   // }
});

function getStats() {
   var sport = document.cookie.split('=')[1];
   if (!sport || (sport != 'nba' && sport != 'nfl')) {
		sport = $('.sportPick.selected').text().toLowerCase();
		document.cookie = 'sport='+sport+';max-age=43200';
	} else {
		toggleSport(sport);
	}
   weeklyStats(getWeek(new Date(), sport));
   overallStats();
   drawChart(5);
}
// Stats stuff
function weeklyStats(date) {
   var sport = $('.sportPick.selected').attr('class').split(/\s+/)[1];
   $('#weeklyStats').empty();
   $('#statsPeriod').text('Week '+ date);
   if (inSeason[sport]) {
      postOptions.body = JSON.stringify({
         'date': date,
         'sport': sport
      });
      fetch('/api/weeklystats', postOptions)
      .then(res => res.json())
      .then(retData => {
         if(retData.length){
            var weeklyRecords = {},
               outp = '<table class="table table-condensed"><tr><th>Who</th><th>Win</th><th>Loss</th><th>Push</th><th>TBD</th></tr>';
            $.each(retData, function(i,rec){
               // for Summary table; create structure if first time user seen
               if (!weeklyRecords[rec.user1])
                  weeklyRecords[rec.user1] = {wins:0, losses:0, push: 0, tbd: 0};
               if (!weeklyRecords[rec.user2])
                  weeklyRecords[rec.user2] = {wins:0, losses:0, push: 0, tbd: 0};
               // increment proper counter
               switch  (rec.status) {
                  case 2:
                     weeklyRecords[rec.user1].tbd += 1;
                     weeklyRecords[rec.user2].tbd += 1;
                     break;
                  case 4:
                     weeklyRecords[rec.user1].wins += 1;
                     weeklyRecords[rec.user2].losses += 1;
                     break;
                  case 5:
                     weeklyRecords[rec.user2].wins += 1;
                     weeklyRecords[rec.user1].losses += 1;
                     break;
                  case 6:
                     weeklyRecords[rec.user1].push += 1;
                     weeklyRecords[rec.user2].push += 1;
                     break;
               }
            });
            // outp += '</table>';
            // build Summary table
            for (var player in weeklyRecords) {
               outp += '<tr><td><a href="#" data-toggle="modal" data-target="#statsModal" data-week="'+$('#statsPeriod').text().split(' ')[1]+'" data-user="'+player+'">'+player.slice(0,6)+'</td><td>'+weeklyRecords[player].wins+'</td><td>'+weeklyRecords[player].losses+'</td><td>'+weeklyRecords[player].push+'</td><td>'+weeklyRecords[player].tbd+'</td></tr>';
            }
            outp += '</table>';
            // check whether Detail or Summary screen
            // if ($('#statsType').text() == 'Detail')
            //    document.getElementById('weeklyStats').innerHTML = outp;
            // else
            document.getElementById('weeklyStats').innerHTML = outp;

            // open collapsed panel if not already open
            collapseIconAction('weeklyStats');
         }
      })
      .catch(retData => modalAlert(retData.type, retData.message));
   } else {
      $('#statsPeriod').text('Season over, no weekly');
   }
}

$('#statsYear').on('change', function(){
	overallStats();
	$('#weeklyStats').empty();
   drawChart(0);
});

// get overall stats and graph
function overallStats() {
   postOptions.body = JSON.stringify({
      'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
      'season': $('#statsYear').val()
   });
   fetch('/api/overallstats', postOptions)
   .then(res => res.json())
   .then(retData => {
      var outp = '<table class="table"><tr><th>Who</th><th>Win</th><th>Loss</th><th>Push</th><th>%</th></tr>';
      $.each(retData, function(i,rec){
         outp += '<tr><td><a href="#" data-toggle="modal" data-target="#statsModal" data-user="'+rec.user+'" >'+rec.user.slice(0,6)+'</a></td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.push+'</td><td>'+rec.pct.toPrecision(3)+'</td></tr>';
         $('#overallStatsTitle span.collapseIcon').removeClass('hidden');
      });
      outp += '</table>';
      document.getElementById("overallStats").innerHTML = outp;
   })
   .catch(retData => modalAlert(retData.type, retData.message));
}

function getUserStats (user, sport, season, week) {
   postOptions.body = JSON.stringify({
      user: user,
      sport: sport,
      season: season,
      week: week
   });
   return fetch('/api/userstats', postOptions);
}

//modal to show stats for each user of every bet in database for them
$('#statsModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);
   $('#statsTitle').text('Stats history for: '+button.data('user'));
   getUserStats(button.data('user'), $('.sportPick.selected').attr('class').split(/\s+/)[1], $('#statsYear').val(),(button.data('week'))?button.data('week'):'')
   .then(res => res.json())
   .then(retData => {
   	var outp = '<table class="table"><tr><th>Date</th><th>Me</th><th>Them</th><th>W/L</th></tr>';
   	$.each(retData.bets, function(i,rec){
         var date=new Date(rec.date);
   		outp += '<tr><td>'+(date.getMonth()+1)+'/'+date.getDate()+'</a></td><td>';
         if (rec.user1 == button.data('user')) {
            outp += ((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team1.replace('@','')+'</td><td>'+rec.team2.replace('@','')+' ('+rec.user2.slice(0,6)+')</td><td>'+((rec.status==4)?'W':((rec.status==5)?'L':'P'));
         } else {
            outp += ((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team2.replace('@','')+'</td><td>'+rec.team1.replace('@','')+' ('+rec.user1.slice(0,6)+')</td><td>'+((rec.status==5)?'W':((rec.status==4)?'L':'P'));
         outp += '</td></tr>';
         }
   	});
   	outp += '</table>';
   	document.getElementById("statsHistory").innerHTML = outp;
      collapseIconAction('statsHistory');
      // Splits table
      outp = '<table class="table"><tr><th>Who</th><th>Wins</th><th>Loss</th><th>Push</th></tr>';
      $.each(retData.winList, function(i,rec){
         var date=new Date(rec.date);
   		outp += '<tr><td>'+i+'</td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.push+'</td></tr>';
   	});
   	outp += '</table>';
   	document.getElementById("statsSplits").innerHTML = outp;
      collapseIconAction('statsSplits');
   })
   .catch(retData => modalAlert(retData.type, retData.message));
});
