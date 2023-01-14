let afcSeeding = [['KC', 'BUF', 'CIN', 'JAC', 'LAC', 'BAL', 'MIA'], ['', '','', ''], ['',''],['']];
let nfcSeeding = [['PHI','SF', 'MIN', 'TB', 'DAL', 'NYG', 'SEA'],['', '','', ''], ['',''],['']];
let eastSeeding = ['MIA', 'PHI', 'BOS', 'MIL', 'CHI', 'BKN', 'TOR', 'ATL'];
let westSeeding = ['PHO', 'DAL', 'MEM', 'GS', 'DEN', 'MIN', 'UTA', 'LAC'];
let bracket =[[], [], [], []];

function updateBracket(sport, startRound) {
	let teams;
	for(let round = startRound; round < 4; round++){
		if (sport == 'nfl'){
			let afc = [...afcSeeding[round]], nfc = [...nfcSeeding[round]];
			if (round == 0){
				afcSeeding[1][0] = afc.shift();
				nfcSeeding[1][0] = nfc.shift();
			}
			teams = [[...afc], [...nfc]];
		} else {
			teams = [[...eastSeeding], [...westSeeding]];
		}
		bracket[round] = [];
		teams.forEach(conference => {
			const num = conference.length;
			for (let index = 0; index < num; index++) {
				if (index%2) {
					bracket[round].push(conference.shift());
				} else {
					bracket[round].push(conference.pop());
				}
			}
		});
	}
}

function removeOpponent(startRound, team){
	let btn, seeding;
	if (afcSeeding[0].indexOf(team) < 0){
		seeding = nfcSeeding;
	} else {
		seeding = afcSeeding;
	}
	for (let round = startRound; round < bracket.length; round++) {
		btn = document.querySelector('button[data-round="'+round+'"][data-name="'+team+'"]');
		if(btn && btn.classList.contains('btn-success')){ //remove green if picked already
			btn.classList.remove('btn-success');
			btn.classList.add('btn-default');
		}
		seeding[round].splice(seeding[round].indexOf(team),1);
		seeding[round].push('');
		// bracket[round] = bracket[round].map(element => element == team?'':element);
		// seeding[round] = seeding[round].map(element => element == team?'':element);
	}
}

function toggleChoice(targetBtn){
	let sport = $('.sportPick.selected').text().toLowerCase();
	let otherBtn;
	const round = Number(targetBtn.dataset.round);
	const name = targetBtn.dataset.name;
	document.querySelectorAll('button[data-game="'+targetBtn.dataset.game+'"][data-round="'+round+'"]').forEach(team => {
		if(team.dataset.name != name) {
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
	// place team in next round 
	if (round < 3) {
		removeOpponent(round+1, otherBtn.dataset.name); // clear things out
		let index, location, conference, start, end;

		if (sport == 'nfl') {
			const midNext = 6 - 2 * (round+1); // find middle of next round
			if (bracket[round].indexOf(name) < bracket[round].length/2) {
				conference = afcSeeding;
			} else {
				conference = nfcSeeding;
			}
			// newConference = bracket[round+1].slice(0, midNext).filter(element => element != ''); 
			for (location = 0; location < conference[round+1].length; location++){
				if (conference[round+1][location] == '' || conference[0].indexOf(name) < conference[0].indexOf(conference[round+1][location])){
					break;
				}
			}
			conference[round+1].splice(conference.indexOf(''),1);
			conference[round+1].splice(location, 0, name);
			updateBracket('nfl', round+1);
		} else {
		 index = Number(targetBtn.dataset.game) % 2  + Math.trunc(Number(targetBtn.dataset.game) / 2) * 2;
		 bracket[round+1][index] = name;
		}
	}
	drawSprite(sport);
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
			// if (retData.users){
			// 	initBracket(retData.users, sport);
			// } else {
				updateBracket('nfl',0);
			// }
			// initBracket_old(sport);
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
		const sportNum = (sport == 'nfl')?13:15;
		if ($('.btn-toggle.btn-success').length != sportNum) {
			modalText = 'Warning, only '+$('.btn-toggle.btn-success').length+' out of '+sportNum+' picks chosen.  Still send?';
		}
		$('#tourneyAcceptText').text(modalText);
		$('#tourneySport').val(sport);
		$('#tourneyPicks').val(JSON.stringify(picks));
	}
});

$('#tourneyAcceptSubmit').on('click', function() {
   postOptions.body = JSON.stringify({
		'sport': $('#tourneySport').val()+'tourney',
		'season': $('#bracketYear').val(),
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

function initBracket(picks, sport){
	let round=0, slot=0;
	for (let index=0; index < (sport == 'nfl'?26:30); ++index){
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