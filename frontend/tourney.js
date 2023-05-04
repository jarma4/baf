let seeding1 = [[], ['', '','', ''], ['',''],['']];
let seeding2 = [[],['', '','', ''], ['',''],['']];
let bracket =[[], [], [], []];

function updateBracket(sport, startRound, picks) {
	let teams;
	for(let round = startRound; round < 4; round++){
		// get seeding for round; toggleChoice modifies seeding
		if (sport == 'nfl'){
			let afc = [...seeding1[round]], nfc = [...seeding2[round]];
			if (round == 0 && !picks){
				seeding1[1][0] = afc.shift();
				seeding2[1][0] = nfc.shift();
			}
			teams = [[...afc], [...nfc]];
		} else {
			teams = [[...seeding1[round]], [...seeding2[round]]];
		}
		// place in bracket according to seeding
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

function toggleChoice(targetBtn){
	const sport = $('.sportPick.selected').text().toLowerCase();
	let otherBtn, modifier = 0;
	const round = Number(targetBtn.dataset.round);
	const game = Number(targetBtn.dataset.game);
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
		let index, location, conference;

		if (bracket[round].indexOf(name) < bracket[round].length/2) {
			conference = seeding1;
		} else {
			conference = seeding2;
			modifier = 4;
		}
		if (sport == 'nfl' || (sport == 'nba' && round != 0)) { // subsequent rounds are reseeded according to start seeding
			for (location = 0; location < conference[round+1].length; location++){
				if (conference[round+1][location] == '' || conference[0].indexOf(name) < conference[0].indexOf(conference[round+1][location])){
					break;
				}
			}
			conference[round+1].splice(conference.indexOf(''),1);
			conference[round+1].splice(location, 0, name);
		} else { // nba is 1-8 vs 4-5, 2-7 vs 3-6
			if (game - modifier == 0 || game - modifier == 3){
				if(conference[round+1][0] == ''){
					if (conference[round+1][3] != '' && conference[0].indexOf(name) > conference[0].indexOf(conference[round+1][3])) {
						conference[round+1][0] = conference[round+1][3];
						conference[round+1][3] = name;	
					} else{
						conference[round+1][0] = name;
					}
				} else if (conference[0].indexOf(name) < conference[0].indexOf(conference[round+1][0])) {
					conference[round+1][3] = conference[round+1][0];
					conference[round+1][0] = name;	
				} else {
					conference[round+1][3] = name;
				}
			} else {
				if(conference[round+1][1] == ''){
					if (conference[round+1][2] != '' && conference[0].indexOf(name) > conference[0].indexOf(conference[round+1][2])) {
						conference[round+1][1] = conference[round+1][2];
						conference[round+1][2] = name;	
					} else{
						conference[round+1][1] = name;
					}
				} else if (conference[0].indexOf(name) < conference[0].indexOf(conference[round+1][1])) {
					conference[round+1][2] = conference[round+1][1];
					conference[round+1][1] = name;	
				} else {
					conference[round+1][2] = name;
				}
			}
		}
		updateBracket(sport, round+1);
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
			if (retData.users) {
				seeding1 = [[],[],[],[]];
				seeding2 = [[],[],[],[]];
				const teamsPerRound = (sport == 'nfl')?[12, 8, 4, 2]:[8,12,14];
				let round = 0, roundCount=0;
				for (let index=0; index < ((sport == 'nfl')?26:30); index++){
					if (roundCount == teamsPerRound[round]){
						round++;
						roundCount = 0;
					}
					if (roundCount < teamsPerRound[round]/2) {
						seeding1[round].splice(Math.trunc(roundCount/2), 0, retData.users[index]);
					} else {
						seeding2[round].splice(Math.trunc((roundCount-teamsPerRound[round]/2)/2), 0, retData.users[index]);
					}
					roundCount++;
				}
			} else {
				seeding1[0] = [...retData.seeding[0]];
				seeding2[0] = [...retData.seeding[1]];
			}
			updateBracket(sport, 0, retData.users);
			let outp = '<table class="table table-consdensed">';
			roundInfo.forEach(round => {
				outp += '<tr class="modal-warning"><td colspan=4 class="center odds-date-row">'+round.title+'</td></tr>';
				gameIndex = 0;
				bracket[roundIndex].forEach((team, index) => {
					if (index%2 == 0) {
						outp += '<tr>';
					}
					outp += '<td class="td-odds"><button class="btn btn-toggle ';
					if(team.endsWith('*')){ // color choice green and remove * in arrays
						outp += 'btn-success" ';
						bracket[roundIndex][index] = bracket[roundIndex][index].slice(0,-1);
						if (seeding1[roundIndex].indexOf(team) != -1) {
							seeding1[roundIndex].splice(seeding1[roundIndex].indexOf(team), 1, team.slice(0,-1));
						} else {
							seeding2[roundIndex].splice(seeding2[roundIndex].indexOf(team), 1, team.slice(0,-1));
						}
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
		} else { // picking over, show results
			let points=[];
			let outp = '<table class="table table-consdensed"><tr><th>Game</th><th>Win</th>';
			retData.users.forEach((rec, userIndex) =>{
				outp += '<th>'+bafusers[rec.user]+'</th>';
				points[userIndex] = 0;
			});
			outp += '<tr>';
			let multiplier = 1;
			retData.results.forEach((item, gameIndex) => {
				const lines = (sport == 'nfl')?[6,10,12]:[8,12,14];
				if (lines.includes(gameIndex)){
					outp += '<tr class="modal-primary"><td colspan="'+(retData.users.length+1)+'"><td></tr>';
				}
				outp += '<tr height="1px"><td style="font-style:italic">'+item.team+'</td><td>'+item.status+'</td>';
				retData.users.forEach((rec, userIndex) =>{
					outp += '<td class="'+((rec[gameIndex]==item.status)?'heading-success':'')+'">'+rec[gameIndex]+'</td>';
					if ((sport == 'nfl' && gameIndex > 5 && gameIndex < 10) || (sport == 'nba' && gameIndex > 7 && gameIndex < 12)) {
						multiplier = 2;
					} else if ((sport == 'nfl' && gameIndex > 9 && gameIndex < 12) || (sport == 'nba' && gameIndex > 11 && gameIndex < 14)) {
						multiplier = 3;
					} else if ((sport == 'nfl' && gameIndex == 12) || (sport == 'nba' && gameIndex == 14)) {
						multiplier = 4;
					}
					if (rec[gameIndex] == item.status){
						points[userIndex] += multiplier;
					}
				});
				outp += '</tr>';
			});
			outp += '<tr class="modal-primary"><td colspan="'+(retData.users.length+1)+'"><td></tr>';
			outp += '<tr><td style="font-style:italic">Points</td><td></td>';
			retData.users.forEach((rec, userIndex) =>{
				outp += '<td>'+points[userIndex]+'</td>';
			});
			outp += '</tr></table>';
			document.getElementById('bracketResultsArea').innerHTML = outp;
			document.getElementById('bracketActionBtn').classList.add('hidden');
		}
	});
}

function removeOpponent(startRound, team){
	let btn, seeding;
	if (seeding1[0].indexOf(team) < 0){
		seeding = seeding2;
	} else {
		seeding = seeding1;
	}
	for (let round = startRound; round < bracket.length; round++) {
		btn = document.querySelector('button[data-round="'+round+'"][data-name="'+team+'"]');
		if(btn && btn.classList.contains('btn-success')){ //remove green if picked already
			btn.classList.remove('btn-success');
			btn.classList.add('btn-default');
		}
		if(seeding[round].indexOf(team) != -1) { // team is in seeding
			seeding[round].splice(seeding[round].indexOf(team),1, '');
			// seeding[round].push('');
		}
		bracket[round] = bracket[round].map(element => element == team?'':element); // bracket different than seeding
	}
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
	if(!event.currentTarget.dataset.name)
		return;
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
