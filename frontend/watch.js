function resetOddsWatch(){
   $('#betUserlist').removeClass('nodisplay');
   $('#userList').prop('disabled', false);
   $('#oddsWatchArea').addClass('nodisplay');
   $('#betSubmit').text('Send Bet');
   $('#oddsWatch').prop('checked', false);
}

// change bet modal according to checkbox
$('#oddsWatch').on('click', function(event) {
   $('#oddsWatchArea').toggleClass('nodisplay');
   if ($("#oddsWatch").is(":checked")) {
      $('#userList').prop('disabled', 'disabled');
   } else {
      $('#userList').prop('disabled', false);
   }
   $('#oddsWatchSend').prop('checked', false);
   if($('#betSubmit').text() == 'Send Bet')
      $('#betSubmit').text('Save Odds Watch');
   else
      $('#betSubmit').text('Send Bet');
});

// change bet modal according to checkbox
$('#oddsWatchSend').on('click', function(event) {
   if ($("#oddsWatchSend").is(":checked")) {
      $('#userList').prop('disabled', false);
   } else {
      $('#userList').prop('disabled', 'disabled');
   }
});

//prepopulate previously watch bet modal
$('#watchModal').on('show.bs.modal', function (event) {
   var button=$(event.relatedTarget);

   $('#watchStatus').addClass('hidden');
   $('#watchSend').prop('checked', false);
   $('#watchId').val(button.data('id'));
   $('#watchOddsNew').val(button.data('odds'));
   $('#watchTitle').text('Watch for: '+button.data('team1')+' '+button.data('odds')+' vs '+button.data('team2'));
   if(button.data('watch') % 10 == 2) {
      $('#watchStatus').removeClass('hidden');
   }
   if(button.data('watch') / 10 > 1) {
      $('#watchSend').prop('checked', true);
   }
});

$('#watchDelete').on('click', function(){
   postApi('changebet',{
         'id': $('#watchId').val(),
         'action': 'delete'});
   getBets(($('#sportNfl').hasClass('selected'))?10:11, 'watchBets', 'watch');
});

$('#watchModify').on('click', function(){
   if ($('#watch'))
   postApi('changebet',{
   		'action': 'change',
         'id': $('#watchId').val(),
         'odds': $('#watchOddsNew').val()});
         // 'status': ($('#sportNfl').hasClass('dropped'))?-1:-2});
   getBets(($('#sportNfl').hasClass('selected'))?10:11, 'watchBets', 'watch');
});
