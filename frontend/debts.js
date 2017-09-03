$('#resolveBody').on('click', '.xxx', function(event){
   $.ajax({
      type: 'POST',
      url: '/api/resolvefinish',
      data: {
         'name': $(this).data('name'),
         'num': $(this).data('num')
      },
      success:function(retData){
         modalAlert(retData.type,retData.message, 3000);
      },
      error: function(retData){
         modalAlert(retData.type,retData.message);
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
         modalAlert(retData.type, retData.message);
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
            modalAlert(retData.type, retData.message);
         }
      });
   });
   modalAlert('', 'Dismiss debt?', null, true);      // confirm modal
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
			modalAlert(retData.type, retData.message);
		}
	});
});
