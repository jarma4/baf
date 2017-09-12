function showLogs() {
   $.ajax({
		type: 'GET',
		url: '/api/getlogs',
		success:function(retData){
			var outp = '<table class="table"><tr><th>Time</th><th>Msg</th></tr>';
			$.each(retData, function(i,rec){
				outp += '<tr><td>'+rec.time+'</td><td>'+rec.msg+'</td></tr>';
			});
			outp += '</table>';
			document.getElementById("logArea").innerHTML = outp;
		},
		error: function(retData){
			modalAlert(retData.type, retData.message);
		}
	});
}
