// Update status of special over/under wager these guys have
function getOverunder() {
   var sport = $('.sportPick.selected').attr('class').split(/\s+/)[1];
	const today = new Date();
   if (inSeason[sport] && today < new Date(seasonStart[sport]) && today.getFullYear() == $('#ouYear').val()){
      $('.signup').removeClass('hidden');
      $('.active').addClass('hidden');
      ouSignup();
   } else {
      $('.active').removeClass('hidden');
      $('.signup').addClass('hidden');
      postOptions.body = JSON.stringify({
         'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
         'season': $('#ouYear').val()
      });
      fetch('/api/getstandings', postOptions)
      .then(res => res.json())
   	.then(retData => {
         var points = [],
            outp = '<table class="table table-condensed"><tr><th>Team</th><th>W</th><th>L</th><th>Proj</th><th>Line</th><th>O/U</th><th>Need</th></tr>',
            outp2 = '<table class="table table-condensed"><tr><th>Team</th>';
         // create columns for each user
         $.each(retData.users, function(i, rec){
            outp2 += '<th>'+bafusers[rec.user]+'</th>';
            points[i] = 0; // initialize for all users, used for projections
         });
         outp2 += '<tr>';
         // go through teams and populate tables
         $.each(retData.standings, function(i, rec){
            var gamesDiff = rec.line-rec.win;
            var gamesLeft = ($('.sportPick.nfl').hasClass('selected'))?17-rec.win-rec.loss-rec.tie:82-rec.win-rec.loss-rec.tie;
            // populate standings area
            outp += '<tr><td>'+rec.team.replace(' ','').slice(0,5)+'</td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.projection.toPrecision(3)+'</td><td>'+rec.line+'</td>'+((Math.abs(Math.floor(rec.line-rec.projection))<3)?'<td class="heading-danger">':'<td>')+((rec.status == 'Over')?'O':(rec.status == 'Under')?'U':'P')+'</td><td>'+((gamesDiff<0)?'met':((gamesDiff+0.5)>gamesLeft)?'not O':Math.floor(gamesDiff+0.5)+'/'+gamesLeft)+'</td></tr>';
            // populate picks area
            outp2 += '<tr><td>'+rec.team.replace(' ','').slice(0,5)+'</td>';
            for (var j = 0; j < retData.users.length; j++) {
               outp2 += ((retData.users[j][i].slice(0,1) == rec.status.slice(0,1))?'<td class="heading-success">':'<td>')+retData.users[j][i]+'</td>';
               // calculate
               points[j] += (retData.users[j][i].slice(0,1) == rec.status.slice(0,1))?((retData.users[j][i].endsWith('*'))?2:1):0;
            }
            outp2 += '</tr>';
         });
         outp += '</table>';
         document.getElementById("standingsArea").innerHTML = outp;
         // check title where icon stores whether pane should be open or closed
         collapseIconAction('standingsArea');

         outp2 += '</table>';
         document.getElementById("picksArea").innerHTML = outp2;
         collapseIconAction('picksArea');

         outp = '<table class="table table-condensed"><tr>';
         outp2 = '<tr>';
         // go through active users
         $.each(retData.users, function(i, rec){
            outp += '<th>'+bafusers[rec.user]+'</th>';
            outp2 += '<td>'+points[i]+'</td>';
         });
         outp += '<tr>'+outp2+'</tr></table>';
         document.getElementById("ouProjection").innerHTML = outp;
         collapseIconAction('ouProjection');
      })
   	.catch(retData => modalAlert(retData.type, retData.message));
   }
}

$('#ouYear').on('change', function(e){
   getOverunder();
});

function ouSignup() {
   postOptions.body = JSON.stringify({
      'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
      'season': $('#ouYear').val()
   });
   fetch('/api/getousignup', postOptions)
   .then(res => res.json())
   .then(retData => {
      var outp;
      // first populate users
      outp = '<table><tr>';
      $.each(retData.users, function(i, rec){
         if (i%3 === 0)
            outp += '</tr><tr>';
         outp += '<td class="cellgutter">'+rec.user+'</td>';
      });
      outp += '</tr></table>';
      document.getElementById("ouList").innerHTML = outp;
      // next fill choices in if already signed up
      if(retData.choices) {
         $('#ouBtn').text('Save');
         outp = '<table class="table table-condensed"><tr><th>Team</th><th>Line</th><th class="center">Choice</th><th>B</th></tr>';
         $.each(retData.choices, function(i, rec){
            outp += '<tr class="lg"><td>'+rec.team.slice(0,6)+'</td><td>'+rec.line+'</td><td><form><label class="radio-inline"><input type="radio" name="pickRadio'+i+'" value="0" checked>Over</input></label><label class="radio-inline"><input type="radio" name="pickRadio'+i+'" value="1" >Under</input></label></form></td><td><input class="bonusCheck" name="bonusCheck'+i+'"type="checkbox" value="'+i+'" ></input></td></tr>';
         });
         document.getElementById('ouChoices').innerHTML = outp;
         // set all radio buttons as user picked
         $.each(retData.choices, function(i, rec){
            if (rec.pick) {
               $('input[name=pickRadio'+i+'][value='+((rec.pick.slice(0,1) == 'O')?0:1)+']').prop("checked",true);
               if (rec.pick.slice(-1) == '*') {
                  $('input[name=bonusCheck'+i+']').prop("checked",true);
               }
            }
         });
      }
   })
   .catch(retData => modalAlert(retData.type, retData.message));
}

$('#ouBtn').on('click', function(e){
   if ($('#ouBtn').text() == 'Join') {
      postOptions.body = JSON.stringify({
         'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
         'season': $('#ouYear').val()
      });
      fetch('/api/ousignup', postOptions)
      .then(res => res.json())
      .then(retData => {
         ouSignup();
         modalAlert(retData.type,retData.message);
      })
   	.catch(retData => modalAlert(retData.type,retData.message));
   } else {
      if ($('.bonusCheck:checked').length > 3) {
         modalAlert('danger', 'More than 3 bonus checkboxes are chosen.  Please correct.');
      } else {
         var choices = {}, choices2 = [];
         // read choices to send
         for (var i = 0; i < 32; i++) {
            choices[i] = ($('input[name=pickRadio'+i+']:checked').val()==1)?'U':'O';
            // choices2[i] = ($('input[name=pickRadio'+i+']:checked').val()==1)?'U':'O';
            if ($('input[name=bonusCheck'+i+']').prop('checked')) {
               choices[i] += '*';
               // choices2[i] += '*';
            }
         }
         postOptions.body = JSON.stringify({
            'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
            'season': $('#ouYear').val(),
            'choices': JSON.stringify(choices)
         });
         fetch('/api/setouchoices', postOptions)
         .then(res => res.json())
         .then(retData => modalAlert(retData.type,retData.message))
         .catch(retData => modalAlert(retData.type,retData.message));
      }
   }
});
