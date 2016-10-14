// "use strict";

// prepopulate modal items with data from database
$('#betModal').on('show.bs.modal', function (event) {
   var vs1, vs2, odds, gameDb, button = $(event.relatedTarget);
   $('#oddsMod').removeClass('nodisplay');  // display just in case turned off

   if (button.data('sport') == 'nfl')
      gameDb = window.nflDb;
   else
      gameDb = window.nbaDb;

   // odds database in certain order, need to order bet elements so that user
   // choice is first before sent
   if (button.data('team') == 1) {
      vs1 = gameDb[button.data('game')].team1;
      vs2 = gameDb[button.data('game')].team2;
      if (button.data('type') == 'spread')
         odds = gameDb[button.data('game')].spread;
      else {
         odds = gameDb[button.data('game')].over;
         $('#oddsMod').addClass('nodisplay');   //spread bets can have modifier, over/under can't
      }
   } else {
      vs1 = gameDb[button.data('game')].team2;
      vs2 = gameDb[button.data('game')].team1;
      if (button.data('type') == 'spread')
         odds = 0 - gameDb[button.data('game')].spread;  //odds are for 1st team, need to reverse when taking second
      else {
         odds = gameDb[button.data('game')].over;
         $('#oddsMod').addClass('nodisplay');
      }
   }

   // now ordered, prepopulate items
   $('#betTeam1').val(vs1);
   $('#betTeam2').val(vs2);
   // $('#betOdds').val(odds);
   $('#betChange').val(odds);
   $('#betSport').val(button.data('sport'));
   $('#betType').val(button.data('type'));
   $('#betGametime').val(button.data('gametime'));
   if (button.data('type') == 'spread')
      $('#betTitle').text('You want: '+vs1+' '+odds+' vs '+vs2);
   else
      $('#betTitle').text('You want: ' + ((button.data('team') == 1)?'Over ':'Under ') + odds);
});

