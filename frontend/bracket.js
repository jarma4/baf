let picks = [{'0':0,'1':0,'2':0,'3':0,'4':0,'5':0,'6':0,'7':0,'8':0,'9':0,'10':0,'11':0,'12':0}];

let afcSeeding = ['TEN', 'KC', 'BUF', 'CIN', 'LV', 'NE', 'PIT'];
let nfcSeeding = ['GB', 'TB', 'DAL', 'LAR', 'ARI', 'SF', 'PHI'];
let roundName = ['Wildcard Round', 'Division Round', 'Conference Round', 'Super Bowl'];
let bracket =[[], [], [], []];
// initial draw: round1 2-7; round2 
function initBracket() {
	let round = [[...afcSeeding], [...nfcSeeding]];
	round.forEach(conference => {
		conference.shift(); // remove #1 seed leaving 6
		const temp = conference.length;
		for (let index = 0; index < temp; index++) {
			if (index%2) {
				bracket[0].push(conference.shift());
			} else {
				bracket[0].push(conference.pop());
			}
		}
	});
	bracket[1] = ['', '', '', [...afcSeeding].shift(), '', '', '', [...nfcSeeding].shift()];
	bracket[2] = ['', '','', ''];
	bracket[3] = ['',''];
}

function getBracket() {
	let sport = 'nfl';
	let gameIndex=0, slotIndex = 0;
	let outp = '<table class="table table-consdensed">';
	initBracket();
	bracket.forEach((round, roundIndex) => {
		outp += '<tr class="modal-warning"><td colspan=4 class="center odds-date-row">'+roundName[roundIndex]+'</td></tr>';
		round.forEach((team, index) => {
			if (index%2 == 0) {
				outp += '<tr>';
			}
			outp += '<td class="td-odds"><button class="btn btn-toggle '+((!picks.length || (picks[0][gameIndex] == '1' && index%2 == 0) || (picks[0][gameIndex] == '2' && index%2))?'btn-success':'btn-default')+'" data-slot="'+slotIndex+'" data-game="'+gameIndex+'" data-name="'+team+'" data-round="'+roundIndex+'"><img id="'+(slotIndex++)+'" class="logo-md" src="images/'+sport+'_logo_sprite_medium.png"></button></td>';
			if (index%2) {
				outp += '</tr>';
				gameIndex++;
			}
		});
	});
	outp += '</table>';
	document.getElementById('bracketPicksArea').innerHTML = outp;
	drawSprite(sport);
}

function removeOpponent(round, team){
	for (let index = round; index < bracket.length; index++) {
		bracket[index] = bracket[index].map(element => element == team?'':element);
	}
}

