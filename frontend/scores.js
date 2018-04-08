function showScores(period) {
   var sport = document.cookie.split('=')[1];
   if (sport !== 'nba' && sport !== 'nfl' && sport !== 'ncaa')
      sport = ($('#sportNfl').hasClass('selected'))?'nfl':'nba';
   if (sport == 'nba' && $('#sportNfl').hasClass('selected'))
      period = new Date();
   toggleSport(sport);
   fetch('/api/getscores', {
      credentials: 'same-origin',
      method:'POST',
      headers: {
         'Accept': 'application/json, text/plain, */*',
         'Content-Type':'application/json'
      },
      body:JSON.stringify({
         'sport': sport,
         'season': 2017, //too specific to football, needs to fixed
         'period': period
      })
   })
   .then((res)=>res.json())
   .then(retData => {
      if ($('#sportNfl').hasClass('selected')) {
         $('#scoresPeriod').text('Week '+period);
      } else {
         $('#scoresPeriod').text(monthName[period.getMonth()]+' '+period.getDate());
      }
      var outp = '<table class="table"><tr><th>Away</th><th>Score</th><th>Home</th><th>Score</th></tr>';
      $.each(retData, function(i,rec){
         outp += '<tr><td>'+rec.team1+'</td><td>'+rec.score1+'</td><td>'+rec.team2+'</td><td>'+rec.score2+'</td></tr>';
      });
      outp += '</table>';
      document.getElementById("scoresArea").innerHTML = outp;
   })
   .catch(retData => modalAlert(retData.type, retData.message));
}

// back/forward button to get different scores
$('.scoresInc').on('click', function(event){
   event.preventDefault();
   var tmp = $('#scoresPeriod').text().split(' ');
   if (tmp[0]=='Week') {
      if ((Number(tmp[1]) > 1 && $(this).val()=='-1') || (Number(tmp[1]) < 24 && $(this).val()=='1'))
         showScores(Number(tmp[1])+$(this).val()*1);
   } else {
      showScores(new Date(Number(new Date($('#scoresPeriod').text()+' 2018'))+$(this).val()*(24*60*60*1000)));
   }
});
