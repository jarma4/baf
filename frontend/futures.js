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
         'action': 'delete'});
   getFutures();
});

$('#futureOfferSubmit').on('click', function(){
   postApi('changebet', {
         'id': $('#futureActId').val(),
         'status': 2,
         'user2': $('#futureSessionId').val(),
         'action': 'change'
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
   postOptions.body = JSON.stringify({
      status: 0
   });
   fetch('/api/getfutureoffers', postOptions)
   .then(res => res.json())
   .then(retData => {
      username = retData.sessionId; // being returned so buttons can be customized
      var outp = '<table class="table table-condensed">';
      $.each(retData.offers, function(i,rec){
         outp += '<tr><td>'+rec.user1+((rec.type == 'give')?' will give ':' will take ')+rec.odds/100+'/1 odds that '+rec.team1+((rec.type == 'give')?' don\'t win ':' win ')+rec.team2+'</td><td><button class="btn btn-sm futureOffer '+((rec.user1 == username)?'btn-danger':'btn-success')+'" data-user="'+rec.user1+'" data-id="'+rec._id+'"><span class="glyphicon glyphicon-'+((rec.user1 == username)?'remove':'ok')+'"></span></button></td></tr>';
         $('#futuresOffers').addClass('in');
         $('#futuresOffersTitle span.collapseIcon').removeClass('hidden');
      });
      outp += '</table>';
      document.getElementById('futuresOffers').innerHTML = outp;
   })
   .catch(retData => modalAlert(retData.type, retData.message));
   // next check if there are any futures propostions
   fetch('/api/getfutures', getOptions)
   .then(res => res.json())   
   .then(retData => {
      $('#futuresGroup').empty();
      $.each(retData.futures, function(i,single){
         // create new/separate panel for each future
         var newPanel = '<div class="panel panel-info"><div class="panel-heading"><span id="futuresTitle'+i+'"></span><a data-toggle="collapse" href="#futuresPanel'+i+'"><span class="collapseIcon open glyphicon glyphicon-triangle-bottom"></span></a><em class="right">updated: '+retData.futures[i].time+'</em></div><div id="futuresPanel'+i+'" class="panel-collapse collapse in"></div></div>';
         // create new table for panel contents
         var outp = '<table class="table table-condensed"><tr><th>Team</th><th>Odds</th><th colspan=2 class="center">Offer Action</th></tr>';
         $.each(single.entries, function(i,rec){
            outp += '<tr><td>'+rec.team+'</td><td>'+rec.ml/100+' / 1 </td><td><button class="btn btn-primary"  data-toggle="modal" data-target="#futureModal" data-side="give" data-odds="'+rec.ml+'" data-team="'+rec.team+'" data-future="'+single.event+'">Give</button></td><td><button class="btn btn-primary" data-toggle="modal" data-target="#futureModal" data-side="take" data-odds="'+rec.ml+'" data-team="'+rec.team+'" data-future="'+single.event+'">Take</button></td></tr>';
         });
         $('#futuresGroup').append(newPanel);
         document.getElementById('futuresPanel'+i).innerHTML = outp;
         $('#futuresTitle'+i).text(single.event);
         if (new Date('2020/'+retData.futures[i].time) < new Date(new Date().valueOf()-5*24*60*60*1000))
            $('#futuresTitle'+i).next().next().addClass('heading-danger');
      });
   })
   .catch(retData => modalAlert(retData.type, retData.message));
   // lastly get accepted future offers
   postOptions.body = JSON.stringify({
      status: 2
   });
   fetch('/api/getfutureoffers', postOptions)
   .then(res => res.json())
   .then(retData => {
      $('#futureSessionId').val(retData.sessionId);
      var outp = '<table class="table table-condensed">';
      $.each(retData.offers, function(i,rec){
         outp += '<tr><td>'+rec.user1+((rec.type == 'give')?' gave ':' took ')+rec.odds/100+'/1 odds that '+rec.team1+((rec.user2 == 'give')?' doesn\'t win ':' win ')+rec.team2+' to '+rec.user2+'</td></tr>';
         $('#futuresAccepted').addClass('in');
         $('#futuresAcceptedTitle span.collapseIcon').removeClass('hidden');
      });
      outp += '</table>';
      document.getElementById('futuresAccepted').innerHTML = outp;
   })
   .catch(retData => modalAlert(retData.type, retData.message));
}
