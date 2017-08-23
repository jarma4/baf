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
            getBets(($('#sportNfl').hasClass('selected'))?10:($('#sportNba').hasClass('selected'))?11:12,'watchBets', 'watch');
            break;
         case '/stats':
            getStats();
            break;
         case '/scores':
            showScores(($('#sportNfl').hasClass('selected'))?getWeek(new Date(), 'nfl'):new Date());
            break;
         case '/overunder':
            getOverunder();
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

function collapseIconAction(target) {
   if ($('#'+target+'Title').children().hasClass('open'))
      $('#'+target).addClass('in'); //actually opens/uncollapses pane
   $('#'+target+'Title span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
}

// handles collapse icon animation
$('.collapseIcon').on('click', function(event){
   $(this).toggleClass('open');
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

// since .comment class is not in html(added by js), need to attach to higher id
$('#page-content-wrapper').on('click', '.comment', function(event){
    var that = $(this);
    that.popover('show');
    setTimeout(function(){
        that.popover('hide');
    }, 3000);
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
         season: $('#statsYear').val()
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

function addAnimation(name, duration, target) {
   // $('#'+target).addClass(name);
   setInterval(function(){
      $('#'+target).addClass(name);
      setTimeout(function(){
         $('#'+target).removeClass(name);
      }, 1200);
   }, duration);

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
               $('#notify1').removeClass('hidden');
               addAnimation('bounce', 15000, 'notify1');
            }
            if (retData.debts) {
               $('#notify2').removeClass('hidden');
            }
            if (retData.futures) {
               $('#notify3').removeClass('hidden');
            }
            if (retData.props) {
               $('#notify4').removeClass('hidden');
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
         }
      },
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

function getWeek(date, sport){
   var dayTicks = 24 * 60 * 60 * 1000,
      week = Math.ceil((date - ((sport=='nba')?seasonStart.nba:(sport=='nfl')?seasonStart.nfl:seasonStart.ncaa)) / dayTicks / 7);
   if (week < 0) {
      return 1;
   } else {
      return week;
   }
}

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
         var sportColor, prevDate=1, gameNum=0, listCount=9;
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
   dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   bafusers = {'jarma4': 'TJ', 'KRELL': 'EK', 'aaron': 'AW', 'Serg': 'SC', 'Jmcgeady': 'JM', 'russell': 'RR', 'firdavs': 'FP'},
   seasonStart = {
         nfl: new Date(2017,8,7),
         nba: new Date(2017,9,20),
         ncaa: new Date(2017,2,16)
      },
   inSeason = {
      nfl: 1,
      nba: 0,
      ncaa: 0
   };
