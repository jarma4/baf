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
      'user2': $('#userList').val(),
	   'amount': $('#betAmount').val(),
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
            collapseIconAction('acceptedBets');
            // $('#otherBets').addClass('in');
            // $('#acceptedBetsTitle span.collapseIcon').removeClass('hidden');
            // $('[data-toggle="popover"]').popover();   //this is for comments that might be on bets
            // $('#otherBets').show();  //show display div
         }
      },
      error: function(retData){
         modalAlert(retData.type, retData.message);
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
            collapseIconAction(target);
            // $('[data-toggle="popover"]').popover();
         }
      },
      error: function(retData){
         modalAlert(retData.type, retData.message);
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
   event.preventDefault();
   var that = $(this);
   that.popover('show');
      setTimeout(function(){
      that.popover('hide');
   }, 6000);
});
