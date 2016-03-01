$('#betModal').on('show.bs.modal', function (event) {
   var vs1, vs2, odds, gameDb, button = $(event.relatedTarget);
   $('#oddsMod').removeClass('nodisplay');  // display just in case turned off
   if (button.data('sport') == 'nfl')
      gameDb = nflDb;
   else
      gameDb = nbaDb;
   if (button.data('team') == 1) {
      vs1 = gameDb[button.data('game')].team1;
      vs2 = gameDb[button.data('game')].team2;
      if (button.data('type') == 'spread')
         odds = gameDb[button.data('game')].spread;
      else {
         odds = gameDb[button.data('game')].over;
         $('#oddsMod').addClass('nodisplay');
      }
   } else {
      vs1 = gameDb[button.data('game')].team2;
      vs2 = gameDb[button.data('game')].team1;
      if (button.data('type') == 'spread')
         odds = 0 - gameDb[button.data('game')].spread;
      else {
         odds = gameDb[button.data('game')].over;
         $('#oddsMod').addClass('nodisplay');
      }
   }

   $('#betTeam1').val(vs1);
   $('#betTeam2').val(vs2);
   $('#betOdds').val(odds);
   $('#betSport').val(button.data('sport'));
   $('#betType').val(button.data('type'));
   $('#betGametime').val(button.data('gametime'));
   if (button.data('type') == 'spread')
      $('#betTitle').text('Bet is: '+vs1+' '+odds+' vs '+vs2);
   else
      $('#betTitle').text('Bet is: ' + ((button.data('team') == 1)?'Over ':'Under ') + odds);
});

$('#betSubmit').on('click', function() {
   $.ajax({
		type: 'POST',
		url: '/makebet',
		data: {'user2': $('#userList').val(),
		   'amount': $('#betAmount').val(),
		   'odds': Number($('#betOdds').val())+Number($('#betChange').val()),
         'type': $('#betType').val(),
		   'team1': $('#betTeam1').val(),
         'team2': $('#betTeam2').val(),
         'sport': $('#betSport').val(),
         'gametime': $('#betGametime').val()
		},
		success:function(retData){
         alert(retData.type,retData.message);
		},
		error: function(retData){
         alert(retData.type,retData.message);
		}
	});
});

$('#betSave').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/makebet',
		data: {'user2': $('#userList').val(),
		   'amount': $('#betAmount').val(),
		   'odds': Number($('#betOdds').val())+Number($('#betChange').val()),
         'type': $('#betType').val(),
		   'team1': $('#betTeam1').val(),
         'team2': $('#betTeam2').val(),
         'sport': $('#betSport').val(),
         'gametime': $('#betGametime').val(),
         'later': 1
		},
		success:function(retData){
         alert(retData.type,retData.message);
		},
		error: function(retData){
         alert(retData.type,retData.message);
		}
	});
});

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
   $('#oddsText').text('Current odds are: '+$('#savedNewOdds').val());
});

$('#savedSend').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/changebet',
		data: {'id': $('#savedId').val(),
         'status': 0,
         'newodds': $('#savedNewOdds').val()},
		success:function(retData){
         alert(retData.type,retData.message);
         getBets(-1,'savedBets',1);
		},
		error: function(retData){
         alert(retData.type,retData.message);
		}
	});
});

$('#savedDelete').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/changebet',
		data: {'id': $('#savedId').val(),
         'status': -1},
		success:function(retData){
         alert(retData.type,retData.message);
         getBets(-1,'savedBets',1);
		},
		error: function(retData){
         alert(retData.type,retData.message);
		}
	});
});

$('.btn-increment').on('click', function(event){
   event.preventDefault();
   if ($(this).val()=='1')
      $(this).prev().val(Number($(this).prev().val())+0.5);
   else
      $(this).next().val(Number($(this).next().val())-0.5);
});

