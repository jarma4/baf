// "use strict";

function toggleSport(sport) {
   if (sport == 'nba') {
      $('#sportNba').addClass('selected');
      $('#sportNfl').removeClass('selected');
      $('#sportNcaa').removeClass('selected');
      document.cookie = 'sport=nba;max-age=43200';
   } else if (sport == 'nfl'){
      $('#sportNfl').addClass('selected');
      $('#sportNba').removeClass('selected');
      $('#sportNcaa').removeClass('selected');
      document.cookie = 'sport=nfl;max-age=43200';
   } else {
      $('#sportNcaa').addClass('selected');
      $('#sportNfl').removeClass('selected');
      $('#sportNba').removeClass('selected');
      document.cookie = 'sport=ncaa;max-age=43200';
   }
}

$('.sportPick').on('click', function(){
   if (!$(this).hasClass('selected') && !$(this).hasClass('dimmed')) {
      if ($(this).is($('#sportNfl')))
         toggleSport('nfl');
      else if ($(this).is($('#sportNba')))
         toggleSport('nba');
      else
         toggleSport('ncaa');
      // according to what page you're on, refresh data
      switch (window.location.pathname) {
         case '/':
            getOdds();
            getBets(($('#sportNfl').hasClass('selected'))?10:11,'watchBets', 'watch');
            break;
         case '/stats':
            getStats();
            break;
         case '/scores':
            showScores(($('#sportNfl').hasClass('selected'))?getWeek(new Date()):new Date());
            break;
      }
   }
});

function postApi(page, obj) {
   $.ajax({
		type: 'POST',
		url: '/api/'+page,
		data: obj,
		success:function(retData){
         alert(retData.type, retData.message);
		},
		error: function(retData){
         alert(retData.type, retData.message);
		}
	});
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
      else
         odds = window.oddsDb[button.data('game')].over;
   } else {
      vs1 = window.oddsDb[button.data('game')].team2;
      vs2 = window.oddsDb[button.data('game')].team1;
      if (button.data('type') == 'spread')
         odds = 0 - window.oddsDb[button.data('game')].spread;  //odds are for 1st team, need to reverse when taking second
      else
         odds = window.oddsDb[button.data('game')].over;
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
   else
      $('#betTitle').text('You want: ' + ((button.data('team') == 1)?'Over ':'Under ') + odds);
   resetOddsWatch();
});

$('#betSubmit').on('click', function(event) {
   postApi('makebet', {
         'user2': ($('#oddsWatch').is(":checked"))?'':$('#userList').val(),
		   'amount': $('#betAmount').val(),
		   'odds': Number(($('#oddsWatch').is(":checked"))?$('#betOddsNew').val():$('#betOdds').val()),
         'type': $('#betType').val(),
		   'team1': $('#betTeam1').val(),
         'team2': $('#betTeam2').val(),
         'sport': $('#betSport').val(),
         'gametime': $('#betGametime').val(),
         'serial': Math.random(),
         'watch': $('#oddsWatch').is(":checked")
		});
   });

function resetOddsWatch(){
   $('#betUserlist').removeClass('nodisplay');
   $('#oddsMod').addClass('nodisplay');
   $('#betSubmit').text('Send Bet');
   $('#oddsWatch').prop('checked', false);
}

// change bet modal according to checkbox
$('#oddsWatch').on('click', function(event) {
   $('#oddsMod').toggleClass('nodisplay');
   $('#betUserlist').toggleClass('nodisplay');
   if($('#betSubmit').text() == 'Send Bet')
      $('#betSubmit').text('Save Odds Watch');
   else
      $('#betSubmit').text('Send Bet');
});

//prepopulate previously watch bet modal
$('#watchModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);

   $('#watchId').val(button.data('id'));
   $('#watchOddsNew').val(button.data('odds'));
   $('#watchDeactivated').prop('checked', button.data('deactivated'));
   $('#watchTitle').text('Watch for: '+button.data('team1')+' '+button.data('odds')+' vs '+button.data('team2'));
});

$('#watchDelete').on('click', function(){
   postApi('changebet',{
         'id': $('#watchId').val(),
         'action': 'delete'});
   getBets(($('#sportNfl').hasClass('selected'))?10:11, 'watchBets', 'watch');
});

