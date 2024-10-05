//below displays 4 panels on bets page
function showBets () {
   getBets(2, 'acceptedBets');
   getBets(0, 'waitingYou', 'accept');
   getBets(1, 'waitingThem', 'rescind');
   getBets(3, 'refusedBets');

   //next dislplay accepted bets of other for info sake
   // $('#otherBets').hide(); //hide div to display until sure something there
   postOptions.body = JSON.stringify({
      "status": 2,
      "all": 1
   });
   fetch('/api/getbets', postOptions)
   .then(res => res.json())
   .then(retData => {
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
         $.each(retData, (i,rec) => {
            outp += '<tr><td>'+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+' ('+rec.user1.slice(0,6)+')</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td>'+rec.team2+' ('+rec.user2.slice(0,6)+((rec.comment)?' <a class="comment" href="#" data-toggle="popover" data-trigger="manual" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment"></span></a>':'')+')'+((rec.limit)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td></tr>';
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
   })
   .catch(retData => modalAlert(retData.type, retData.message));
}

function getBets(status, target, addButton) {
   postOptions.body = JSON.stringify({
      "status": status,
      "all": 0
   });
   fetch('/api/getbets', postOptions)
   .then(res => res.json())
   .then(retData => {
      $('#'+target).empty();
      if(retData.length){
         var outp = '<table class="table table-condensed"><tr class="heading">';
         // kluge to add title row
         if (target == 'watchBets')
            outp += '<tr class="modal-info"><td colspan=4 class="center  odds-date-row">Bets Being Watched</td></tr>';
         outp += '<th>You</th><th>Odds</th><th>Them</th>';
         // some tables contain action buttons
         if (addButton)
            outp += '<th>Edit</th>';
         $.each(retData, (i,rec) => {
            outp +='</tr><tr'+((rec.watch==2)?' class="watchseen"':'')+'>';
            outp += '<td'+((rec.type=='over' || rec.type=='under')?' class="watchseen">':'>')+((rec.sport=='nfl')?' <img class="icon" src="images/football.png"/>':' <img class="icon" src="images/basketball.png"/>')+rec.team1+((rec.limit)?'<span class="glyphicon glyphicon-hourglass"></span>':'')+'</td><td class="center">'+((rec.type=='over')?'O':(rec.type=='under')?'U':'')+rec.odds+'</td><td'+((rec.type=='over' || rec.type=='under')?' class="watchseen">':'>')+rec.team2+' ('+rec.user2.slice(0,6)+((rec.comment)?' <a class="comment" href="#" data-toggle="popover" data-trigger="manual" data-placement="top" data-content="'+rec.comment+'"><span class="glyphicon glyphicon-comment red"></span></a>':'')+')'+'</td>';
            if (addButton)
               outp += '<td><button class="btn btn-sm '+((addButton=='rescind')?'btn-danger':'btn-success')+'" data-toggle="modal" data-target="#'+((addButton=='accept')?'actionModal':(addButton=='rescind')?'rescindModal':'watchModal')+'" data-id="'+rec._id+'" data-odds="'+rec.odds+'" data-team1="'+rec.team1+'" data-team2="'+rec.team2+'" data-watch="'+rec.watch+'" data-status="'+rec.status+'" data-type="'+rec.type+'" data-sport="'+rec.sport+'" data-deactivated="'+((rec.watch==2)?true:false)+'"><span class="glyphicon glyphicon-'+((addButton=='rescind')?'remove':'hand-left')+'"></span></button></td>';
            outp += '</tr>';
         });
         outp += '</table>';
         $('#'+target).prepend(outp);
         // check title where icon stores whether pane should be open or closed
         collapseIconAction(target);
         // $('[data-toggle="popover"]').popover();
      }
   })
   .catch(retData => modalAlert(retData.type, retData.message));
}

//prepopulate action modal with bet id
$('#actionModal').on('show.bs.modal', function (event) {
   $('#actionId').val($(event.relatedTarget).data('id'));
   $('#actionComment').val('');
});

$('.actionAction').on('click', () => {
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

$('#rescindSend').on('click', () => {
   postApi('changebet', {
         'id': $('#rescindId').val(),
         'action': 'delete'});
   getBets(1, 'waitingThem', 'rescind');
});

// since .comment class is not in html(added by js), need to attach to higher id
$('#page-content-wrapper').on('click', '.comment', event => {
   event.preventDefault();
   var that = $(this);
   that.popover('show');
      setTimeout(() => {
      that.popover('hide');
   }, 6000);
});
