// "use strict";

$(document).ready(() =>  {
	document.documentElement.style.setProperty('--viewPortHeight', `${window.innerHeight*0.01}px`);
   doorBell();
});

//global variables
let username,
   // used for swiping between pages
   urls = ['/', '/odds', '/bets', '/stats', '/futures', '/props', '/overunder', '/btagame', '/tourney', '/options'],
   // declared global so that charts can be updated between functions
   winChart,
   monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
   dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   bafusers = {'jarma4': 'TJ', 'KRELL': 'EK', 'aaron': 'AW', 'Serg': 'SC', 'Jmcgeady': 'JM', 'kbscanlon': 'KS', 'russell': 'RR', 'distributederik': 'EJ', 'JuiceAlmighty': 'JH', 'tedbeckett01': 'TB', 'youngstevebrown': 'SB', 'firdavs': 'FP', 'ryan': 'RK', 'james':'JW'},
	seasonStart = {},  // will get this date with sports in season
	inSeason = {},  // will get this date with sports in season
   // for FETCH calls
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
   
// called when new page loaded
function doorBell(){
	fetch('/api/doorbell', getOptions)
	.then(res =>res.json())
	.then(retData => {
		if(retData.type == 'command'){
			// eval(retData.message);
			if (retData.message == 'login') {
				$("#loginModal").modal();
			}
		} else if (retData.type == 'message'){  // bets waiting; too lazy to clean up css
			username = retData.username; // keep around for things
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
			retData.sports.forEach(sport=>{
				$('.sportPick.'+sport.sport).removeClass('hidden');
				seasonStart[sport.sport] = new Date(sport.start);
				inSeason[sport.sport] = true;
			});
			initPage();
		}
	})
	.catch(retData => modalAlert(retData.type,retData.message));
}

