function showLogs() {
   fetch('/api/getlogs', getOptions)
   .then(res =>res.json())
   .then(retData => {
      var outp = '<table class="table"><tr><th>Time</th><th>Msg</th></tr>';
      $.each(retData, function(i,rec){
         outp += '<tr><td>'+rec.time+'</td><td>'+rec.msg+'</td></tr>';
      });
      outp += '</table>';
      document.getElementById("logArea").innerHTML = outp;
   })
	.catch(retData => modalAlert(retData.type, retData.message));
}

function testResults(){
	let sport = 'nba';
	postOptions.body = JSON.stringify({
		'sport': sport+'tourney',
		'season': 2021
	});
	fetch('/api/testresults', postOptions)
	.then(res => res.json())
	.then(retData => {
		let points=[];
		let outp = '<table class="table table-consdensed"><tr><th>Game</th><th>Winner</th>';
		retData.users.forEach((rec, userIndex) =>{
			outp += '<th>'+bafusers[rec.user]+'</th>';
			points[userIndex] = 0; // initialize for all users, used for projections
		});
		outp += '<tr>';
		let multiplier = 1;
		retData.results.forEach((item, gameIndex) => {
			outp += '<tr><td>'+item.team+'</td><td>'+item.status+'</td>';
			retData.users.forEach((rec, userIndex) =>{
				outp += '<td>'+rec[gameIndex]+'</td>';
				if (gameIndex > 7 && gameIndex < 12) {
					multiplier = 2;
				} else if (gameIndex > 11 && gameIndex < 14) {
					multiplier = 3;
				} else if (gameIndex == 14){
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
		console.log(points[0]);
	});
}