$('#betSubmit').on('click', function() {
   $.ajax({
		type: 'POST',
		url: '/api/makebet',
		data: {
         'user2': $('#userList').val(),
		   'amount': $('#betAmount').val(),
		   'odds': Number($('#betChange').val()),
         'type': $('#betType').val(),
		   'team1': $('#betTeam1').val(),
         'team2': $('#betTeam2').val(),
         'sport': $('#betSport').val(),
         'gametime': $('#betGametime').val()
		},
		success:function(retData){
         alert(retData.type, retData.message);
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

$('#betSave').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/makebet',
		data: {
         'user2': $('#userList').val(),
		   'amount': $('#betAmount').val(),
		   'odds': Number($('#betChange').val()),
         'type': $('#betType').val(),
		   'team1': $('#betTeam1').val(),
         'team2': $('#betTeam2').val(),
         'sport': $('#betSport').val(),
         'gametime': $('#betGametime').val(),
         'later': 1  //flag for backend that bet isn't official yet
		},
		success:function(retData){
         alert(retData.type, retData.message);
         getBets(-1, 'savedBets', 'send');   //refresh page
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

//prepopulate previously saved bet modal
$('#savedModal').on('show.bs.modal', function (event) {
   var newodds, tmpDb, button=$(event.relatedTarget);

   $('#savedId').val(button.data('id'));

   if (button.data('type') == 'spread')
      $('#savedTitle').text('Bet is: '+button.data('team1')+' '+button.data('odds')+' vs '+button.data('team2'));
   else
      $('#savedTitle').text('Bet is: '+((button.data('type')=='over')?'Over ':'Under ')+button.data('odds'));

   if (button.data('sport') == 'nfl')
      tmpDb = window.nflDb;
   else
      tmpDb = window.nbaDb;

   //go through current odds database to see if odds have changed since saved
   $.each(tmpDb, function(i, rec){
         if (rec.team1 == button.data('team1')) {
            if (button.data('type') == 'spread')
               $('#savedNewOdds').val(rec.spread);
            else
               $('#savedNewOdds').val(rec.over);
            return false;
         } else if (rec.team2 == button.data('team1')){
            if (button.data('type') == 'spread')
               $('#savedNewOdds').val(0-Number(rec.spread));
            else
               $('#savedNewOdds').val(rec.over);
            return false;
         }
   });

   //notify current odds once found
   $('#oddsText').text('Current odds are: '+$('#savedNewOdds').val());
});

$('#savedSend').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/changebet',
		data: {
         'id': $('#savedId').val(),
         'status': 0,
         'newodds': $('#savedNewOdds').val()},
		success:function(retData){
         alert(retData.type, retData.message);
         getBets(-1, 'savedBets', 'send');   //refresh page
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

$('#savedDelete').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/changebet',
		data: {
         'id': $('#savedId').val(),
         'status': -1},
		success:function(retData){
         alert(retData.type, retData.message);
         getBets(-1, 'savedBets', 'send');
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

//bet modal has +/- to increment/decrement values
$('.btn-increment').on('click', function(event){
   event.preventDefault();
   if ($(this).val()=='1') {
      $(this).prev().val(Number($(this).prev().val())+0.5);
      $(this).prev().addClass('bg-danger');
   } else {
      $(this).next().val(Number($(this).next().val())-0.5);
      $(this).next().addClass('bg-danger');
   }
});

// handles collapse icon animation
$('.collapseIcon').on('click', function(event){
   $(this).toggleClass('open');
});

$('#rescindModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);

   $('#rescindId').val(button.data('id'));
});

$('#rescindSend').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/changebet',
		data: {
         'id': $('#rescindId').val(),
         'status': -1},
		success:function(retData){
         alert(retData.type, retData.message);
         showBets();
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});


//below displays 4 panels on bets page; each has it's own quirks so not so DRY
function showBets () {
   getBets(0, 'waitingYou', 'accept');
   getBets(1, 'waitingThem', 'rescind');
   getBets(2, 'acceptedBets');
   getBets(3, 'refusedBets');

   //next dislplay accepted bets of other for info sake
   // $('#otherBets').hide(); //hide div to display until sure something there
   $.ajax({
      type: 'POST',
      url: '/api/getbets',
      data: {
         "status": 2,
         "all": 1
      },
      success:function(retData){
         if(retData.length){
            // first need to create div since not present/overwritten in #acceptBets
            // var  otherBetsDiv = document.getElementById("acceptedBets").appendChild(document.createElement('div'));
            // otherBetsDiv.id = 'otherBets';
            // now go ahead and populate
            var numBets = [];
            var outp = '<table class="table table-condensed"><tr class="heading-danger">';
            outp += '<th colspan=3>Others</th></tr>';
            $.each(retData, function(i,rec){
               outp += '<tr><td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+' ('+rec.user1.slice(0,6)+')</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,6)+((rec.comment)?' <a href="#" data-toggle="popover" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment"></span></a>':'')+')'+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td></tr>';
                  if (!numBets[rec.user1])
                     numBets[rec.user1] = 0;
                  if (!numBets[rec.user2])
                     numBets[rec.user2] = 0;
                  numBets[rec.user1] += 1;
                  numBets[rec.user2] += 1;
            });
            outp += '</table>';
            $('#acceptedBets').append(outp);
            $('#acceptedBets').addClass('in');
            $('#acceptedBetsTitle span.collapseIcon').removeClass('hidden');
            $('[data-toggle="popover"]').popover();   //this is for comments that might be on bets
            // $('#otherBets').show();  //show display div
         }
      },
      error: function(retData){
         alert(retData.type, retData.message);
      }
   });
}

function getBets(status, target, addButton) {
   $.ajax({
      type: 'POST',
      url: '/api/getbets',
      data: {
         "status": status,
         "all": 0
      },
      success:function(retData){
         if(retData.length){
            $('#'+target).empty();
            var outp = '<table class="table table-condensed"><tr class="heading">';
            outp += '<th>You</th><th>Odds</th><th>Them</th><th>$</th>';
            if (addButton)   //this is for saved bets, add send button
               outp += '<th>Act</th>';
            $.each(retData, function(i,rec){
               outp +='</tr><tr>';
               outp += '<td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,6)+((rec.comment)?' <a href="#" data-toggle="popover" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment red"></span></a>':'')+')'+'</td><td>'+rec.amount+'</td>';
               if (addButton)
                  outp += '<td><button class="btn btn-sm '+((addButton=='rescind')?'btn-danger':'btn-success')+'" data-toggle="modal" data-target="#'+((addButton=='accept')?'actionModal':(addButton=='rescind')?'rescindModal':'savedModal')+'" data-id="'+rec._id+'" data-odds="'+rec.odds+'" data-team1="'+rec.team1+'" data-team2="'+rec.team2+'" data-type="'+rec.type+'" data-sport="'+rec.sport+'"><span class="glyphicon glyphicon-'+((addButton=='accept')?'hand-left':(addButton=='rescind')?'remove':'send')+'"></span></button></td>';
               outp += '</tr>';
            });
            outp += '</table>';
            $('#'+target).prepend(outp);
            if ($('#'+target+'Title').children().hasClass('open'))
               $('#'+target).addClass('in');
            $('#'+target+'Title span.collapseIcon').removeClass('hidden');
            $('[data-toggle="popover"]').popover();
         }
      },
      error: function(retData){
         alert(retData.type, retData.message);
      }
   });
}

//prepopulate action modal with bet id
$('#actionModal').on('show.bs.modal', function (event) {
   $('#actionId').val($(event.relatedTarget).data('id'));
   $('#actionComment').val('');
});

$('.actionAction').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/changebet',
		data: {
         'id': $('#actionId').val(),
         'status': $(this).val(),
         'comment': $('#actionComment').val()
      },
		success:function(retData){
         alert(retData.type, retData.message);
         showBets();
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

//toggle button to switch stat type
$('#statsType').on('click', function(){
   var parsed = $('#statsPeriod').text().split(' ');
   if ($('#statsType').text()=='Detail')
      $('#statsType').text('Summary');
   else
      $('#statsType').text('Detail');
   weeklyStats(Number(parsed[1]));
});

// back/forward button to get different scores
$('.statsInc').on('click', function(event){
   event.preventDefault();
   var parsed = $('#statsPeriod').text().split(' ');
   if (parsed[0]=='Week') {
      if ((Number(parsed[1]) > 1 && $(this).val()=='-1') || (Number(parsed[1]) < 21 && $(this).val()=='1'))
         weeklyStats(Number(parsed[1])+$(this).val()*1);
   } else {
      weeklyStats('nba', new Date(Number(new Date($('#statsDate').val()))+$(this).val()*(24*60*60*1000)));
   }
});

// Stats stuff
function weeklyStats(wk) {
   $.ajax({
		type: 'POST',
		url: '/api/weeklystats',
      data: {
         'week': wk
      }, //
		success:function(retData){
         $('#weeklyStats').empty();
         if(retData.length){
            var weeklyRecords = {},
               // initialize detail and summart output tables
               outp = '<table class="table table-condensed"><tr><th>Winner</th><th>Odds</th><th>Loser</th><th>$</th></tr>',
               outp2 = '<table class="table table-condensed"><tr><th>Who</th><th>Win</th><th>Loss</th><th>Push</th></tr>';
            $.each(retData, function(i,rec){
               outp += '<tr><td'+((rec.status != 6)?' class="heading-success">':'>')+((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/>':'<img class="icon" src="images/basketball.png"/>')+((rec.status == 5)?rec.team2.replace('@','')+' ('+rec.user2.slice(0,6):rec.team1.replace('@','')+' ('+rec.user1.slice(0,6))+')</td><td>'+((rec.status == 5)?((rec.odds<0)?Math.abs(rec.odds):-Math.abs(rec.odds)):rec.odds)+'</td><td'+((rec.status != 6)?' class="heading-danger">':'>')+((rec.status == 5)?rec.team1.replace('@','')+' ('+rec.user1.slice(0,6):rec.team2.replace('@','')+' ('+rec.user2.slice(0,6))+')</td><td>'+rec.amount+'</td></tr>';
               if ($('#weeklyStatsTitle').children().hasClass('open'))
                  $('#weeklyStats').addClass('in');
               $('#weeklyStatsTitle span.collapseIcon').removeClass('hidden');

               if (!weeklyRecords[rec.user1])
                  weeklyRecords[rec.user1] = {wins:0, losses:0, push: 0};
               if (!weeklyRecords[rec.user2])
                  weeklyRecords[rec.user2] = {wins:0, losses:0, push: 0};
               switch  (rec.status) {
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
            outp += '</table>';
            // build Summary table
            for (var player in weeklyRecords) {
               outp2 += '<tr><td>'+player.slice(0,6)+'</td><td>'+weeklyRecords[player].wins+'</td><td>'+weeklyRecords[player].losses+'</td><td>'+weeklyRecords[player].push+'</td></tr>';
            }
            outp2 += '</table>';
            // check whether Detail or Summary screen
            if ($('#statsType').text() == 'Detail')
               document.getElementById('weeklyStats').innerHTML = outp;
            else
               document.getElementById('weeklyStats').innerHTML = outp2;
            if ($('#weeklyStatsTitle').hasClass('open'))
               $('#weeklyStatsTitle').addClass('in');
            $('#weeklyStatsTitle span.collapseIcon').removeClass('hidden');
         }
         $('#statsPeriod').text('Week '+ wk);
      },
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

// switch overall stats
$('#statsSport').change('click', function(){
      overallStats();
});

$('#statsYear').change('click', function(){
      overallStats();
});

// get overall stats and graph
function overallStats() {
   $.ajax({
		type: 'POST',
		url: '/api/overallstats',
      data: {
         'sport': $('#statsSport').val().toLowerCase(),
         'year': $('#statsYear').val()
      },
		success:function(retData){
			var outp = '<table class="table"><tr><th>Who</th><th>Win</th><th>Loss</th><th>Push</th><th>%</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr><td><a href="#" data-toggle="modal" data-target="#statsModal" data-user="'+rec.user+'" >'+rec.user.slice(0,6)+'</a></td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.push+'</td><td>'+rec.pct.toPrecision(3).slice(1,5)+'</td></tr>';
            $('#overallStatsTitle span.collapseIcon').removeClass('hidden');
			});
			outp += '</table>';
			document.getElementById("overallStats").innerHTML = outp;
         drawChart(0);
		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

// change chart period - currently unused
$('#graphDays').on('click', function(){
   event.preventDefault();
   if ($('#graphDays').text() == '30days') {
         $('#graphDays').text('60days');
         drawChart(60, 1);
   } else if ($('#graphDays').text() == '60days') {
      $('#graphDays').text('Season');
      drawChart(90, 1);
   } else {
      $('#graphDays').text('30days');
      drawChart(30, 1);
   }
});

// below uses ChartJS library
function drawChart(days, update) {
   var ctx = document.getElementById("winGraph").getContext("2d"),
      colors = ["blue", "red", "white", "green", "yellow", "purple", "orange", "gray"],
      chartData = {
         labels: [],
         datasets: []
      };

   Chart.defaults.global.defaultFontColor = '#fff';
   Chart.defaults.global.elements.line.tension = 0.2;
   Chart.defaults.global.elements.line.borderWidth = 2;
   Chart.defaults.global.elements.line.fill = false;

   $.ajax({
      type: 'POST',
      url: '/api/graphstats',
      data: {
         user: 'ALL',
         days: days,
         sport: $('#statsSport').val().toLowerCase(),
         year: $('#statsYear').val()
      },
      success: function(retData){
         chartData.labels = retData.xaxis;
         $.each(retData.datasets, function(index, user){
            var obj = {
               label: user.name,
               borderColor: colors[index],
               data: user.data
            };
            chartData.datasets.push(obj);
         });
         if (update) {
            winChart.data.labels = chartData.labels;
            winChart.data.datasets = chartData.datasets;
            winChart.update();
         } else {
            winChart = new Chart(ctx, {
               type: 'line',
               data: chartData,
               //  options: chartOptions
            });
            winChart.options.scales.yAxes[0].gridLines.color = '#444';
            winChart.options.legend.position = 'bottom';
         }
      },
		error: function(retData){
         alert(retData.type, retData.message);
		}
   });
}

function getUserStats (user, sport, year) {
   return $.ajax({
   	type: 'POST',
   	url: '/api/userstats',
      data: {
         user: user,
         sport: sport,
         year: year
      }
   });
}

//modal to show stats for each user of every bet in database for them
$('#statsModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);
   $('#statsTitle').text('Stats history for: '+button.data('user'));
   getUserStats(button.data('user'), $('#statsSport').val().toLowerCase(), $('#statsYear').val()).success(function(retData) {
   	var outp = '<table class="table"><tr><th>Date</th><th>Me</th><th>Them</th><th>W/L</th></tr>';
   	$.each(retData, function(i,rec){
         var date=new Date(rec.date);
   		outp += '<tr><td>'+(date.getMonth()+1)+'/'+date.getDate()+'</a></td><td>';
         if (rec.user1 == button.data('user'))
            outp += ((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team1.replace('@','')+'</td><td>'+rec.team2.replace('@','')+' ('+rec.user2.slice(0,6)+')</td><td>'+((rec.status==4)?'W':((rec.status==5)?'L':'P'));
         else
            outp += ((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team2.replace('@','')+'</td><td>'+rec.team1.replace('@','')+' ('+rec.user1.slice(0,6)+')</td><td>'+((rec.status==5)?'W':((rec.status==4)?'L':'P'));
         outp += '</td></tr>';
   	});
   	outp += '</table>';
   	document.getElementById("statsHistory").innerHTML = outp;
   }).error(function(retData){
			alert(retData.type, retData.message);
	});
});

$('#futureModal').on('show.bs.modal', function (event) {
   var button = $(event.relatedTarget);
   $('#futureText').text(((button.data('side') == 'give')?'* You will give: ':'* You will take: ') + button.data('odds')/100 + '/1 odds that "' + button.data('team') + '" will '+((button.data('side') == 'give')?'not':'')+' win "' + button.data('future')+'"');
   $('#futureSide').val(button.data('side'));
   $('#futureOdds').val(button.data('odds'));
   $('#futureTeam').val(button.data('team'));
   $('#futureFuture').val(button.data('future'));
});

$('#futureSubmit').on('click', function() {
   $.ajax({
		type: 'POST',
		url: '/api/makebet',
		data: {
		   'amount': 2,
         'type': ($('#futureSide').val() == 'give')?'give':'take',
		   'odds': $('#futureOdds').val(),
         'user2': '',
         'timeout': $('#futureTimeout').val(),
		   'team1': $('#futureTeam').val(),
         'team2': $('#futureFuture').val(),
         'sport': 'nba'
		},
		success:function(retData){
         alert(retData.type, retData.message);
         getFutures();
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

$('#futureRescindSubmit').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/changebet',
		data: {
         'id': $('#futureRescindId').val(),
         'status': -1},
		success:function(retData){
         alert(retData.type, retData.message);
         getFutures();
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

$('#futureOfferSubmit').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/api/changebet',
		data: {
         'id': $('#futureActId').val(),
         'status': 2,
         'future': true
      },
		success:function(retData){
         alert(retData.type, retData.message);
         getFutures();
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

$('#futuresOffers').delegate('.futureOffer', 'click', function(event) {
   // var button = $(event.relatedTarget);
   if($(this).data('user') == username){
      $('#futureRescindId').val($(this).data('id'));
      $('#futureRescindModal').modal('show');
   } else {
      $('#futureActId').val($(this).data('id'));
      $('#futureActModal').modal('show');
   }
});

function getFutures() {
   // first see if there are any existing offers
   $.ajax({
		type: 'POST',
		url: '/api/getfutureoffers',
      data: {
         status: 0
      },
      success:function(retData){
         username = retData.sessionId; // being returned so buttons can be customized
         var outp = '<table class="table table-condensed">';
         $.each(retData.offers, function(i,rec){
            outp += '<tr><td>'+rec.user1+((rec.type == 'give')?' will give ':' will take ')+rec.odds/100+'/1 odds that '+rec.team1+((rec.type == 'give')?' don\'t win ':' win ')+rec.team2+'</td><td><button class="btn btn-sm futureOffer '+((rec.user1 == username)?'btn-danger':'btn-success')+'" data-user="'+rec.user1+'" data-id="'+rec._id+'"><span class="glyphicon glyphicon-'+((rec.user1 == username)?'remove':'ok')+'"></span></button></td></tr>';
            $('#futuresOffers').addClass('in');
            $('#futuresOffersTitle span.collapseIcon').removeClass('hidden');
         });
         outp += '</table>';
         document.getElementById('futuresOffers').innerHTML = outp;
      },
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
   // next check if there are any futures propostions
   $.ajax({
		type: 'GET',
		url: '/api/getfutures',
      success:function(retData){
         $('#futuresGroup').empty();
         $.each(retData.futures, function(i,single){
            // create new/separate panel for each future
            var newPanel = '<div class="panel panel-info"><div class="panel-heading"><span id="futuresTitle'+i+'"></span><a data-toggle="collapse" href="#futuresPanel'+i+'"><span class="collapseIcon open glyphicon glyphicon-chevron-right"></span></a><em class="right">updated: '+retData.futures[i].time+'</em></div><div id="futuresPanel'+i+'" class="panel-collapse collapse in"></div></div>';
            // create new table for panel contents
            var outp = '<table class="table table-condensed"><tr><th>Team</th><th>Odds</th><th colspan=2 class="center">Offer Action</th></tr>';
            $.each(single.entries, function(i,rec){
               outp += '<tr><td>'+rec.team+'</td><td>'+rec.ml/100+' / 1 </td><td><button class="btn btn-primary"  data-toggle="modal" data-target="#futureModal" data-side="give" data-odds="'+rec.ml+'" data-team="'+rec.team+'" data-future="'+single.event+'">Give</button></td><td><button class="btn btn-primary" data-toggle="modal" data-target="#futureModal" data-side="take" data-odds="'+rec.ml+'" data-team="'+rec.team+'" data-future="'+single.event+'">Take</button></td></tr>';
            });
            $('#futuresGroup').append(newPanel);
            document.getElementById('futuresPanel'+i).innerHTML = outp;
            $('#futuresTitle'+i).text(single.event);
            if (new Date('2016/'+retData.futures[i].time) < new Date(new Date().valueOf()-5*24*60*60*1000))
               $('#futuresTitle'+i).next().next().addClass('heading-danger');
         });
      },
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
   // lastly get accepted future offers
   $.ajax({
      type: 'POST',
      url: '/api/getfutureoffers',
      data: {
         status: 2
      },
      success:function(retData){
         username = retData.sessionId; // being returned so buttons can be customized
         var outp = '<table class="table table-condensed">';
         $.each(retData.offers, function(i,rec){
            outp += '<tr><td>'+rec.user1+((rec.type == 'give')?' gave ':' took ')+rec.odds/100+'/1 odds that '+rec.team1+((rec.user2 == 'give')?' don\'t win ':' win ')+rec.team2+' to '+rec.user2+'</td></tr>';
            $('#futuresAccepted').addClass('in');
            $('#futuresAcceptedTitle span.collapseIcon').removeClass('hidden');
         });
         outp += '</table>';
         document.getElementById('futuresAccepted').innerHTML = outp;
      },
      error: function(retData){
         alert(retData.type, retData.message);
      }
   });
}

// Scores stuff
//toggle button to switch sport in scores page
$('#scoresSport').on('click', function(){
      if ($('#scoresSport').text()=='NFL'){
         $('#scoresSport').text('NBA');
         $('#scoresSport').removeClass('btn-warning').addClass('btn-info');
         showScores('nba', new Date());
      } else {
         $('#scoresSport').text('NFL');
         $('#scoresSport').removeClass('btn-info').addClass('btn-warning');
         showScores('nfl', getWeek(new Date()));
      }
});

function showScores(sport, period) {
   $.ajax({
		type: 'POST',
		url: '/api/getscores',
      data: {
         'sport': sport,
         'year': ((period>17)?2017:2016), //too specific to football, needs to fixed
         'period': period
      },
		success:function(retData){
         if (sport=='nfl')
            $('#scoresPeriod').text('Week '+period);
         else
            $('#scoresPeriod').text(monthName[period.getMonth()]+' '+period.getDate());
			var outp = '<table class="table"><tr><th>Away</th><th>Score</th><th>Home</th><th>Score</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr><td>'+rec.team1+'</td><td>'+rec.score1+'</td><td>'+rec.team2+'</td><td>'+rec.score2+'</td></tr>';
			});
			outp += '</table>';
			document.getElementById("scoresArea").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

// back/forward button to get different scores
$('.scoresInc').on('click', function(event){
   event.preventDefault();
   var tmp = $('#scoresPeriod').text().split(' ');
   if (tmp[0]=='Week') {
      if ((Number(tmp[1]) > 1 && $(this).val()=='-1') || (Number(tmp[1]) < 21 && $(this).val()=='1'))
         showScores('nfl', Number(tmp[1])+$(this).val()*1);
   } else {
      showScores('nba', new Date(Number(new Date($('#scoresDate').val()))+$(this).val()*(24*60*60*1000)));
   }
});

// Messageboard stuff
$('#msgSubmit').on('click', function(e){
      e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/api/postmessage',
   		data: {
            'message': $('#msgInput').val()
         },
   		success:function(retData){
            $('#msgInput').val('');
            showMessages();   //refresh page
   		},
   		error: function(retData){
            alert(retData.type, retData.message);
   		}
   	});
});

function showMessages() {
   $.ajax({
		type: 'GET',
		url: '/api/msgboard',
		success:function(retData){
         var date, outp='';
			$.each(retData, function(i,rec){
            date = new Date(rec.date);
				outp += '<span class="msg-user">'+rec.user.slice(0,6)+'</span>: '+rec.message+'  <span class="msg-date text-primary">('+(date.getMonth()+1)+'/'+date.getDate()+' - '+date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+')</span><br/>';
			});
			document.getElementById("msgList").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

$('#propSubmit').on('click', function(e){
      // e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/api/postprop',
   		data: {
            'user2': $('#propUser2').val(),
            'amount': $('#propAmount').val(),
            'prop': $('#propProp').val()
         },
   		success:function(retData){
            showProps();   //refresh page
   		},
   		error: function(retData){
            alert(retData.type, retData.message);
   		}
   	});
});

// Prop bet stuff
function showProps() {
   $.ajax({
		type: 'GET',
		url: '/api/getprops',
		success:function(retData){
         var outp = '<table class="table"><tr><th>Who</th><th>Who</th><th>Prop</th><th>$</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr>'+((rec.winner)?(rec.winner == 1)?'<td class="heading-success">':'<td class="heading-danger">':'<td>')+rec.user1.slice(0,5)+'</td>'+((rec.winner)?(rec.winner == 1)?'<td class="heading-danger">':'<td class="heading-success">':'<td>')+rec.user2.slice(0,5)+'</td><td>'+rec.prop+'</td><td>'+rec.amount+'</td></tr>';
			});
			outp += '</table>';
			document.getElementById("propList").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

// Update status of special over/under wager these guys have
// function showStandings() {
//    $.ajax({
// 		type: 'GET',
// 		url: '/api/getstandings',
// 		success:function(retData){
//          var outp,
//          eric = 0,
//          john = 0,
//          russell = 0,
//          aaron = 0;
//          outp = '<table class="table table-condensed"><tr><th>Team</th><th>W</th><th>L</th><th>Prj</th><th>Line</th><th>O/U</th></tr>';
//
// 			$.each(retData, function(i,rec){
// 				outp += '<tr><td>'+rec.team.replace(' ','').slice(0,3)+'</td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.projection.toPrecision(3)+'</td><td>'+rec.line+'</td>'+((Math.abs(rec.line-rec.projection)<3)?'<td class="heading-danger">':'<td>')+((rec.status == 'Over')?'O':'U')+'</td></tr>';
//
//             eric += (rec.eric.slice(0,1) == rec.status.slice(0,1))?((rec.eric.endsWith('*'))?2:1):0;
//             john += (rec.john.slice(0,1) == rec.status.slice(0,1))?((rec.john.endsWith('*'))?2:1):0;
//             russell += (rec.russell.slice(0,1) == rec.status.slice(0,1))?((rec.russell.endsWith('*'))?2:1):0;
//             aaron += (rec.aaron.slice(0,1) == rec.status.slice(0,1))?((rec.aaron.endsWith('*'))?2:1):0;
// 			});
// 			outp += '</table>';
// 			document.getElementById("standingsArea").innerHTML = outp;
//          outp = '<table class="table table-condensed"><tr><th>John</th><th>Eric</th><th>Russell</th><th>Aaron</th></tr>';
//          outp += '<tr><td>'+john+'</td><td>'+eric+'</td><td>'+russell+'</td><td>'+aaron+'</td></tr></table>';
//          document.getElementById("ouPicks").innerHTML = outp;
// 		},
// 		error: function(retData){
// 			alert(retData.type, retData.message);
// 		}
// 	});
// }

// Preferences stuff
$('#prefSave').on('click', function(e){
      e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/api/setprefs',
         data: {
            'sms': $('#changeSMS').val(),
            'pref_include_everyone': $('#prefIncludeEveryone').is(":checked"),
            'pref_text_receive': $('#prefTextReceive').is(":checked"),
            'pref_text_accept': $('#prefTextAccept').is(":checked")
         },
   		success:function(retData){
            alert(retData.type,retData.message);
   		},
   		error: function(retData){
            alert(retData.type,retData.message);
   		}
   	});
});

function getPrefs() {
   $.ajax({
		type: 'GET',
		url: '/api/getprefs',
		success:function(retData){
         $('#username').text('Preferences for '+retData._id);
         $('#changeSMS').val(retData.sms);
         $('#prefIncludeEveryone').prop('checked', retData.pref_include_everyone);
         $('#prefTextReceive').prop('checked', retData.pref_text_receive);
         $('#prefTextAccept').prop('checked', retData.pref_text_accept);
         $('#changeSlack').val(retData.slack);
      },
      error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

$('#changePasswordModal').on('show.bs.modal', function (event) {
   $('#changePassword').val(''); // clear
   $('#changePassword2').val('');
});

$('#changeSubmit').on('click', function() {
   //check password match first
   if($('#changePassword').val() && ($('#changePassword').val() == $('#changePassword2').val())) {
      $.ajax({
         type: 'POST',
         url: '/setprefs',
         data: {
            'password': $('#changePassword').val()
         },
         success:function(retData){
            alert(retData.type,retData.message);
         },
         error: function(retData){
            alert(retData.type,retData.message);
         }
      });
   } else {
      alert('danger', "Passwords don't match, please try again");
   }
});

// in Debts modal, for paid buttons click
$('#oweyou').on('click', '.paidBtn', function(){
   // var losses = $('#debtHolder').data('losses');
   // for(var loss in losses) {
   //    if (losses[loss].user2 == $(this).data('user2')) {
   //       alert('success', 'found a debt to same person', true);
   //    }
   // }
   var id = $(this).data('id');
   $('#alertOk').on('click', function(){  // attach event to OK button to update debt
      $(this).off('click');               // needed so won't be repeated on other button presses
      $.ajax({
         type: 'POST',
         url: '/api/setpaid',
         data: {
            'id': id
         },
         success:function(retData){
            $('#debtsModal').modal('show');
         },
         error: function(retData){
            alert(retData.type, retData.message);
         }
      });
   });
   alert('', 'Dismiss debt?', true);      // confirm modal
});

//modal to show stats for each user of every bet in database for them
$('#debtsModal').on('show.bs.modal', function (event) {
   $.ajax({
		type: 'GET',
		url: '/api/getdebts',
		success:function(retData){
         // $('#debtHolder').data('losses', '');
         // var losses = [];
         // var loss = {};
         $('#oweyou tr').each(function (index){
            if (index > 1)
               $(this).remove();
         });
         $('#youowe tr').each(function (index){
            if (index > 1)
               $(this).remove();
         });
         $('#oweyou').hide();       // hide just in case no needed
         $('#youowe').hide();
			$.each(retData, function(i,rec){
            var date=new Date(rec.date);
            var outp = '<tr><td>'+(date.getMonth()+1)+'/'+date.getDate()+'</a></td><td>'+((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team1.replace('@','')+'/'+rec.team2.replace('@','')+'</td><td>'+rec.user2.slice(0,6)+'</td><td>'+((rec.status==4)?'<button class="btn btn-sm btn-success paidBtn" data-dismiss="modal" data-toggle="modal" data-id="'+rec._id+'" data-user2="'+rec.user2+'"><span class="glyphicon glyphicon-usd"></span></button>':'')+'</td></tr>';
            if (rec.status == 4) {
               $('#oweyou tr:last').after(outp);
               $('#oweyou').show();
            } else {
               $('#youowe tr:last').after(outp);
               $('#youowe').show();
            }
            // if (rec.status==5) {
            //    loss.id = rec._id;
            //    loss.user2 = rec.user2;
            //    losses.push(loss);
			});
         // $('#debtHolder').data('losses', losses);
		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
});

// Global stuff
$('#loginSubmit').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/admin/login',
		data: {
         'username': $('#loginUsername').val(),
         'password': $('#loginPassword').val()
		},
		success:function(retData){
         if (retData.type == 'success'){
            // username = $('#loginUsername').val();
            getUsers();
         }
         alert(retData.type, retData.message);
         doorBell();
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
});

$('#registerSubmit').on('click', function(){
   if (!$('#registerSMS').val() || !$('#registerUsername').val()) {
      alert('danger', 'You have not completed all the fields');
      $('#registerModal').modal('show');
   } else if($('#registerPassword').val() && ($('#registerPassword').val() == $('#registerPassword2').val())) {
      $.ajax({
         type: 'POST',
         url: '/admin/register',
         data: {
            'username': $('#registerUsername').val(),
            'sms': $('#registerSMS').val(),
            'password': $('#registerPassword').val()
         },
         success:function(retData){
            if (retData.type == 'success') {
               getUsers();
            }
            alert(retData.type, retData.message);
         },
         error: function(retData){
            alert(retData.type, retData.message);
         }
      });
   } else {
      alert('danger', "Passwords don't match, please try again");
   }
});

// below is for swiping action on touchscreens
function getUrlPos(url){
   var position;
   for (var i=0; i<urls.length; i++){
      if (url == urls[i]) {
         position = i;
         break;
      }
   }
   return position;
}

$(document).on('swipeleft', function(event){
   // $("#wrapper").css('margin-left', '-360px');
   window.location.href = urls[(getUrlPos(window.location.pathname)+1)%urls.length];
});

$(document).on('swiperight', function(event){
   // $("#wrapper").css('margin-left', '360px');
   window.location.href = urls[(getUrlPos(window.location.pathname)-1 < 0)?urls.length-1:getUrlPos(window.location.pathname)-1];
});

// class used by sidebar page selection to close
$('.toggleSidebar').on('click', function() {
   $('#wrapper').toggleClass('toggled');
});

// multi use alert modal
function alert(type, message, pause){
   $('#alertBody').removeClass();
   $('#alertBody').addClass('modal-content').addClass('modal-'+type);
   $('#alertText').text(message);
   $('#alertModal').modal('toggle');
   if (!pause) {
      setTimeout(function(){
         $('#alertModal').modal('hide');
      }, 2000);
   } else {
      $('#alertOk').removeClass('nodisplay');
      $('#alertCancel').removeClass('nodisplay');
   }
}

// Startup stuff
function getUsers (){
	$.ajax({
		type: 'GET',
		url: '/api/users',
		success:function(retData){
         window.userList = [];
         $('#userList').empty();
			$.each(retData, function(i,user){
				$('#userList').append('<option value="'+user._id+'">'+user._id+'</option>');
            $('#propUser2').append('<option value="'+user._id+'">'+user._id+'</option>');
            window.userList.push(user._id);
			});
         $('#userList').append('<option value="EVERYONE">EVERYONE</option>');
         $('#userList').append('<option value="EVERYONE2">EVERYONE - 1st to act</option>');
		},
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

// called when new page loaded
function doorBell(){
	$.ajax({
		type: 'GET',
		url: '/api/doorbell',
		success:function(retData){
         if(retData.type == 'command'){
            eval(retData.message);
         } else if (retData.type == 'message'){  // bets waiting; too lazy to clean up css
            // username = retData.username; // keep around for things
            if (retData.bets) {
               $('#notify1').addClass('glyphicon-flag').css('color', '#ee5f5b').css('font-size','24px').css('margin','10px');
            }
            if (retData.debts) {
               $('#notify2').addClass('glyphicon-usd').css('color', '#62c462').css('font-size','24px').css('margin','10px');
            }
            if (retData.msgboard) {
               $('#notify3').addClass('glyphicon-bullhorn').css('color', '#6BC6E1').css('font-size','24px').css('margin','10px');
            }
         }
      },
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

function getWeek(date){
   var wk = 1,
      dst=0,
      seasonStart = new Date(2016,8,7),
      nflWeeks = [];
   for (var i=0; i<23; i++){
      if (i > 7)
         dst = 3600000;
      nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+dst));
   }
   if (date > nflWeeks[0]) {
      for (i=0; i<21; i++){
         if (date > nflWeeks[i] && date < nflWeeks[i+1]) {
            wk = i+1;
            break;
         }
      }
   }
   return wk;
}

function getOdds (sport){
	$.ajax({
		type: 'GET',
		url: '/api/'+sport+'odds',
		// data: reqString,
		dataType: 'json',
      success:function(retData){
         var sportColor, prevDate=1, gameNum=0, listCount=8;
         var outp = '<table class="table">';
         if (sport == 'nfl') {
            window.nflDb = retData.games;
            $('#nflWeek').text(' NFL Week '+retData.week+' ');
            sportColor = 'warning';
         } else {
            window.nbaDb = retData.games;
            sportColor = 'info';
         }
         $.each(retData.games, function(i,rec){
            var checkDisabled = '', btnColor1, btnColor2, date = new Date(rec.date);

            // gray out and disable if game already started
            if (date > new Date()) {
               btnColor1 = sportColor;
               btnColor2 = 'primary';
            } else {
               checkDisabled = 'disabled ';
               btnColor1 = 'default';
               btnColor2 = 'default';
            }

            if (gameNum%listCount === 0 && gameNum/listCount > 0) {
               outp += '</table>';
               document.getElementById(sport+'Odds'+gameNum/listCount).innerHTML = outp;
               outp = '<table class="table">';
            }
            // draw date row if needed
            var tmpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            if (tmpDate > prevDate)
               outp += '<tr class="modal-primary"><td colspan=3 class="center  odds-date-row">'+dayName[date.getDay()]+' '+monthName[date.getMonth()]+' '+date.getDate()+'</td></tr>';
            outp += '<tr><td class="td-odds">'+rec.team1+'<br/><button type="button" '+checkDisabled+'class="btn btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'">'+rec.spread+'</button></td><td class="td-odds td-middle">'+((date.getHours()>12)?(date.getHours()-12):date.getHours())+':'+('0'+date.getMinutes()).slice(-2)+((date.getHours()>11)?'pm':'am')+'<br/><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+rec.over+'</button><button '+checkDisabled+'class="btn btn-'+btnColor2+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+rec.over+'</button></td><td class="td-odds">'+rec.team2+'<br/><button '+checkDisabled+'class="btn btn-'+btnColor1+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'">'+(0-rec.spread)+'</button></td></tr>';
            prevDate = tmpDate;
            gameNum++;
         });
         outp += '</table>';
         document.getElementById(sport+'Odds'+Math.ceil(gameNum/listCount)).innerHTML = outp;
         $('#'+sport+'Timestamp').text('updated:'+retData.time);
      },
		error: function(retData){
		}
	});
}

$(document).ready(function() {
   // if(window.location.search.substring == 2) {
   //    $("#wrapper").css('margin-left', '-360px');
   // }
   // $("#wrapper").css('margin-left', '0px');
   doorBell();
   test();
});

function test() {
   var list = [{
         team1: 'ATL',
         team2: 'NO',
         odds: 3
      },{
         team1: 'BAL',
         team2: 'PIT',
         odds: 1
      },{
         team1: 'NE',
         team2: 'MIA',
         odds: -7
      }
   ];
   var outp = '<table class="table">'
   $.each(list, function(i, rec){
      outp += '<tr><td><button class="btn logoBtn">';
      outp += '<table class="bg-warning"><tr><td rowspan="2"><img class="logo-md" src="images/nfl_logo_sprite_medium.png"></td><td>'+rec.team1+'</td></tr><tr><td>'+rec.odds+'</td></tr></table>';
      outp += '</button></td><td><button class="btn logoBtn">';
      outp += '<table class="bg-warning"><tr><td>'+rec.team2+'</td><td rowspan="2"><img class="logo-md" src="images/nfl_logo_sprite_medium.png"></td></tr><tr><td>'+rec.odds+'</td></tr></table>';
   });
   outp += '</table>';
   $('#displayArea').prepend(outp);
   
   // $('img.logo-md').css('object-position', '0px -150px');//teamInfo.ATL.sprite);
}
var username,
   urls = [
   '/',
   '/bets',
   '/stats',
   '/scores',
   '/futures',
   '/props',
   '/messageboard',
   '/options'
   ], // used for swiping between pages
   winChart, // declared global so that charts can be updated between functions
   monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   teamInfo = {
      ATL:{
         color: '#A71930',
         sprite: '0px 0px'
      },
      ARZ: {
         color: '#97233F',
         sprite: '-35px -0px'
      },
      CAR: {
         color: '#0085CA',
         sprite: '-70px -0px'
      },
      CHI: {
         color: '#0B162A',
         sprite: '-105px -0px'
      },
      DAL: {
         color: '#002244',
         sprite: '-140px -0px'
      },
      DET: {
         color: '#005A8B',
         sprite: '-175px -0px'
      },
      GB: {
         color: '#203731',
         sprite: '-25px 0px'
      },
      MIN: {
         color: '#4F2683',
         sprite: '-35px -25px'
      },
      NO: {
         color: '#9F8958',
         sprite: '-70px -25px'
      },
      NYG: {
         color: '#0B2265',
         sprite: '-105px -25px'
      },
      PHI: {
         color: '#004953',
         sprite: '-140px -25px'
      },
      SEA: {
         color: '#69BE28',
         sprite: '-175px -25px'
      },
      SF: {
         color: '#AA0000',
         sprite: '-0px -50px'
      },
      LAR: {
         color: '#B3995D',
         sprite: '-35px -50px'
      },
      TB: {
         color: '#D50A0A',
         sprite: '-70px -50px'
      },
      WAS: {
         color: '#773141',
         sprite: '-105px -50px'
      },
      BAL: {
         color: '#241773',
         sprite: '-140px -50px'
      },
      BUF: {
         color: '#00338D',
         sprite: '-175px -50px'
      },
      CIN: {
         color: '#FB4F14',
         sprite: '-0px -75px',
      },
      CLE: {
         color: '#FB4F14',
         sprite: '-35px -75px',
      },
      DEN: {
         color: '#FB4F14',
         sprite: '-70px -75px',
      },
      HOU: {
         color: '#03202F',
         sprite: '-105px -75px',
      },
      KC: {
         color: '#E31837',
         sprite: '-140px -75px',
      },
      JAC: {
         color: '#006778',
         sprite: '-175px -75px',
      },
      IND: {
         color: '#002C5F',
         sprite: '-0px -100px',
      },
      MIA: {
         color: '#008E97',
         sprite: '-35px -100px',
      },
      NE: {
         color: '#002244',
         sprite: '-70px -100px',
      },
      NYJ: {
         color: '#203731',
         sprite: '-105px -100px',
      },
      OAK: {
         color: '#A5ACAF',
         sprite: '-140px -100px',
      },
      PIT: {
         color: '#FFB612',
         sprite: '-175px -100px',
      },
      SD: {
         color: '#0073CF',
         sprite: '-0px -125px',
      },
      TEN: {
         color: '#4B92DB',
         sprite: '-35px -125px',
      }
   };
