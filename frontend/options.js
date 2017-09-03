// Preferences stuff
$('#prefSave').on('click', function(e){
      e.preventDefault();
      $.ajax({
   		type: 'POST',
   		url: '/api/setprefs',
      data: {
        'sms': $('#changeSMS').val(),
        'pref_nfl_everyone': $('#prefNflEveryone').is(":checked"),
        'pref_nba_everyone': $('#prefNbaEveryone').is(":checked"),
        'pref_text_receive': $('#prefTextReceive').is(":checked"),
        'pref_text_accept': $('#prefTextAccept').is(":checked"),
        'pref_default_page': $('#prefDefaultPage').val()
      },
   		success:function(retData){
            modalAlert(retData.type,retData.message);
   		},
   		error: function(retData){
            modalAlert(retData.type,retData.message);
   		}
   	});
});

function getPrefs() {
   $.ajax({
		type: 'GET',
		url: '/api/getprefs',
		success:function(retData){
         $('#username').text('Preferences for '+retData._id);
         $('#changeSMS').val(retData.sms);
         $('#prefNflEveryone').prop('checked', retData.pref_nfl_everyone);
         $('#prefNbaEveryone').prop('checked', retData.pref_nba_everyone);
         $('#prefTextReceive').prop('checked', retData.pref_text_receive);
         $('#prefTextAccept').prop('checked', retData.pref_text_accept);
         $('#prefDefaultPage').val(retData.pref_default_page);
      },
      error: function(retData){
			modalAlert(retData.type,retData.message);
		}
	});
}

$('#changePasswordModal').on('show.bs.modal', function (event) {
   $('#changePassword').val(''); // clear
   $('#changePassword2').val('');
});

$('#changeSubmit').on('click', function() {
   //check password match first
   if($('#changePassword').val() && ($('#changePassword').val() == $('#changePassword2').val())) {
      $.ajax({
         type: 'POST',
         url: '/api/setprefs',
         data: {
            'password': $('#changePassword').val()
         },
         success:function(retData){
            modalAlert(retData.type,retData.message);
         },
         error: function(retData){
            modalAlert(retData.type,retData.message);
         }
      });
   } else {
      modalAlert('danger', "Passwords don't match, please try again");
   }
});
