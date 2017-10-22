// class used by sidebar page selection to close
$('.toggleSidebar').on('click', function() {
   $('#wrapper').toggleClass('toggled');
});

function toggleSport(sport) {
   if (sport == 'nba') {
      $('#sportNba').addClass('selected');
      $('#sportNfl').removeClass('selected');
      $('#sportNcaa').removeClass('selected');
      document.cookie = 'sport=nba;max-age=43200';
   } else if (sport == 'nfl'){
      $('#sportNfl').addClass('selected');
      $('#sportNba').removeClass('selected');
      $('#sportNcaa').removeClass('selected');
      document.cookie = 'sport=nfl;max-age=43200';
   } else {
      $('#sportNcaa').addClass('selected');
      $('#sportNfl').removeClass('selected');
      $('#sportNba').removeClass('selected');
      document.cookie = 'sport=ncaa;max-age=43200';
   }
}

$('.sportPick').on('click', function(){
   if (!$(this).hasClass('selected') && !$(this).hasClass('dimmed')) {
      if ($(this).is($('#sportNfl')))
         toggleSport('nfl');
      else if ($(this).is($('#sportNba')))
         toggleSport('nba');
      else
         toggleSport('ncaa');
      // according to what page you're on, refresh data
      switch (window.location.pathname) {
         case '/':
         case '/odds':
            getOdds();
            getBets(($('#sportNfl').hasClass('selected'))?10:($('#sportNba').hasClass('selected'))?11:12,'watchBets', 'watch');
            break;
         case '/stats':
            getStats();
            break;
         case '/scores':
            showScores(($('#sportNfl').hasClass('selected'))?getWeek(new Date(), 'nfl'):new Date());
            break;
         case '/overunder':
            getOverunder();
            break;
      }
   }
});

function collapseIconAction(target) {
   if ($('#'+target+'Title').children().hasClass('open'))
      $('#'+target).addClass('in'); //actually opens/uncollapses pane
   $('#'+target+'Title span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
}

// handles collapse icon animation
$('.collapseIcon').on('click', function(event){
   $(this).toggleClass('open');
});

//bet modal has +/- to increment/decrement values
$('.btn-increment').on('click', function(event){
   event.preventDefault();
   if ($(this).val()=='1') {
      $(this).prev().val(Number($(this).prev().val())+0.5);
      $(this).prev().addClass('bg-danger');
   } else {
      $(this).next().val(Number($(this).next().val())-0.5);
      $(this).next().addClass('bg-danger');
   }
});

$(document).on('swipeleft', function(event){
   // $("#wrapper").css('margin-left', '-360px');
   window.location.href = urls[(getUrlPos(window.location.pathname)+1)%urls.length];
});

$(document).on('swiperight', function(event){
   // $("#wrapper").css('margin-left', '360px');
   window.location.href = urls[(getUrlPos(window.location.pathname)-1 < 0)?urls.length-1:getUrlPos(window.location.pathname)-1];
});
