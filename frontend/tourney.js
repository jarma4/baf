let afcSeeding = ['BUF', 'KC', 'CIN', 'JAC', 'BAL', 'LAC', 'MIA'];
let nfcSeeding = ['PHI', 'MIN', 'SF', 'TB', 'DAL', 'NYG', 'WAS'];
let eastSeeding = ['MIA', 'PHI', 'BOS', 'MIL', 'CHI', 'BKN', 'TOR', 'ATL'];
let westSeeding = ['PHO', 'DAL', 'MEM', 'GS', 'DEN', 'MIN', 'UTA', 'LAC'];
// let eastSeeding = ['ATL', 'TOR', 'BKN', 'CHI', 'MIL', 'BOS', 'PHI', 'MIA'];
let bracket =[[], ['', '','', '','', '','', ''], ['', '','', ''], ['','']];

// initial draw: round1 2-7; round2 
function initBracket_old(sport) {
	let round;
	if (sport == 'nfl'){
		round = [[...afcSeeding], [...nfcSeeding]];
	} else {
		round = [[...eastSeeding], [...westSeeding]];
	}
	round.forEach(conference => {
		if (sport == 'nfl') {
			conference.shift(); // remove #1 seed leaving 6
		}
		const temp = conference.length;
		for (let index = 0; index < temp; index++) {
			if (index%2) {
				bracket[0].push(conference.shift());
			} else {
				bracket[0].push(conference.pop());
			}
		}
	});
	if (sport == 'nfl') {  // buys
		bracket[1] = ['', '', '', [...afcSeeding].shift(), '', '', '', [...nfcSeeding].shift()];
	}
}

function initBracket(picks){
	let round=0, slot=0;
	for (let index=0; index < (sport == 'nfl'?28:30); ++index){
		bracket[round][slot] = picks[index];
		if (round == 0 && slot == (sport == 'nfl'?11:15)){
			++round;
			slot = 0;
		} else if (round == 1 && slot == 7){
			++round;
			slot = 0;
		} else if (round == 2 && slot == 3){
			++round;
			slot = 0;
		} else {
			++slot;
		}
	}
}
function getTourney() {
	let roundIndex = 0, gameIndex, slotIndex = 0;
	let sport = $('.sportPick.selected').text().toLowerCase();
	let roundInfo; 
	$('#bracketResultsArea').empty();
	if (sport == 'nfl') {
		roundInfo= [{title: 'Wildcard Round', number: 12}, {title: 'Division Round', number: 8}, {title: 'Conference Round', number: 4}, {title: 'Super Bowl', number: 2}];
	} else {
		roundInfo = [{title: 'First Round', number: 16}, {title: 'Conference Semi', number: 8}, {title: 'Conference Finals', number: 4}, {title: 'Finals', number: 2}];
	}
	postOptions.body = JSON.stringify({
		'sport': sport+'tourney',
		'season': $('#bracketYear').val()
	});
	fetch('/api/gettourney', postOptions)
	.then(res => res.json())
	.then(retData => {
		if (!retData.results.length) {
			// initBracket(retData.users, sport);
			initBracket_old(sport);
			let outp = '<table class="table table-consdensed">';
			roundInfo.forEach(round => {
				outp += '<tr class="modal-warning"><td colspan=4 class="center odds-date-row">'+round.title+'</td></tr>';
				gameIndex = 0;
				bracket[roundIndex].forEach((team, index) => {
					if (index%2 == 0) {
						outp += '<tr>';
					}
					outp += '<td class="td-odds"><button class="btn btn-toggle ';
					if(team.endsWith('*')){
						outp += 'btn-success" ';
						bracket[roundIndex][index] = bracket[roundIndex][index].slice(0,-1);
					} {
						outp += 'btn-default" ';
					}
					outp +='data-round="'+roundIndex+'" data-slot="'+slotIndex+'" data-game="'+gameIndex+'" data-name="'+team.slice(0,2)+'" data-team="'+((slotIndex%2)?2:1)+'"><img id="'+(slotIndex++)+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png"></button></td>';
					if (index%2) {
						outp += '</tr>';
						gameIndex++;
					}
				});
				++roundIndex;
			});
			outp += '</table>';
			document.getElementById('bracketPicksArea').innerHTML = outp;
			drawSprite(sport);
		} else {
			let points=[];
			let outp = '<table class="table table-consdensed"><tr><th>Game</th><th>Win</th>';
			retData.users.forEach((rec, userIndex) =>{
				outp += '<th>'+bafusers[rec.user]+'</th>';
				points[userIndex] = 0;
			});
			outp += '<tr>';
			let multiplier = 1;
			retData.results.forEach((item, gameIndex) => {
				outp += '<tr><td>'+item.team+'</td><td>'+item.status+'</td>';
				retData.users.forEach((rec, userIndex) =>{
					outp += '<td class="'+((rec[gameIndex]==item.status)?'heading-success':'')+'">'+rec[gameIndex]+'</td>';
					if (gameIndex > 7 && gameIndex < 12) {
						multiplier = 2;
					} else if (gameIndex > 11 && gameIndex < 14) {
						multiplier = 3;
					} else if (gameIndex == 14) {
						multiplier = 4;
					}
					if (rec[gameIndex] == item.status){
						points[userIndex] += multiplier;
					}
				});
				outp += '</tr>';
			});
			outp += '<tr><td>Totals</td><td></td>';
			retData.users.forEach((rec, userIndex) =>{
				outp += '<td>'+points[userIndex]+'</td>';
			});
			outp += '</tr></table>';
			document.getElementById('bracketResultsArea').innerHTML = outp;
		}
	});
}