function showBets () {
   $('#waitingYou').hide();
   $.ajax({
      type: 'POST',
      url: '/getbets',
      data: {'status': 0,
            'all': 0},
      success:function(retData){
         if(retData.length){
            var outp = '<table class="table table-condensed"><tr><th>You</th><th>Odds</th><th>Them</th><th>$</th><th>Act</th></tr>';
            $.each(retData, function(i,rec){
               if (rec.status == 1) {
                  outp += '<tr><td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,5)+')</td><td>'+rec.amount+'</td><td><button class="btn btn-sm btn-success" data-toggle="modal" data-target="#actionModal" data-id="'+rec._id+'"><span class="glyphicon glyphicon-usd"></span></button></td></tr>';
               $('#waitingYou').show();
               }
            });
            outp += '</table>';
            document.getElementById("waitingYou").innerHTML = outp;
         }
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
   $('#waitingThem').hide();
   $.ajax({
      type: 'POST',
      url: '/getbets',
      data: {'status': 0,
            'all':0},
      success:function(retData){
         if(retData.length){
            var outp = '<table class="table table-condensed"><tr><th>You</th><th>Odds</th><th>Them</th><th>$</th></tr>';
            $.each(retData, function(i,rec){
               if (rec.status == 0) {
                  outp += '<tr><td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,5)+')</td><td>'+rec.amount+'</td></tr>';
               $('#waitingThem').show();
               }
            });
            outp += '</table>';
            document.getElementById("waitingThem").innerHTML = outp;
         }
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
   getBets(2,'acceptedBets');
   $('#acceptedBets').hide();
   $.ajax({
      type: 'POST',
      url: '/getbets',
      data: {"status": 2,
            "all": 1},
      success:function(retData){
         if(retData.length){
            var outp = '<table class="table table-condensed"><tr style="color:#ee5f5b">';
            outp += '<th colspan=3>Others</th></tr>';
            $.each(retData, function(i,rec){
               outp += '<tr><td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+' ('+rec.user1.slice(0,5)+')</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,5)+((rec.comment)?' <a href="#" data-toggle="popover" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment"></span></a>':'')+')'+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td></tr>';
            });
            outp += '</table>';
            document.getElementById("acceptedBets").innerHTML += outp;
            $('[data-toggle="popover"]').popover();
            $('#acceptedBets').show();
         }
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
   getBets(3,'refusedBets');
}

function getBets(status, target, custom) {
   $('#'+target).hide();
   $.ajax({
      type: 'POST',
      url: '/getbets',
      data: {"status": status,
            "all": 0},
      success:function(retData){
         if(retData.length){
            var outp = '<table class="table table-condensed"><tr>';
            if (status < 0)
               outp += '<th>Send</th>';
            outp += '<th>You</th><th>Odds</th><th>Them</th><th>$</th></tr>';
            $.each(retData, function(i,rec){
               outp +='<tr>';
               if ((custom == 1 && rec.sport == 'nfl') || (custom == 2 && rec.sport == 'nba'))
                  outp += '<td><button class="btn btn-sm btn-success" data-toggle="modal" data-target="#savedModal" data-id="'+rec._id+'" data-odds="'+rec.odds+'" data-team1="'+rec.team1+'" data-team2="'+rec.team2+'" data-type="'+rec.type+'" data-sport="'+rec.sport+'"><span class="glyphicon glyphicon-send"></span></button></td>';
               outp += '<td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+((rec.fta)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,5)+((rec.comment)?' <a href="#" data-toggle="popover" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment"></span></a>':'')+')'+'</td><td>'+rec.amount+'</td></tr>';
            });
            outp += '</table>';
            document.getElementById(target).innerHTML = outp;
            $('[data-toggle="popover"]').popover();
            $('#'+target).show();
         }
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
}

$('#actionModal').on('show.bs.modal', function (event) {
   $('#actionId').val($(event.relatedTarget).data('id'));
   $('#actionComment').val('');
});

$('.actionAction').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/changebet',
		data: {'id': $('#actionId').val(),
         'status': $(this).val(),
         'comment': $('#actionComment').val()},
		success:function(retData){
         alert(retData.type,retData.message);
         showBets();
		},
		error: function(retData){
         alert(retData.type,retData.message);
		}
	});
});

function weeklyStats() {
   $('#weeklyStats').hide();
   console.log(getWeek(new Date()));
   $.ajax({
		type: 'POST',
		url: '/weeklystats',
      data: {'week': getWeek(new Date())},
		success:function(retData){
         if(retData.length){
            var outp = '<table class="table table-condensed"><tr><th>You</th><th>Odds</th><th>Them</th><th>$</th></tr>';
            $.each(retData, function(i,rec){
               outp += '<tr>'+((rec.status < 6)?((rec.status == 4)?'<td style="color:#62c462">':'<td style="color:#ee5f5b">'):'<td>')+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1.replace('@','')+' ('+rec.user1.slice(0,5)+')</td><td>'+rec.odds+'</td>'+((rec.status < 6)?((rec.status == 4)?'<td style="color:#ee5f5b">':'<td style="color:#62c462">'):'<td>')+rec.team2.replace('@','')+' ('+rec.user2.slice(0,5)+')</td><td>'+rec.amount+'</td></tr>';
            });
            outp += '</table>';
            document.getElementById('weeklyStats').innerHTML = outp;
            $('#weeklyStats').show();
         }
      },
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

$('#statsType').on('click', function(){
   event.preventDefault();
   if ($('#statsType').text() == 'ALL') {
      $('#statsType').text('NFL');
      $('#statsType').removeClass('btn-primary').addClass('btn-warning');
      overallStats(1,0);
   } else if ($('#statsType').text() == 'NFL') {
      $('#statsType').text('NBA');
      $('#statsType').removeClass('btn-warning').addClass('btn-info');
      overallStats(0,1);
   } else {
      $('#statsType').text('ALL');
      $('#statsType').removeClass('btn-info').addClass('btn-primary');
      overallStats(1,1);
   }
});

function overallStats(nfl,nba) {
   $.ajax({
		type: 'GET',
		url: '/overallstats',
		success:function(retData){
			var outp = '<table class="table"><tr><th>Who</th><th>Win</th><th>Loss</th><th>Push</th><th>%</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr><td><a data-toggle="modal" data-target="#statsModal" data-user="'+rec._id+'" >'+rec._id.slice(0,5)+'</a></td><td>'+(rec.win_nfl*nfl+rec.win_nba*nba)+'</td><td>'+(rec.loss_nfl*nfl+rec.loss_nba*nba)+'</td><td>'+(rec.push_nfl*nfl+rec.push_nba*nba)+'</td><td>'+((rec.win_nfl*nfl+rec.push_nfl*nfl*0.5+rec.win_nba*nba+rec.push_nba*nba*0.5)/(rec.win_nfl*nfl+rec.loss_nfl*nfl+rec.push_nfl*nfl+rec.win_nba*nba+rec.loss_nba*nba+rec.push_nba*nba)).toPrecision(3).slice(1,5)+'</td></tr>';
			});
			outp += '</table>';
			document.getElementById("overallStats").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

$('#statsModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);
   $('#statsTitle').text('Stats history for: '+button.data('user'));
   $.ajax({
		type: 'POST',
		url: '/userstats',
      data: {'user': button.data('user')},
		success:function(retData){
			var outp = '<table class="table"><tr><th>Date</th><th>Me</th><th>Them</th><th>W/L</th></tr>';
			$.each(retData, function(i,rec){
            var date=new Date(rec.date);
				outp += '<tr><td>'+(date.getMonth()+1)+'/'+date.getDate()+'</a></td><td>';
            if (rec.user1 == button.data('user'))
               outp += ((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team1.replace('@','')+'</td><td>'+rec.team2.replace('@','')+' ('+rec.user2.slice(0,4)+')</td><td>'+((rec.status==4)?'W':((rec.status==5)?'L':'P'));
            else
               outp += ((rec.sport=='nfl')?'<img class="icon" src="images/football.png"/> ':'<img class="icon" src="images/basketball.png"/> ')+rec.team2.replace('@','')+'</td><td>'+rec.team1.replace('@','')+' ('+rec.user1.slice(0,4)+')</td><td>'+((rec.status==5)?'W':((rec.status==4)?'L':'P'));
            outp += '</td></tr>';
			});
			outp += '</table>';
			document.getElementById("statsHistory").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
});

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
   $('#scoresDate').val(period);
   $.ajax({
		type: 'POST',
		url: '/getscores',
      data: {'sport': sport,
         'year': ((period>17)?2016:2015),
         'period': period},
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
			alert(retData.type,retData.message);
		}
	});
}

$('.scoresInc').on('click', function(event){
   event.preventDefault();
   var tmp = $('#scoresPeriod').text().split(' ');
   if (tmp[0]=='Week') {
      if (Number(tmp[1]) >= 1 && Number(tmp[1]) < 21)
         showScores('nfl', Number(tmp[1])+$(this).val()*1);
   } else {
      showScores('nba',new Date(Number(new Date($('#scoresDate').val()))+$(this).val()*(24*60*60*1000)));
   }
});

$('#msgSubmit').on('click', function(e){
      e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/postmessage',
   		data: {'message': $('#msgInput').val()},
   		success:function(retData){
            $('#msgInput').val('');
            showMessages();
   		},
   		error: function(retData){
            alert(retData.type,retData.message);
   		}
   	});
});

function showMessages() {
   $.ajax({
		type: 'GET',
		url: '/msgboard',
		success:function(retData){
         var outp='';
			$.each(retData, function(i,rec){
            date = new Date(rec.date);
				outp += '<span class="msghdr">'+rec.user.slice(0,5)+'</span>: '+rec.message+'  <span class="msgdate text-primary">('+(date.getMonth()+1)+'/'+date.getDate()+' - '+date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+')</span><br/>';
			});
			document.getElementById("msgList").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

$('#propSubmit').on('click', function(e){
      // e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/postprop',
   		data: {'user2': $('#propUser2').val(),
            'amount': $('#propAmount').val(),
            'prop': $('#propProp').val()
         },
   		success:function(retData){
            showProps();
   		},
   		error: function(retData){
            alert(retData.type,retData.message);
   		}
   	});
});

function showProps() {
   $.ajax({
		type: 'GET',
		url: '/getprops',
		success:function(retData){
         var outp = '<table class="table"><tr><th>Who</th><th>Who</th><th>Bet</th><th>Prop</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr>'+((rec.winner)?(rec.winner == 1)?'<td style="color:#62c462">':'<td style="color:#ee5f5b">':'<td>')+rec.user1.slice(0,5)+'</td>'+((rec.winner)?(rec.winner == 1)?'<td style="color:#ee5f5b"><strike>':'<td style="color:#62c462">':'<td>')+rec.user2.slice(0,5)+'</td><td>$'+rec.amount+'</td><td>'+rec.prop+'</td></tr>';
			});
			outp += '</table>';
			document.getElementById("propList").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

function showStandings() {
   $.ajax({
		type: 'GET',
		url: '/getstandings',
		success:function(retData){
         var eric = 0,
         john = 0,
         russell = 0,
         aaron = 0;
         outp = '<table class="table table-condensed"><tr><th>Team</th><th>W</th><th>L</th><th>Prj</th><th>Line</th><th>O/U</th></tr>';

			$.each(retData, function(i,rec){
				outp += '<tr><td>'+rec.team.replace(' ','').slice(0,3)+'</td><td>'+rec.win+'</td><td>'+rec.loss+'</td><td>'+rec.projection.toPrecision(3)+'</td><td>'+rec.line+'</td>'+((Math.abs(rec.line-rec.projection)<3)?'<td style="color:#ee5f5b">':'<td>')+((rec.status == 'Over')?'O':'U')+'</td></tr>';

            eric += (rec.eric.slice(0,1) == rec.status.slice(0,1))?((rec.eric.endsWith('*'))?2:1):0;
            john += (rec.john.slice(0,1) == rec.status.slice(0,1))?((rec.john.endsWith('*'))?2:1):0;
            russell += (rec.russell.slice(0,1) == rec.status.slice(0,1))?((rec.russell.endsWith('*'))?2:1):0;
            aaron += (rec.aaron.slice(0,1) == rec.status.slice(0,1))?((rec.aaron.endsWith('*'))?2:1):0;
			});
			outp += '</table>';
			document.getElementById("standingsArea").innerHTML = outp;
         outp = '<table class="table table-condensed"><tr><th>John</th><th>Eric</th><th>Russell</th><th>Aaron</th></tr>';
         outp += '<tr><td>'+john+'</td><td>'+eric+'</td><td>'+russell+'</td><td>'+aaron+'</td></tr></table>';
         document.getElementById("ouPicks").innerHTML = outp;
		},
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

// Global stuff
$('#loginSubmit').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/login',
		data: {'username': $('#loginUsername').val(),
         'password': $('#loginPassword').val()
		},
		success:function(retData){
         if (retData.type == 'success'){
            window.username = $('#loginUsername').val();
            getUsers();
         }
         alert(retData.type,retData.message);
         doorBell();
		},
		error: function(retData){
         alert(retData.type,retData.message);
		}
	});
});

$('#registerSubmit').on('click', function(){
   $.ajax({
      type: 'POST',
      url: '/register',
      data: {'username': $('#registerUsername').val(),
         'sms': $('#registerSMS').val(),
         'password': $('#registerPassword').val()
      },
      success:function(retData){
         alert(retData.type,retData.message);
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
});

$('#whoami').on('click', function(){
   $.ajax({
      type: 'GET',
      url: '/whoami',
      success:function(retData){
         alert(retData.type,retData.message);
      },
      error: function(retData){
         alert(retData.type,retData.message);
      }
   });
});

$('#page-content-wrapper').on('swipeleft', function(event){
   switch (window.location.pathname) {
      case '/nfl':
         window.location.href = '/';
         break;
      case '/':
         window.location.href = '/bets';
         break;
      case '/bets':
         window.location.href = '/stats';
         break;
      case '/stats':
         window.location.href = '/scores';
         break;
      case '/scores':
         window.location.href = '/standings';
         break;
      case '/standings':
         window.location.href = '/props';
         break;
      case '/props':
         window.location.href = '/messageboard';
         break;
      case '/messageboard':
         window.location.href = '/';
         break;
   }
});

$('#page-content-wrapper').on('swiperight', function(event){
   switch (window.location.pathname) {
      case '/nfl':
         window.location.href = '/messageboard';
         break;
      case '/':
         window.location.href = '/messageboard';
         break;
      case '/bets':
         window.location.href = '/';
         break;
      case '/stats':
         window.location.href = '/bets';
         break;
      case '/scores':
         window.location.href = '/stats';
         break;
      case '/standings':
         window.location.href = '/scores';
         break;
      case '/props':
         window.location.href = '/standings';
         break;
      case '/messageboard':
         window.location.href = '/props';
         break;
   }
});
// class used by sidebar page selection to close
$('.toggleSidebar').on('click', function() {
   $('#wrapper').toggleClass('toggled');
});

// multi use alert modal
function alert(type, message){
   $('#alertBody').removeClass();
   $('#alertBody').addClass('modal-content').addClass('modal-'+type);
   $('#alertText').text(message);
   $('#alertModal').modal();
   setTimeout(function(){
      $('#alertModal').modal('hide');
   }, 2000);
}

// Startup stuff
function getUsers (){
	$.ajax({
		type: 'GET',
		url: '/users',
		success:function(retData){
         $('#userList').empty();
			$.each(retData, function(i,user){
				$('#userList').append('<option value="'+user._id+'">'+user._id+'</option>');
            $('#propUser2').append('<option value="'+user._id+'">'+user._id+'</option>');
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
		url: '/doorbell',
		success:function(retData){
         console.log('ring doorbell');
         if(retData.type == 'command'){
            eval(retData.message);
         } else if (retData.type == 'messages'){  // bets waiting; too lazy to clean up css
            $('#iconbar').addClass('glyphicon-flag').css('color', '#ee5f5b').css('font-size','24px');
         }
      },
		error: function(retData){
			alert(retData.type,retData.message);
		}
	});
}

var monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeek(date){
   var wk, dst=0;
   var seasonStart = new Date(2015,8,8);
   var nflWeeks = [];
   for (var i=0;i<23;i++){
      if (i > 7)
         dst = 3600000;
      nflWeeks.push(new Date(seasonStart.valueOf()+i*7*86400000+dst));
   }
   for (i=0;i<21;i++){
      if (date > nflWeeks[i] && date < nflWeeks[i+1]) {
         wk = i+1;
         break;
      }
   }
   return wk;
}

function getOdds (sport){
	$.ajax({
		type: 'GET',
		url: '/'+sport+'odds',
		// data: reqString,
		dataType: 'json',
      success:function(retData){
         var sportColor, prevDate, gameNum=0;
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
            var date = new Date(rec.date);
            var passed = (date > new Date())?'':'disabled ';
            if (date.getDate() > prevDate)
               outp += '<tr class="modal-primary"><td colspan=3></td></tr>';
            outp += '<tr'+((passed=='disabled ')?' class="strikethrough"':'')+'><td class="td-odds">'+rec.team1+'<br/><button '+passed+'class="btn btn-'+sportColor+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'">'+rec.spread+'</button></td><td class="td-odds td-middle">'+dayName[date.getDay()]+' '+monthName[date.getMonth()]+' '+date.getDate()+' - '+(date.getHours()-12)+':'+('0'+date.getMinutes()).slice(-2)+'<br/><button '+passed+'class="btn btn-default" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="1" data-type="over" data-sport="'+sport+'" data-gametime="'+rec.date+'">O'+rec.over+'</button><button '+passed+'class="btn btn-default" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="under" data-sport="'+sport+'" data-gametime="'+rec.date+'">U'+rec.over+'</button></td><td class="td-odds">'+rec.team2+'<br/><button '+passed+'class="btn btn-'+sportColor+'" data-toggle="modal" data-target="#betModal" data-game="'+gameNum+'" data-team="2" data-type="spread" data-sport="'+sport+'" data-gametime="'+rec.date+'">'+(0-rec.spread)+'</button></td></tr>';
            prevDate = date.getDate();
            gameNum++;
         });
         outp += '</table>';
         document.getElementById(sport+'Odds').innerHTML = outp;
         $('#'+sport+'Timestamp').text('updated:'+retData.time);
      },
		error: function(retData){
		}
	});
}

$(document).ready(function() {
   doorBell();
});
