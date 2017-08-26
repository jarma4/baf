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
