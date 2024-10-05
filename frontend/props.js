$('#propAcceptModal').on('show.bs.modal', function (event) {
   var button = $(event.relatedTarget);
   $('#propAcceptText').text('* Proposition: '+button.data('prop'));
   $('#propAcceptId').val(button.data('id'));
});

$('#propAcceptSubmit').on('click', () =>  {
   postApi('acceptprop', {
      'id': $('#propAcceptId').val()
	});
   showProps();
});

$('#propSubmit').on('click', e => {
   postApi('makebet', {
      'user2': $('#propUser2').val(),
      'type': 'prop',
      'amount': $('#propAmount').val(),
      'team1': $('#propProp').val(),
      'team2': ''
   });
   showProps();   //refresh page
});

// Prop bet stuff
function showProps() {
   fetch('/api/getprops', getOptions)
   .then(res =>res.json())
   .then(retData => {
      var outp = '<table class="table"><tr><th>Who</th><th>Who</th><th>Prop</th></tr>';
      $.each(retData, (i, rec) => {
         outp += '<tr>'+((rec.status == 4)?'<td class="heading-success">':(rec.status == 5)?'<td class="heading-danger">':'<td>')+rec.user1.slice(0,5)+'</td>';
         outp += (rec.status == 0 && (rec.user2 == 'OPEN' || rec.user2 == username))?'<td><button class="btn btn-sm btn-success" data-toggle="modal" data-target="#propAcceptModal" data-id="'+rec._id+'" data-prop="'+rec.team1+'"><span class="glyphicon glyphicon-hand-left"></span></button>':((rec.status == 4)?'<td class="heading-danger">':(rec.status == 5)?'<td class="heading-success">':'<td>')+rec.user2.slice(0,5);
         outp += '</td><td>'+rec.team1+'</td></tr>';
      });
      outp += '</table>';
      document.getElementById("propList").innerHTML = outp;
      })
   .catch(retData => modalAlert(retData.type, retData.message));
}