function removeOpponent(round, team){
	let btn;
	for (let index = round; index < bracket.length; index++) {
		btn = document.querySelector('button[data-round="'+index+'"][data-name="'+team+'"]');
		if(btn && btn.classList.contains('btn-success')){
			btn.classList.remove('btn-success');
			btn.classList.add('btn-default');
		}
		bracket[index] = bracket[index].map(element => element == team?'':element);
	}
}

function toggleChoice(targetBtn){
	let sport = $('.sportPick.selected').text().toLowerCase();
	let otherBtn, working = [];
	document.querySelectorAll('button[data-game="'+targetBtn.dataset.game+'"][data-round="'+targetBtn.dataset.round+'"]').forEach(team => {
		if(team.dataset.name != targetBtn.dataset.name) {
			otherBtn = team;
		}
	});
	if (targetBtn.classList.contains('btn-default') && otherBtn.classList.contains('btn-default')) {
		targetBtn.classList.remove('btn-default');
		targetBtn.classList.add('btn-success');
	} else if (targetBtn.classList.contains('btn-default')) { //target not selected so select
		targetBtn.classList.remove('btn-default');
		targetBtn.classList.add('btn-success');
		otherBtn.classList.add('btn-default');
		otherBtn.classList.remove('btn-success');
	} else { // target selected so select other
		targetBtn.classList.add('btn-default');
		targetBtn.classList.remove('btn-success');
		otherBtn.classList.remove('btn-default');
		otherBtn.classList.add('btn-success');
	}
	if (targetBtn.dataset.round < 3) {
		removeOpponent(Number(targetBtn.dataset.round)+1, otherBtn.dataset.name);
		// place team in next round 
		const byeAdder = (sport == 'nfl' && (targetBtn.dataset.round == 0 && targetBtn.dataset.game > 2))?1:0;
		const index = Number(targetBtn.dataset.game)%2  + Math.trunc(Number(targetBtn.dataset.game)/2)*2 + byeAdder;
		bracket[Number(targetBtn.dataset.round)+1][index] = targetBtn.dataset.name;
	}
	drawSprite(sport);
}

function drawSprite(sport) {
	let slotIndex = 0;
	bracket.forEach(round => {
		round.forEach(team => {
			$('#'+slotIndex).css('object-position', spritePosition(sport, team));
			$('#'+slotIndex++).parent().attr('data-name', ((team.endsWith('*'))?team.slice(0, -1):team));
		});
	});
}

$('#bracketPicksArea').delegate('.btn-toggle', 'click' , event => {
	event.preventDefault();
	toggleChoice(event.currentTarget);
});

$('#bracketActionBtn').on('click', event => {
	let sport = $('.sportPick.selected').text().toLowerCase();
	if ($('#bracketActionBtn').text() == 'Join') {
		// fetch picks
		$('#bracketPicksArea').removeClass('hidden');
		$('#bracketActionBtn').text('Save');
		document.getElementById('bracketActionBtn').dataset.toggle = 'modal';
		document.getElementById('bracketActionBtn').dataset.target = '#tourneyModal';
} else { // button was Save
		let picks = {};
		$.each($('.btn-toggle'), (idx, game) => {
			picks[game.getAttribute('data-slot')] = game.getAttribute('data-name')+((game.classList.contains('btn-success'))?'*':'');
		});
		let modalText = "Ready to send all your picks?";
		if ($('.btn-toggle.btn-success').length != 15) {
			modalText = 'Warning, only '+$('.btn-toggle.btn-success').length+' out of 15 picks chosen.  Still send?';
		}
		$('#tourneyAcceptText').text(modalText);
		$('#tourneySport').val(sport);
		$('#tourneyPicks').val(JSON.stringify(picks));
	}
});

$('#tourneyAcceptSubmit').on('click', function() {
   postOptions.body = JSON.stringify({
		'sport': $('#tourneySport').val()+'tourney',
		'season': 2021,
		'choices': $('#tourneyPicks').val(),
	});
	fetch('/api/setouchoices', postOptions)
	.then(res => res.json())
	.then(retData => modalAlert(retData.type,retData.message))
	.catch(retData => modalAlert(retData.type,retData.message));	
});

$('#bracketYear').on('change', function(){
	getTourney();	
});