function initPage(){
	switch (window.location.pathname) {
		case '/':
		case '/odds':
			getOdds();
			getUsers();
			getBets([10,11],'watchBets', 'watch');
			break;
		case '/bets':
			showBets();
			break;
		case '/stats':
			getStats();
			break;
		case '/futures':
			getFutures();
			break;
		case '/props':
			getUsers();
			showProps();
			break;
		case '/overunder':
			getOverunder();
			break;
		case '/btagame':
			let sport = getCookie('sport');
			if (!sport || $('.sportPick.'+sport).hasClass('hidden')) {
				sport = $('.sportPick.selected').text().toLowerCase();
				document.cookie = 'sport='+sport+';max-age=43200';
			} else {
				toggleSport(sport);
			}
			resetBta();
			getBtaPicks(sport, $('#btaYear').val(), new Date());
			getBtaScoreboard(sport, $('#btaYear').val(), 'bta');
			break;
		case '/tourney':
			getTourney();
			break;
		case '/tracker':
			getTrackerPicks('nba', new Date());
			getTracker();
			break;
	}
}

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
      setTimeout(() => {
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
      $.each(retData, (i,user) => {
         $('#userList').append('<option value="'+user._id+'">'+user._id+'</option>');
         $('#propUser2').append('<option value="'+user._id+'">'+user._id+'</option>');
         window.userList.push(user._id);
      });
      // $('#userList').prepend('<option value="EVERYONE2">EVERYONE - 1st to act</option>');
      $('#userList').prepend('<option value="EVERYONE">EVERYONE</option>');
		// $('#userList option[value="EVERYONE"]').attr("selected", "selected");
		// $('#betLimit').toggleClass('nodisplay');
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

function getCookie(key){
	const list=document.cookie.split(';');
	for (let i=0; i<list.length; i++) {
		const pair=list[i].trim().split('=');
		if (pair[0] == key)
			return pair[1];
	}
}

function addAnimation(name, duration, target) {
   // $('#'+target).addClass(name);
   setInterval(() => {
      $('#'+target).addClass(name);
      setTimeout(() => {
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

function checkSameDate(date1, date2){
	return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate();
}

function sortTable(target, col) {
	let rows, switching, i, x, y, shouldSwitch, increment = 1;  
	switching = true;
	while (switching) {
		switching = false;  
		rows = target.getElementsByTagName("TR");
		if (rows.length > 31) {
			increment = 2;
		}
		for (i = 1; i < (rows.length - 1); i+=increment) {
			//start by saying there should be no switching:  
			shouldSwitch = false;
			x = rows[i].getElementsByTagName("TD")[col];
			y = rows[i + increment].getElementsByTagName("TD")[col];
				if ((isNaN(Number(x.innerHTML))?x.innerHTML:Number(x.innerHTML)) < (isNaN(Number(y.innerHTML))?y.innerHTML:Number(y.innerHTML))) {
				shouldSwitch= true;  
				break;
			}    
		}    
		if (shouldSwitch) {
			if (rows.length > 31) {
				rows[i].parentNode.insertBefore(rows[i+increment], rows[i]);  
				rows[i+1].parentNode.insertBefore(rows[i+1+increment], rows[i+1]);  
			} else {
				rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);  
			}
			switching = true;
		}    
	}   
	$(target).find('th').removeClass('text-danger'); 
	$(target).find('th:eq('+col+')').addClass('text-danger'); 
 } 
 
// Global stuff
$('#loginSubmit').on('click', () => {
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

$('#registerSubmit').on('click', () => {
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
      const register = await navigator.serviceWorker.register("/js/worker.js");
      const subscription = await register.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: urlBase64ToUint8Array('BCStsAHlI_a_jYeD3x8km8xkiTnIv-2iR0oigfMZLZpT2WgUi9lv-8kA7WcdQwenhdMb9uqsrMLlp0ArtTjns5o')
      });
      postOptions.body = JSON.stringify(subscription);
      fetch('/api/pushsubscribe', postOptions);
      // .catch(retData => modalAlert(retData.type,retData.message));
   }
}   

function spritePosition (sport, team) {
   var width = 56, height = 40, cols = 6, index,
      nfl_teams = ['NFL', 'ARI', 'CAR', 'CHI', 'DAL', 'DET', 'GB', 'MIN', 'NO', 'NYG','PHI','SEA','SF','LAR', 'TB', 'WAS', 'BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'KC', 'JAC', 'IND', 'MIA', 'NE', 'NYJ', 'LV', 'PIT', 'LAC', 'TEN', 'ATL'];
      nba_teams = ['NBA', 'BOS', 'BKN', 'CHR', 'CLE', 'DAL', 'DET', 'IND', 'LAC', 'LAL','MIA','NOP','NY','OKC', 'ORL', 'PHI', 'PHO', 'SAC', 'TOR', 'UTA', 'WAS', 'ATL', 'CHI', 'DEN', 'GS', 'HOU', 'MEM', 'MIL', 'MIN', 'POR', 'SAN'];
   if (sport == 'nfl')
      index = nfl_teams.indexOf(team);
   else
      index = nba_teams.indexOf(team);
   if (index < 0)
      index = 0;
   return index%cols*width*-1+'px '+Math.floor(index/cols)*height*-1+'px';
}

function spritePosition2 (sport, team) {
   var width = 35, height = 25, cols = 6, index,
      nfl_teams = ['NFL', 'ARI', 'CAR', 'CHI', 'DAL', 'DET', 'GB', 'MIN', 'NO', 'NYG','PHI','SEA','SF','LAR', 'TB', 'WAS', 'BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'KC', 'JAC', 'IND', 'MIA', 'NE', 'NYJ', 'LV', 'PIT', 'LAC', 'TEN', 'ATL'];
      nba_teams = ['NBA', 'BOS', 'BKN', 'CHR', 'CLE', 'DAL', 'DET', 'IND', 'LAC', 'LAL','MIA','NOP','NY','OKC', 'ORL', 'PHI', 'PHO', 'SAC', 'TOR', 'UTA', 'WAS', 'ATL', 'CHI', 'DEN', 'GS', 'HOU', 'MEM', 'MIL', 'MIN', 'POR', 'SAN'];
   if (sport == 'nfl')
      index = nfl_teams.indexOf(team);
   else
      index = nba_teams.indexOf(team);
   if (index < 0)
      index = 0;
   return index%cols*width*-1+'px '+Math.floor(index/cols)*height*-1+'px';
}
