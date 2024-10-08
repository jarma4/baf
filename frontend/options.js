// Preferences stuff
$('#prefSave').on('click', e => {
   e.preventDefault();
   postOptions.body = JSON.stringify({
      'slack': $('#slack').val(),
      'pref_nfl_everyone': $('#prefNflEveryone').is(":checked"),
      'pref_nba_everyone': $('#prefNbaEveryone').is(":checked"),
      'pref_text_accept': $('#prefTextAccept').is(":checked"),
      'pref_default_page': $('#prefDefaultPage').val()
   });
   fetch('/api/setprefs', postOptions)
   .then(res =>res.json())
   .then(retData => modalAlert(retData.type,retData.message))
   .catch(retData => modalAlert(retData.type,retData.message));
});

function getPrefs() {
   fetch('/api/getprefs', getOptions)
   .then(res =>res.json())
   .then(retData => {
      $('#username').text('Preferences for '+retData._id);
      $('#slack').val(retData.slack);
      $('#prefNflEveryone').prop('checked', retData.pref_nfl_everyone);
      $('#prefNbaEveryone').prop('checked', retData.pref_nba_everyone);
      $('#prefTextAccept').prop('checked', retData.pref_text_accept);
      $('#prefDefaultPage').val(retData.pref_default_page);
   })
   .catch(retData =>{
      modalAlert(retData.type, retData.message);
	});
}

$('#changePasswordModal').on('show.bs.modal', function (event) {
   $('#changePassword').val(''); // clear
   $('#changePassword2').val('');
});

$('#changeSubmit').on('click', () =>  {
   //check password match first
   if($('#changePassword').val() && ($('#changePassword').val() == $('#changePassword2').val())) {
      postOptions.body = JSON.stringify({
         'password': $('#changePassword').val()
      });
      fetch('/api/setprefs', postOptions)
      .then(retData => modalAlert(retData.type,retData.message))
      .catch(retData => modalAlert(retData.type,retData.message));
   } else {
      modalAlert('danger', "Passwords don't match, please try again");
   }
});
