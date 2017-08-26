// below uses ChartJS library
function drawChart(days, update) {
   var ctx = document.getElementById("winGraph").getContext("2d"),
      colors = ["blue", "red", "white", "green", "yellow", "purple", "orange", "gray", "teal"],
      chartData = {
         labels: [],
         datasets: []
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
         if (update) {
            winChart.data.labels = chartData.labels;
            winChart.data.datasets = chartData.datasets;
            winChart.update();
         } else {
            winChart = new Chart(ctx, {
               type: 'line',
               data: chartData,
               //  options: chartOptions
            });
            winChart.options.scales.yAxes[0].gridLines.color = '#444';
            winChart.options.legend.position = 'bottom';
         }
      },
		error: function(retData){
         alert(retData.type, retData.message);
		}
   });
}

// change chart period - currently unused
$('#graphDays').on('click', function(event){
   event.preventDefault();
   if ($('#graphDays').text() == '30days') {
         $('#graphDays').text('60days');
         drawChart(60, 1);
   } else if ($('#graphDays').text() == '60days') {
      $('#graphDays').text('Season');
      drawChart(90, 1);
   } else {
      $('#graphDays').text('30days');
      drawChart(30, 1);
   }
});