function toggleChoice(targetBtn){
	let otherBtn, working = [];
	document.querySelectorAll('button[data-game="'+targetBtn.dataset.game+'"]').forEach(team => {
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
	// look at slot#, 
	if (targetBtn.dataset.slot < 6) {
		removeOpponent(1,otherBtn.dataset.name); // if exist
		working = bracket[1].slice(0,4); // get conference teams
		working.push(targetBtn.dataset.name); // add chosen team
		if(working.length>4) { // remove empty slot if full
			working.splice(working.indexOf(''),1);
		}
		// order according to seeding; empty slot given 999 so sort puts at end
		working = working.map(team => (afcSeeding.indexOf(team)<0)?999:afcSeeding.indexOf(team)).sort();
		working = working.map(seed => (seed == 999) ? '': afcSeeding[seed]); // get names from seeding
		const temp = working.length;
		for (let index = 0; index < temp; index++) { // put in bracket
			if (index%2) {
				bracket[1][3-index] = working.pop();
				// bracket[1][3-index].dataset.name = working.pop();
			} else {
				bracket[1][3-index] = working.shift();
				// bracket[1][3-index].dataset.name = working.shift();
			}
		}
	} else if (targetBtn.dataset.slot > 5 && targetBtn.dataset.slot < 12) {
		removeOpponent(1,otherBtn.dataset.name); // if exist
		working = bracket[1].slice(4,bracket[1].length); // get conference teams
		working.push(targetBtn.dataset.name); // add chosen team
		if(working.length>4) { // remove empty slot if full
			working.splice(working.indexOf(''),1);
		}
		// order according to seeding; empty slot given 999 so sort puts at end
		working = working.map(team => (nfcSeeding.indexOf(team)<0)?999:nfcSeeding.indexOf(team)).sort();
		working = working.map(seed => (seed == 999) ? '': nfcSeeding[seed]); // get names from seeding
		const temp = working.length;
		for (let index = 0; index < temp; index++) { // put in bracket
			if (index%2) {
				bracket[1][7-index] = working.pop();
			} else {
				bracket[1][7-index] = working.shift();
			}
		}
	} else if (targetBtn.dataset.slot > 11 && targetBtn.dataset.slot < 16) {
		removeOpponent(2,otherBtn.dataset.name); // if exist
		working = bracket[2].slice(0,2); // get conference teams
		working.push(targetBtn.dataset.name); // add chosen team
		if(working.length>2) { // remove empty slot if full
			working.splice(working.indexOf(''),1);
		}
		// order according to seeding; empty slot given 999 so sort puts at end
		working = working.map(team => (afcSeeding.indexOf(team)<0)?999:afcSeeding.indexOf(team)).sort();
		working = working.map(seed => (seed == 999) ? '': afcSeeding[seed]); // get names from seeding
		const temp = working.length;
		for (let index = 0; index < temp; index++) { // put in bracket
			if (index%2) {
				bracket[2][1-index] = working.pop();
			} else {
				bracket[2][1-index] = working.shift();
			}
		}
	} else if (targetBtn.dataset.slot > 15 && targetBtn.dataset.slot < 20) {
		removeOpponent(2,otherBtn.dataset.name); // if exist
		working = bracket[2].slice(2,bracket[2].length); // get conference teams
		working.push(targetBtn.dataset.name); // add chosen team
		if(working.length>2) { // remove empty slot if full
			working.splice(working.indexOf(''),1);
		}
		// order according to seeding; empty slot given 999 so sort puts at end
		working = working.map(team => (nfcSeeding.indexOf(team)<0)?999:nfcSeeding.indexOf(team)).sort();
		working = working.map(seed => (seed == 999) ? '': nfcSeeding[seed]); // get names from seeding
		const temp = working.length;
		for (let index = 0; index < temp; index++) { // put in bracket
			if (index%2) {
				bracket[2][3-index] = working.pop();
			} else {
				bracket[2][3-index] = working.shift();
			}
		}
	}
	drawSprite('nfl');
	// getBracket();
}

function drawSprite(sport) {
	let slotIndex = 0;
	bracket.forEach(round => {
		round.forEach(team => {
			$('#'+slotIndex).css('object-position', spritePosition(sport, team));
			$('#'+slotIndex++).parent().attr('data-name', team);
		});
	});
}

$('#bracketPicksArea').delegate('.btn-toggle', 'click' , event => {
	event.preventDefault();
	// let button = $(event.currentTarget);
	toggleChoice(event.currentTarget);
	// toggleChoice(button.data('game'));
});

$('#bracketSubmitBtn').on('click', event => {
	if ($('#bracketSubmitBtn').text() == 'Join') {
		$('#bracketPicksArea').removeClass('hidden');
		$('#bracketSubmitBtn').text('Save');
	} else { // button was Save
		let picks = {};
		$.each($('#bracketPicksArea .btn-success'), (idx, game) => {
			picks[idx] = game.getAttribute('data-team');
		});
		postOptions.body = JSON.stringify({
			'picks': JSON.stringify(picks),
			'season': $('#bracketYear').val(),
			'sport': $('.sportPick.selected').attr('class').split(/\s+/)[1],
			'date': new Date($('#bracketDate').data('date'))
		});
		fetch('/api/updatebracket', postOptions)
		.then(res => res.json())
		.then(retData => modalAlert(retData.type,retData.message))
		.catch(retData => modalAlert(retData.type,retData.message));	
	}
});