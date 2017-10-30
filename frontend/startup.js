// "use strict";

$(document).ready(function() {
   // if(window.location.search.substring == 2) {
   //    $("#wrapper").css('margin-left', '-360px');
   // }
   // $("#wrapper").css('margin-left', '0px');
   doorBell();
});

//global variables
var username,
   // used for swiping between pages
   urls = ['/', '/odds', '/bets', '/stats', '/scores', '/futures', '/overunder', '/props', '/options'],
   // declared global so that charts can be updated between functions
   winChart,
   monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   bafusers = {'jarma4': 'TJ', 'KRELL': 'EK', 'aaron': 'AW', 'Serg': 'SC', 'Jmcgeady': 'JM', 'russell': 'RR', 'distributederik': 'EJ', 'JuiceAlmighty': 'JH', 'tedbeckett01': 'TB'},
   seasonStart = {
         nfl: new Date(2017,8,5),
         nba: new Date(2017,9,17),
         ncaa: new Date(2017,2,16)
      },
   inSeason = {
      nfl: 1,
      nba: 1,
      ncaa: 0
   };

// called when new page loaded
function doorBell(){
	$.ajax({
		type: 'GET',
		url: '/api/doorbell',
		success:function(retData){
         if(retData.type == 'command'){
            eval(retData.message);
         } else if (retData.type == 'message'){  // bets waiting; too lazy to clean up css
            // username = retData.username; // keep around for things
            if (retData.bets) {
               $('#notify1').removeClass('hidden');
               addAnimation('bounce', 15000, 'notify1');
            }
            if (retData.debts) {
               $('#notify2').removeClass('hidden');
            }
            if (retData.futures) {
               $('#notify3').removeClass('hidden');
            }
            if (retData.props) {
               $('#notify4').removeClass('hidden');
            }
            if (retData.nfl) {
               $('#sportNfl').removeClass('hidden');
            }
            if (retData.nba) {
               $('#sportNba').removeClass('hidden');
            }
            if (retData.ncaa) {
                  $('#sportNcaa').removeClass('hidden');
            }
         }
      },
		error: function(retData){
			modalAlert(retData.type,retData.message);
		}
	});
}

// common function called everywhere
function postApi(page, obj) {
   $.ajax({
		type: 'POST',
		url: '/api/'+page,
		data: obj,
		success:function(retData){
         modalAlert(retData.type, retData.message);
		},
		error: function(retData){
         modalAlert(retData.type, retData.message);
		}
	});
}

// multi use alert modal
function modalAlert(type, message, duration, pause){
   $('#alertBody').removeClass();
   $('#alertBody').addClass('modal-content').addClass('modal-'+type);
   $('#alertText').text(message);
   $('#alertModal').modal('toggle');
   if (!pause) {
      setTimeout(function(){
         $('#alertModal').modal('hide');
      }, duration || 2000);
   } else {
      $('#alertOk').removeClass('nodisplay');
      $('#alertCancel').removeClass('nodisplay');
   }
}

// Startup stuff
function getUsers (){
	$.ajax({
		type: 'GET',
		url: '/api/users',
		success:function(retData){
         window.userList = [];
         $('#userList').empty();
         $('#propUser2').empty().append('<option value="OPEN">OPEN</option>');
			$.each(retData, function(i,user){
				$('#userList').append('<option value="'+user._id+'">'+user._id+'</option>');
            $('#propUser2').append('<option value="'+user._id+'">'+user._id+'</option>');
            window.userList.push(user._id);
			});
         $('#userList').append('<option value="EVERYONE">EVERYONE</option>');
         $('#userList').append('<option value="EVERYONE2">EVERYONE - 1st to act</option>');
         $('#userList option[value="EVERYONE"]').attr("selected", "selected");
         // $('#propUser2').prepend('<option value="OPEN">OPEN</option>');
		},
		error: function(retData){
			modalAlert(retData.type,retData.message);
		}
	});
}

// below is for swiping action on touchscreens
function getUrlPos(url){
   var position;
   for (var i=0; i<urls.length; i++){
      if (url == urls[i]) {
        if (i === 0)
	   position = 1;
	else 
	   position = i;
         break;
      }
   }
   return position;
}

function addAnimation(name, duration, target) {
   // $('#'+target).addClass(name);
   setInterval(function(){
      $('#'+target).addClass(name);
      setTimeout(function(){
         $('#'+target).removeClass(name);
      }, 1200);
   }, duration);

}

function getWeek(date, sport){
   var dayTicks = 24 * 60 * 60 * 1000,
      week = Math.ceil((date - ((sport=='nba')?seasonStart.nba:(sport=='nfl')?seasonStart.nfl:seasonStart.ncaa)) / dayTicks / 7);
   if (week < 0) {
      return 1;
   } else {
      return week;
   }
}

// Global stuff
$('#loginSubmit').on('click', function(){
   $.ajax({
		type: 'POST',
		url: '/admin/login',
		data: {
         'username': $('#loginUsername').val(),
         'password': $('#loginPassword').val()
		},
		success:function(retData){
         if (retData.type == 'success'){
            // username = $('#loginUsername').val();
            getUsers();
         }
         modalAlert(retData.type, retData.message);
         doorBell();
		},
		error: function(retData){
         modalAlert(retData.type, retData.message);
		}
	});
});

$('#registerSubmit').on('click', function(){
   if (!$('#registerSMS').val() || !$('#registerUsername').val() || !$('#registerEmail').val()) {
      modalAlert('danger', 'You have not completed all the fields');
      $('#registerModal').modal('show');
   } else if($('#registerPassword').val() && ($('#registerPassword').val() == $('#registerPassword2').val())) {
      $.ajax({
         type: 'POST',
         url: '/admin/register',
         data: {
            'username': $('#registerUsername').val(),
            'sms': $('#registerSMS').val(),
            'email': $('#registerEmail').val(),
            'password': $('#registerPassword').val()
         },
         success:function(retData){
            if (retData.type == 'success') {
               getUsers();
            }
            modalAlert(retData.type, retData.message, 5);
         },
         error: function(retData){
            modalAlert(retData.type, retData.message);
         }
      });
   } else {
      modalAlert('danger', "Passwords don't match, please try again");
   }
});
