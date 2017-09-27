// below uses ChartJS library
function drawChart(days) {
   var colors = ["blue", "red", "white", "green", "yellow", "purple", "orange", "lightgreen", "teal", "pink", "lightblue", "gray"],
      chartData = {
         labels: [],
         datasets: [],
      },
      chartOptions = {
         scales: {
            yAxes: [{
               gridLines: {
                  color: '#444'
               }
            }]
         },
         legend: {
            position: 'bottom'
         }
      };

   Chart.defaults.global.defaultFontColor = '#fff';
   Chart.defaults.global.elements.line.tension = 0.2;
   Chart.defaults.global.elements.line.borderWidth = 2;
   Chart.defaults.global.elements.line.fill = false;

   $.ajax({
      type: 'POST',
      url: '/api/graphstats',
      data: {
         user: 'ALL',
         days: days,
         sport: ($('#sportNfl').hasClass('selected'))?'nfl':($('#sportNba').hasClass('selected'))?'nba':'ncaa',
         season: $('#statsYear').val()
      },
      success: function(retData){
         chartData.labels = retData.xaxis;
         $.each(retData.datasets, function(index, user){
            var obj = {
               label: user.name,
               borderColor: colors[index],
               data: user.data
            };
            chartData.datasets.push(obj);
         });
         if (winChart)
            winChart.destroy();
         winChart = new Chart(document.getElementById("winGraph").getContext("2d"), {
            type: 'line',
            data: chartData,
            options: chartOptions
         });
      },
		error: function(retData){
         modalAlert(retData.type, retData.message);
		}
   });
}

// change chart period - currently unused
$('#graphDays').on('click', function(event){
   event.preventDefault();
   if ($('#graphDays').text() == '30days') {
         $('#graphDays').text('60days');
         drawChart(60);
   } else if ($('#graphDays').text() == '60days') {
      $('#graphDays').text('Season');
      drawChart(90);
   } else {
      $('#graphDays').text('30days');
      drawChart(30);
   }
});