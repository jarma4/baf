// Update status of special over/under wager these guys have
function getOverunder() {
   if(!inSeason[($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa'] && $('#ouYear').val() == new Date().getFullYear()){
      $('.signup').removeClass('hidden');
      $('.active').addClass('hidden');
      ouSignup();
   } else {
      $('.active').removeClass('hidden');
      $('.signup').addClass('hidden');
      $.ajax({
   		type: 'POST',
   		url: '/api/getstandings',
         data: {
            'sport': ($('#sportNfl').hasClass('selected'))?'nfl':'nba',
            'season': $('#ouYear').val()
         },
   		success:function(retData){
            var points = [],
               outp = '<table class="table table-condensed"><tr><th>Team</th><th>W</th><th>L</th><th>Prj</th><th>Line</th><th>O/U</th><th>Need</th></tr>',
               outp2 = '<table class="table table-condensed"><tr><th>Team</th>';
            // create columns for each user
            $.each(retData.users, function(i, rec){
               outp2 += '<th>'+bafusers[rec.user]+'</th>';
               points[i] = 0; // initialize for all users, used for projections
            });
            outp2 += '<tr>';
            // go through teams and populate tables
            $.each(retData.standings, function(i, rec){
               // populate standings area
               outp += '<tr><td>'+rec.team.replace(' ','').slice(0,5)+'</td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.projection.toPrecision(3)+'</td><td>'+rec.line+'</td>'+((Math.abs(rec.line-rec.projection)<1.5)?'<td class="heading-danger">':'<td>')+((rec.status == 'Over')?'O':'U')+'</td><td>'+((rec.line-rec.win<1)?'met':Math.ceil(rec.line-rec.win)+'/'+(($('#sportNfl').hasClass('selected'))?16:82-rec.win-rec.loss))+'</td></tr>';
               // populate picks area
               outp2 += '<tr><td>'+rec.team.replace(' ','').slice(0,5)+'</td>';
               for (var j = 0; j < retData.users.length; j++) {
                  outp2 += '<td>'+retData.users[j][i]+'</td>';
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
   		},
   		error: function(retData){
   			modalAlert(retData.type, retData.message);
   		}
   	});
   }
}

$('#ouYear').on('change', function(e){
   getOverunder();
});

function ouSignup() {
   $.ajax({
		type: 'POST',
		url: '/api/getousignup',
      data: {
         'sport': ($('#sportNfl').hasClass('selected'))?'nfl':'nba',
         'season': $('#ouYear').val()
      },
		success:function(retData){
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
      },
      error: function(retData){
			modalAlert(retData.type, retData.message);
		}
	});
}
$('#ouBtn').on('click', function(e){
   if ($('#ouBtn').text() == 'Join') {
      $.ajax({
   		type: 'POST',
   		url: '/api/ousignup',
         data: {
            'sport': ($('#sportNfl').hasClass('selected'))?'nfl':'nba',
            'season': 2017
         },
   		success:function(retData){
            ouSignup();
            modalAlert(retData.type,retData.message);
   		},
   		error: function(retData){
            modalAlert(retData.type,retData.message);
   		}
   	});
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
         $.ajax({
            type: 'POST',
            url: '/api/setouchoices',
            data: {
               'sport': ($('#sportNfl').hasClass('selected'))?'nfl':'nba',
               'season': 2017,
               'choices': JSON.stringify(choices)
            },
            success:function(retData){
               modalAlert(retData.type,retData.message);
            },
            error: function(retData){
               modalAlert(retData.type, retData.message);
            }
         });
      }
   }
});
