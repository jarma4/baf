// "use strict";

$(document).ready(function() {
   // if(window.location.search.substring == 2) {
   //    $("#wrapper").css('margin-left', '-360px');
   // }
   // $("#wrapper").css('margin-left', '0px');
   initServiceWorker();
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
      nfl: 0,
      nba: 1,
      ncaa: 0
   },
   postOptions = {
      credentials: 'same-origin',
      method:'POST',
      headers: {
         'Accept': 'application/json, text/plain, */*',
         'Content-Type':'application/json'
      }
   },
   getOptions = {
      credentials: 'same-origin',
   };

   
async function initServiceWorker(){
   function urlBase64ToUint8Array(base64String) {
      const padding = "=".repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
         .replace(/\-/g, "+")
         .replace(/_/g, "/");

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
   }
   if ("serviceWorker" in navigator) {
      const register = await navigator.serviceWorker.register("/js/worker.js", {
         scope: "/"
      });
      const subscription = await register.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: urlBase64ToUint8Array('BCStsAHlI_a_jYeD3x8km8xkiTnIv-2iR0oigfMZLZpT2WgUi9lv-8kA7WcdQwenhdMb9uqsrMLlp0ArtTjns5o')
      });
      postOptions.body = JSON.stringify(subscription);
      fetch('/api/pushsubscribe', postOptions);
      // .catch(retData => modalAlert(retData.type,retData.message));
   }
}
   
// called when new page loaded
function doorBell(){
	fetch('/api/doorbell', getOptions)
   .then(res =>res.json())
   .then(retData => {
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
   })
	.catch(retData => modalAlert(retData.type,retData.message));
};

// common function called everywhere
function postApi(page, obj) {
   postOptions.body = JSON.stringify(obj);
   fetch('/api/'+page, postOptions)
   .then(res => res.json())
   .then(retData => modalAlert(retData.type, retData.message))
   .catch(retData => modalAlert(retData.type, retData.message));
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
	fetch('/api/users', getOptions)
   .then(res => res.json())
	.then(retData => {
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
   })
	.catch(retData => modalAlert(retData.type,retData.message));
};

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
   postOptions.body = JSON.stringify({
      'username': $('#loginUsername').val(),
      'password': $('#loginPassword').val()
   });
   fetch('/admin/login', postOptions)
   .then(res => res.json())
	.then(retData => {
      if (retData.type == 'success'){
         // username = $('#loginUsername').val();
         getUsers();
      }
      modalAlert(retData.type, retData.message);
      doorBell();
   })
	.catch(retData => modalAlert(retData.type, retData.message));
});

$('#registerSubmit').on('click', function(){
   if (!$('#registerSMS').val() || !$('#registerUsername').val() || !$('#registerEmail').val()) {
      modalAlert('danger', 'You have not completed all the fields');
      $('#registerModal').modal('show');
   } else if($('#registerPassword').val() && ($('#registerPassword').val() == $('#registerPassword2').val())) {
      postOptions.body = JSON.stringify({
         'username': $('#registerUsername').val(),
         'sms': $('#registerSMS').val(),
         'email': $('#registerEmail').val(),
         'password': $('#registerPassword').val()
      });
      fetch('/admin/register', postOptions)
      .then(retData => {
         if (retData.type == 'success') {
            getUsers();
         }
         modalAlert(retData.type, retData.message, 5);
      })
      .then(retData => modalAlert(retData.type, retData.message));
   } else {
      modalAlert('danger', "Passwords don't match, please try again");
   }
});
