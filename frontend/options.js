// Preferences stuff
$('#prefSave').on('click', function(e){
   e.preventDefault();
   fetch('/api/setprefs', {
      credentials: 'same-origin',
      method:'POST',
      headers: {
         'Accept': 'application/json, text/plain, */*',
         'Content-Type':'application/json'
      },
      body:JSON.stringify({
         'sms': $('#changeSMS').val(),
         'pref_nfl_everyone': $('#prefNflEveryone').is(":checked"),
         'pref_nba_everyone': $('#prefNbaEveryone').is(":checked"),
         'pref_text_receive': $('#prefTextReceive').is(":checked"),
         'pref_text_accept': $('#prefTextAccept').is(":checked"),
         'pref_default_page': $('#prefDefaultPage').val()
      })
   })
   .then(res =>res.json())
   .then(retData => modalAlert(retData.type,retData.message))
   .catch(retData => modalAlert(retData.type,retData.message));
});

function getPrefs() {
   fetch('/api/getprefs', {
      credentials: 'include'
   })
   .then(res =>res.json())
   .then(retData => {
      $('#username').text('Preferences for '+retData._id);
      $('#changeSMS').val(retData.sms);
      $('#prefNflEveryone').prop('checked', retData.pref_nfl_everyone);
      $('#prefNbaEveryone').prop('checked', retData.pref_nba_everyone);
      $('#prefTextReceive').prop('checked', retData.pref_text_receive);
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

$('#changeSubmit').on('click', function() {
   //check password match first
   if($('#changePassword').val() && ($('#changePassword').val() == $('#changePassword2').val())) {
      fetch('/api/setprefs', {
         credentials: 'same-origin',
         method:'POST',
         headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type':'application/json'
         },
         body:JSON.stringify({
            'password': $('#changePassword').val()
         })
      })
      .then(retData => modalAlert(retData.type,retData.message))
      .catch(retData => modalAlert(retData.type,retData.message));
   } else {
      modalAlert('danger', "Passwords don't match, please try again");
   }
});