$('#watchModify').on('click', function(){
   postApi('changebet',{
   		'action': 'change',
         'id': $('#watchId').val(),
         'odds': $('#watchOddsNew').val()});
         // 'status': ($('#sportNfl').hasClass('dropped'))?-1:-2});
   getBets(($('#sportNfl').hasClass('selected'))?10:11, 'watchBets', 'watch');
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
   postApi('changebet', {
         'id': $('#rescindId').val(),
         'action': 'delete'});
   getBets(1, 'waitingThem', 'rescind');
});

// since .comment class is not in html(added by js), need to attach to higher id
$('#page-content-wrapper').on('click', '.comment', function(event){
    var that = $(this);
    that.popover('show');
    setTimeout(function(){
        that.popover('hide');
    }, 3000);
});

//below displays 4 panels on bets page
function showBets () {
   getBets(2, 'acceptedBets');
   getBets(0, 'waitingYou', 'accept');
   getBets(1, 'waitingThem', 'rescind');
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
            // first need to create div if not present/overwritten in #acceptBets
            if ($('#otherBets').length) {
               $('$otherBets').empty();
            } else {
               var  otherBetsDiv = document.getElementById("acceptedBets").appendChild(document.createElement('div'));
               otherBetsDiv.id = 'otherBets';
            }
            // now go ahead and populate
            // $('#acceptedBets').empty();
            var numBets = [];
            var outp = '<table class="table table-condensed"><tr class="heading-danger">';
            outp += '<th colspan=3>Others</th></tr>';
            $.each(retData, function(i,rec){
               outp += '<tr><td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+' ('+rec.user1.slice(0,6)+')</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,6)+((rec.comment)?' <a class="comment" href="#" data-toggle="popover" data-trigger="manual" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment"></span></a>':'')+')'+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td></tr>';
                  if (!numBets[rec.user1])
                     numBets[rec.user1] = 0;
                  if (!numBets[rec.user2])
                     numBets[rec.user2] = 0;
                  numBets[rec.user1] += 1;
                  numBets[rec.user2] += 1;
            });
            outp += '</table>';
            $('#otherBets').append(outp);
            // check title where icon stores whether pane should be open or closed
            if ($('#acceptedBetsTitle span.collapseIcon').hasClass('hidden')) {
               $('#acceptedBetsTitle').addClass('open'); //actually opens/uncollapses pane
               $('#acceptedBets').addClass('in'); //actually opens/uncollapses pane
               $('#acceptedBetsTitle span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
               // $('[data-toggle="popover"]').popover();
            }
            // $('#otherBets').addClass('in');
            // $('#acceptedBetsTitle span.collapseIcon').removeClass('hidden');
            // $('[data-toggle="popover"]').popover();   //this is for comments that might be on bets
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
         $('#'+target).empty();
         if(retData.length){
            var outp = '<table class="table table-condensed"><tr class="heading">';
            outp += '<th>You</th><th>Odds</th><th>Them</th>';
            if (addButton)
               outp += '<th>Edit</th>';
            $.each(retData, function(i,rec){
               outp +='</tr><tr>';
               outp += '<td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,6)+((rec.comment)?' <a class="comment" href="#" data-toggle="popover" data-trigger="manual" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment red"></span></a>':'')+')'+'</td>';
               if (addButton)
                  outp += '<td><button class="btn btn-sm '+((addButton=='rescind')?'btn-danger':'btn-success')+'" data-toggle="modal" data-target="#'+((addButton=='accept')?'actionModal':(addButton=='rescind')?'rescindModal':'watchModal')+'" data-id="'+rec._id+'" data-odds="'+rec.odds+'" data-team1="'+rec.team1+'" data-team2="'+rec.team2+'" data-type="'+rec.type+'" data-sport="'+rec.sport+'" data-deactivated="'+((rec.watch==2)?true:false)+'"><span class="glyphicon glyphicon-'+((addButton=='rescind')?'remove':'hand-left')+'"></span></button></td>';
               outp += '</tr>';
            });
            outp += '</table>';
            $('#'+target).prepend(outp);
            // check title where icon stores whether pane should be open or closed
            if ($('#'+target+'Title').children().hasClass('open'))
               $('#'+target).addClass('in'); //actually opens/uncollapses pane
            $('#'+target+'Title span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
            // $('[data-toggle="popover"]').popover();
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
   postApi('changebet', {
      'action': ($(this).val() == 2)?'accepted':'refused',
      'id': $('#actionId').val(),
      'status': $(this).val(),   // button will have value of 2 or 3
      'comment': $('#actionComment').val()
      });
   showBets();
});

// back/forward button to get different scores
$('.statsInc').on('click', function(event){
   event.preventDefault();
   var parsed = $('#statsPeriod').text().split(' ');
   if (parsed[0]=='Week') {
      if ((Number(parsed[1]) > 1 && $(this).val()=='-1') || (Number(parsed[1]) < 23 && $(this).val()=='1'))
         weeklyStats(Number(parsed[1])+$(this).val()*1);
   } else {
      weeklyStats(new Date(Number(new Date($('#statsDate').val()))+$(this).val()*(24*60*60*1000)));
   }
});

function getStats() {
   var sport = document.cookie.split('=')[1];
   if (!sport)
      sport = ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa';
   toggleSport(sport);
   weeklyStats(getWeek(new Date(), sport));
   overallStats();
   drawChart(0);
}
// Stats stuff
function weeklyStats(date) {
   $.ajax({
		type: 'POST',
		url: '/api/weeklystats',
      data: {
         'date': date,
         'sport': ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa'
      },
		success:function(retData){
         $('#weeklyStats').empty();
         $('#statsPeriod').text('Week '+ date);
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
            if ($('#weeklyStatsTitle').children().hasClass('open'))
               $('#weeklyStats').addClass('in');
            $('#weeklyStatsTitle span.collapseIcon').removeClass('hidden');
         }
      },
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

$('#statsYear').on('click', function(){
   if ($('#statsYear').text()=='2016') {
      $('#statsYear').text('2015');
   } else {
      $('#statsYear').text('2016');
   }
   overallStats();
});

// get overall stats and graph
function overallStats() {
   $.ajax({
		type: 'POST',
		url: '/api/overallstats',
      data: {
         'sport': ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa',
         'season': $('#statsYear').text()
      },
		success:function(retData){
			var outp = '<table class="table"><tr><th>Who</th><th>Win</th><th>Loss</th><th>Push</th><th>%</th></tr>';
			$.each(retData, function(i,rec){
            if (rec.pct){
	            outp += '<tr><td><a href="#" data-toggle="modal" data-target="#statsModal" data-user="'+rec.user+'" >'+rec.user.slice(0,6)+'</a></td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.push+'</td><td>'+rec.pct.toPrecision(3).slice(1,5)+'</td></tr>';
               $('#overallStatsTitle span.collapseIcon').removeClass('hidden');
            }
			});
			outp += '</table>';
			document.getElementById("overallStats").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

function getUserStats (user, sport, season, week) {
   return $.ajax({
   	type: 'POST',
   	url: '/api/userstats',
      data: {
         user: user,
         sport: sport,
         season: season,
         week: week
      }
   });
}

//modal to show stats for each user of every bet in database for them
$('#statsModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);
   $('#statsTitle').text('Stats history for: '+button.data('user'));
   getUserStats(button.data('user'), ($('#sportNfl').hasClass('selected'))?'nfl':'nba', $('#statsYear').text(),(button.data('week'))?button.data('week'):'').success(function(retData) {
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

// change chart period - currently unused
$('#graphDays').on('click', function(event){
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
      colors = ["blue", "red", "white", "green", "yellow", "purple", "orange", "gray", "teal"],
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
         sport: ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa',
         season: $('#statsYear').text()
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

$('#futureModal').on('show.bs.modal', function (event) {
   var button = $(event.relatedTarget);
   $('#futureText').text(((button.data('side') == 'give')?'* You will give: ':'* You will take: ') + button.data('odds')/100 + '/1 odds that "' + button.data('team') + '" will '+((button.data('side') == 'give')?'not':'')+' win "' + button.data('future')+'"');
   $('#futureSide').val(button.data('side'));
   $('#futureOdds').val(button.data('odds'));
   $('#futureTeam').val(button.data('team'));
   $('#futureFuture').val(button.data('future'));
});

$('#futureSubmit').on('click', function() {
   postApi('makebet', {
		   'amount': 2,
         'type': ($('#futureSide').val() == 'give')?'give':'take',
		   'odds': $('#futureOdds').val(),
         'user2': '',
         'timeout': $('#futureTimeout').val(),
		   'team1': $('#futureTeam').val(),
         'team2': $('#futureFuture').val(),
         'sport': 'nba'
		});
   getFutures();
});

$('#futureRescindSubmit').on('click', function(){
   postApi('changebet', {
         'id': $('#futureRescindId').val(),
         'status': -1});
   getFutures();
});

$('#futureOfferSubmit').on('click', function(){
   postApi('changebet', {
         'id': $('#futureActId').val(),
         'status': 2,
         'future': true
      });
   getFutures();
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
            if (new Date('2017/'+retData.futures[i].time) < new Date(new Date().valueOf()-5*24*60*60*1000))
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
            outp += '<tr><td>'+rec.user1+((rec.type == 'give')?' gave ':' took ')+rec.odds/100+'/1 odds that '+rec.team1+((rec.user2 == 'give')?' doesn\'t win ':' win ')+rec.team2+' to '+rec.user2+'</td></tr>';
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

function showScores(period) {
   var sport = document.cookie.split('=')[1];
   if (sport !== 'nba' && sport !== 'nfl')
      sport = ($('#sportNfl').hasClass('selected'))?'nfl':'nba';
   if (sport == 'nba' && $('#sportNfl').hasClass('selected'))
      period = new Date();
   toggleSport(sport);
   $.ajax({
		type: 'POST',
		url: '/api/getscores',
      data: {
         'sport': sport,
         'season': 2016, //too specific to football, needs to fixed
         'period': period
      },
		success:function(retData){
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
      if ((Number(tmp[1]) > 1 && $(this).val()=='-1') || (Number(tmp[1]) < 24 && $(this).val()=='1'))
         showScores(Number(tmp[1])+$(this).val()*1);
   } else {
      showScores(new Date(Number(new Date($('#scoresPeriod').text()+' 2017'))+$(this).val()*(24*60*60*1000)));
   }
});

$('#propAcceptModal').on('show.bs.modal', function (event) {
   var button = $(event.relatedTarget);
   $('#propAcceptText').text('* Proposition: '+button.data('prop'));
   $('#propAcceptId').val(button.data('id'));
});

$('#propAcceptSubmit').on('click', function() {
   postApi('acceptprop', {
         'id': $('#propAcceptId').val()
		});
   showProps();
});

$('#propSubmit').on('click', function(e){
   postApi('postprop', {
            'user2': $('#propUser2').val(),
            'amount': $('#propAmount').val(),
            'prop': $('#propProp').val()
         });
   showProps();   //refresh page
});

// Prop bet stuff
function showProps() {
   $.ajax({
		type: 'GET',
		url: '/api/getprops',
		success:function(retData){
         var outp = '<table class="table"><tr><th>Who</th><th>Who</th><th>Prop</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr>'+((rec.winner)?(rec.winner == 1)?'<td class="heading-success">':'<td class="heading-danger">':'<td>')+rec.user1.slice(0,5)+'</td>';
            outp += (rec.user2 == 'OPEN')?'<td><button class="btn btn-sm btn-success" data-toggle="modal" data-target="#propAcceptModal" data-id="'+rec._id+'" data-prop="'+rec.prop+'"><span class="glyphicon glyphicon-hand-left"></span></button>':((rec.winner)?(rec.winner == 1)?'<td class="heading-danger">':'<td class="heading-success">':'<td>')+rec.user2.slice(0,5);
            outp += '</td><td>'+rec.prop+'</td></tr>';
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
function showStandings() {
   $.ajax({
		type: 'GET',
		url: '/api/getstandings',
		success:function(retData){
         var eric = 0,
         john = 0,
         russell = 0,
         sergio = 0,
         tony = 0,
         aaron = 0,
         outp = '<table class="table table-condensed"><tr><th>Team</th><th>W</th><th>L</th><th>Prj</th><th>Line</th><th>O/U</th></tr>',
         outp2 = '<table class="table table-condensed"><tr><th>Team</th><th>EK</th><th>AW</th><th>JM</th><th>RR</th><th>TJ</th><th>SC</th></tr>';

			$.each(retData, function(i,rec){
            // populate standings area
				outp += '<tr><td>'+rec.team.replace(' ','').slice(0,5)+'</td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.projection.toPrecision(3)+'</td><td>'+rec.line+'</td>'+((Math.abs(rec.line-rec.projection)<3)?'<td class="heading-danger">':'<td>')+((rec.status == 'Over')?'O':'U')+'</td></tr>';
            // populate picks area
            outp2 += '<tr><td>'+rec.team.replace(' ','').slice(0,5)+'</td><td '+((rec.eric.slice(0,1)==rec.status.slice(0,1))?'class=heading-success>':'>')+rec.eric+'</td><td '+((rec.aaron.slice(0,1)==rec.status.slice(0,1))?'class=heading-success>':'>')+rec.aaron+'</td><td '+((rec.john.slice(0,1)==rec.status.slice(0,1))?'class=heading-success>':'>')+rec.john+'</td><td '+((rec.russell.slice(0,1)==rec.status.slice(0,1))?'class=heading-success>':'>')+rec.russell+'</td><td '+((rec.tony.slice(0,1)==rec.status.slice(0,1))?'class=heading-success>':'>')+rec.tony+'</td><td '+((rec.sergio.slice(0,1)==rec.status.slice(0,1))?'class=heading-success>':'>')+rec.sergio+'</td></tr>';
            // calculate points for picks
            eric += (rec.eric.slice(0,1) == rec.status.slice(0,1))?((rec.eric.endsWith('*'))?2:1):0;
            john += (rec.john.slice(0,1) == rec.status.slice(0,1))?((rec.john.endsWith('*'))?2:1):0;
            russell += (rec.russell.slice(0,1) == rec.status.slice(0,1))?((rec.russell.endsWith('*'))?2:1):0;
            aaron += (rec.aaron.slice(0,1) == rec.status.slice(0,1))?((rec.aaron.endsWith('*'))?2:1):0;
            tony += (rec.tony.slice(0,1) == rec.status.slice(0,1))?((rec.tony.endsWith('*'))?2:1):0;
            sergio += (rec.sergio.slice(0,1) == rec.status.slice(0,1))?((rec.sergio.endsWith('*'))?2:1):0;
			});
         outp += '</table>';
			document.getElementById("standingsArea").innerHTML = outp;
         if ($('#standingsAreaTitle span.collapseIcon').hasClass('hidden')) {
            $('#standingsAreaTitle').addClass('open'); //actually opens/uncollapses pane
            $('#standingsArea').addClass('in'); //actually opens/uncollapses pane
            $('#standingsAreaTitle span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
         }
         outp2 += '</table>';
			document.getElementById("picksArea").innerHTML = outp2;
         if ($('#picksAreaTitle span.collapseIcon').hasClass('hidden')) {
            $('#picksAreaTitle').addClass('open'); //actually opens/uncollapses pane
            $('#picksArea').addClass('in'); //actually opens/uncollapses pane
            $('#picksAreaTitle span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
         }
         // picks area
         outp = '<table class="table table-condensed"><tr><th>John</th><th>Eric</th><th>Russell</th></tr>';
         outp += '<tr><td>'+john+'</td><td>'+eric+'</td><td>'+russell+'</td></tr>';
         outp += '<tr><th>Aaron</th><th>Tony</th><th>Sergio</th></tr>';
         outp += '<tr><td>'+aaron+'</td><td>'+tony+'</td><td>'+sergio+'</td></tr></table>';
         document.getElementById("ouPicks").innerHTML = outp;
         if ($('#ouPicksTitle span.collapseIcon').hasClass('hidden')) {
            $('#ouPicksTitle').addClass('open'); //actually opens/uncollapses pane
            $('#ouPicks').addClass('in'); //actually opens/uncollapses pane
            $('#ouPicksTitle span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
         }

		},
		error: function(retData){
			alert(retData.type, retData.message);
		}
	});
}

// Preferences stuff
$('#prefSave').on('click', function(e){
      e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/api/setprefs',
         data: {
            'sms': $('#changeSMS').val(),
            'pref_nfl_everyone': $('#prefNflEveryone').is(":checked"),
            'pref_nba_everyone': $('#prefNbaEveryone').is(":checked"),
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
         $('#prefNflEveryone').prop('checked', retData.pref_nfl_everyone);
         $('#prefNbaEveryone').prop('checked', retData.pref_nba_everyone);
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
         url: '/api/setprefs',
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

$('#resolveBody').on('click', '.xxx', function(event){
   $.ajax({
      type: 'POST',
      url: '/api/resolvefinish',
      data: {
         'name': $(this).data('name'),
         'num': $(this).data('num')
      },
      success:function(retData){
         alert(retData.type,retData.message, 3000);
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
});

$('#resolveDebts').on('click', function(){
   $.ajax({
      type: 'GET',
      url: '/api/resolvedebts',
      success:function(retData){
         var outp='<table class="table"><tr><th>Who</th><th>#Bets</th><th>Dismiss?</th><tr>';
         if(retData.length){
            $.each(retData, function(i,rec){
               outp += '<tr><td>'+rec.name+'</td><td>'+rec.num+'</td><td><button class="xxx btn btn-sm btn-success" data-toggle="modal" data-dismiss="modal" data-name="'+rec.name+'" data-num="'+rec.num+'"><span class="glyphicon glyphicon-ok"></span></button></td></tr>';
            });
            outp += '</table>';
         // } else {
         //    outp = 'You don\'t seem to have any debts in common with anyone';
         }
         document.getElementById("resolveBody").innerHTML = outp;
         $('#resolveModal').modal('show');
      },
      error: function(retData){
         alert(retData.type, retData.message);
      }
   });
});

// in Debts modal, for paid buttons click
$('#oweyou').on('click', '.paidBtn', function(){
   var id = $(this).data('id');
   $('#alertOk').on('click', function(){  // attach event to OK button to update debt
      $(this).off('click');               // needed so won't be repeated on other button presses
      $.ajax({
         type: 'POST',
         url: '/api/debtpaid',
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
   alert('', 'Dismiss debt?', null, true);      // confirm modal
});

//modal to show stats for each user of every bet in database for them
$('#debtsModal').on('show.bs.modal', function (event) {
   $.ajax({
		type: 'GET',
		url: '/api/getdebts',
		success:function(retData){
         $('#debtHolder').data('losses', '');
         var losses = [];
         var loss = {};
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
            if (rec.status==5) {
               loss.id = rec._id;
               loss.user2 = rec.user2;
               losses.push(loss);
            }
			});
         $('#debtHolder').data('losses', losses);
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

// $('#registerSubmit').on('click', function(){
//    if (!$('#registerSMS').val() || !$('#registerUsername').val()) {
//       alert('danger', 'You have not completed all the fields');
//       $('#registerModal').modal('show');
//    } else if($('#registerPassword').val() && ($('#registerPassword').val() == $('#registerPassword2').val())) {
//       $.ajax({
//          type: 'POST',
//          url: '/admin/register',
//          data: {
//             'username': $('#registerUsername').val(),
//             'sms': $('#registerSMS').val(),
//             'password': $('#registerPassword').val()
//          },
//          success:function(retData){
//             if (retData.type == 'success') {
//                getUsers();
//             }
//             alert(retData.type, retData.message);
//          },
//          error: function(retData){
//             alert(retData.type, retData.message);
//          }
//       });
//    } else {
//       alert('danger', "Passwords don't match, please try again");
//    }
// });

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
function alert(type, message, duration, pause){
   $('#alertBody').removeClass();
   $('#alertBody').addClass('modal-content').addClass('modal-'+type);
   $('#alertText').text(message);
   $('#alertModal').modal('toggle');
   if (!pause) {
      setTimeout(function(){
         $('#alertModal').modal('hide');
      }, duration || 2000);
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
         $('#propUser2').empty().append('<option value="OPEN">OPEN</option>');
			$.each(retData, function(i,user){
				$('#userList').append('<option value="'+user._id+'">'+user._id+'</option>');
            $('#propUser2').append('<option value="'+user._id+'">'+user._id+'</option>');
            window.userList.push(user._id);
			});
         $('#userList').append('<option value="EVERYONE">EVERYONE</option>');
         $('#userList').append('<option value="EVERYONE2">EVERYONE - 1st to act</option>');
         $('#userList option[value="EVERYONE"]').attr("selected", "selected");
         // $('#propUser2').prepend('<option value="OPEN">OPEN</option>');
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
               $('#notify1').addClass('glyphicon-flag').addClass('text-danger');
            }
            if (retData.debts) {
               $('#notify2').addClass('glyphicon-usd').addClass('text-success');
            }
            if (retData.nfl) {
               $('#sportNfl').removeClass('hidden');
            }
            if (retData.nba) {
               $('#sportNba').removeClass('hidden');
            }
            if (retData.ncaa) {
                  $('#sportNcaa').removeClass('hidden');
            }
            if (retData.futures) {
               $('#notify3').addClass('glyphicon-time').addClass('text-info');
            }
         }
      },
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

function getWeek(date, sport){
   var seasonStart = {
         nfl: new Date(2016,8,7),
         nba: new Date(2016,9,20),
         ncaa: new Date(2017,2,16)
      },
      dayTicks = 24 * 60 * 60 * 1000;
   return Math.ceil((date - ((sport=='nba')?seasonStart.nba:(sport=='nfl')?seasonStart.nfl:seasonStart.ncaa)) / dayTicks / 7);
}

function getOdds (){
   var sport = document.cookie.split('=')[1];
   if (!sport)
      sport = ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa';
   toggleSport(sport);
	$.ajax({
		type: 'GET',
		url: '/api/'+sport+'odds',
		// data: reqString,
		dataType: 'json',
      success:function(retData){
         var sportColor, prevDate=1, gameNum=0, listCount=8;
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

$(document).ready(function() {
   // if(window.location.search.substring == 2) {
   //    $("#wrapper").css('margin-left', '-360px');
   // }
   // $("#wrapper").css('margin-left', '0px');
   doorBell();
});

//global variables
var username,

   urls = [
   '/',
   '/bets',
   '/stats',
   '/scores',
   '/futures',
   '/overunder',
   '/props',
   // '/messageboard',
   '/options'
   ], // used for swiping between pages
   winChart, // declared global so that charts can be updated between functions
   monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function spritePosition (sport, team) {
   var width = 56, height = 40, cols = 6, index,
      nfl_teams = ['NFL', 'ARI', 'CAR', 'CHI', 'DAL', 'DET', 'GB', 'MIN', 'NO', 'NYG','PHI','SEA','SF','LAR', 'TB', 'WAS', 'BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'KC', 'JAC', 'IND', 'MIA', 'NE', 'NYJ', 'OAK', 'PIT', 'SD', 'TEN', 'ATL'];
      nba_teams = ['NBA', 'BOS', 'BKN', 'CHR', 'CLE', 'DAL', 'DET', 'IND', 'LAC', 'LAL','MIA','NOH','NY','OKC', 'ORL', 'PHI', 'PHO', 'SAC', 'TOR', 'UTA', 'WAS', 'ATL', 'CHI', 'DEN', 'GS', 'HOU', 'MEM', 'MIL', 'MIN', 'POR', 'SAN'];
   if (sport == 'nfl')
      index = nfl_teams.indexOf(team);
   else
      index = nba_teams.indexOf(team);
   if (index < 0)
      index = 0;
   return index%cols*width*-1+'px '+Math.floor(index/cols)*height*-1+'px';
}

   // teamInfo = {
   //    ATL:{
   //       color: '#A71930',
   //    ARZ: {
   //       color: '#97233F',
   //    CAR: {
   //       color: '#0085CA',
   //    },
   //    CHI: {
   //       color: '#0B162A',
   //    },
   //    DAL: {
   //       color: '#002244',
   //    },
   //    DET: {
   //       color: '#005A8B',
   //    },
   //    GB: {
   //       color: '#203731',
   //    },
   //    MIN: {
   //       color: '#4F2683',
   //    },
   //    NO: {
   //       color: '#9F8958',
   //    },
   //    NYG: {
   //       color: '#0B2265',
   //    },
   //    PHI: {
   //       color: '#004953',
   //    },
   //    SEA: {
   //       color: '#69BE28',
   //    },
   //    SF: {
   //       color: '#AA0000',
   //    },
   //    LAR: {
   //       color: '#B3995D',
   //    },
   //    TB: {
   //       color: '#D50A0A',
   //    },
   //    WAS: {
   //       color: '#773141',
   //    },
   //    BAL: {
   //       color: '#241773',
   //    },
   //    BUF: {
   //       color: '#00338D',
   //    },
   //    CIN: {
   //       color: '#FB4F14',
   //    },
   //    CLE: {
   //       color: '#FB4F14',
   //    },
   //    DEN: {
   //       color: '#FB4F14',
   //    },
   //    HOU: {
   //       color: '#03202F',
   //    },
   //    KC: {
   //       color: '#E31837',
   //    },
   //    JAC: {
   //       color: '#006778',
   //    },
   //    IND: {
   //       color: '#002C5F',
   //    },
   //    MIA: {
   //       color: '#008E97',
   //    },
   //    NE: {
   //       color: '#002244',
   //    },
   //    NYJ: {
   //       color: '#203731',
   //    },
   //    OAK: {
   //       color: '#A5ACAF',
   //    },
   //    PIT: {
   //       color: '#FFB612',
   //    },
   //    SD: {
   //       color: '#0073CF',
   //    },
   //    TEN: {
   //       color: '#4B92DB',
   //    }
   // };
