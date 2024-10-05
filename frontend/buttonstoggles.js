// class used by sidebar page selection to close
$('.toggleSidebar').on('click', () =>  {
   $('#wrapper').toggleClass('toggled');
});

function toggleSport(sport) {
   $('.sportPick').removeClass('selected');
   $('.sportPick.'+sport).addClass('selected');
   document.cookie = 'sport='+sport+';max-age=43200';
}

$('.sportPick').on('click', () => {
   if (!$(this).hasClass('selected')) {
      let sport = $(this).attr('class').split(/\s+/)[1];
      toggleSport(sport);
		initPage();
   }
});

function collapseIconAction(target) {
   if ($('#'+target+'Title').children().hasClass('open'))
      $('#'+target).addClass('in'); //actually opens/uncollapses pane
   $('#'+target+'Title span.collapseIcon').removeClass('hidden');  // show icon which defaults to hidden
}

// handles collapse icon animation
$('.collapseIcon').on('click', event => {
   $(this).toggleClass('open');
});

//bet modal has +/- to increment/decrement values
$('.btn-increment').on('click', event => {
	event.preventDefault();
	let increment = 0.5;
	if ($(this).val() > 1)		// button val of 0,1 increment by .5. val of 2,3 by 1
		increment = 1;
   if ($(this).val() % 2) {	// odd button are +
      $(this).prev().val(Number($(this).prev().val())+increment);
      $(this).prev().addClass('bg-danger');
} else {								// odd button are -
      $(this).next().val(Number($(this).next().val())-increment);
      $(this).next().addClass('bg-danger');
   }
});

$(document).on('swipeleft', event => {
   // $("#wrapper").css('margin-left', '-360px');
   window.location.href = urls[(getUrlPos(window.location.pathname)+1)%urls.length];
});

$(document).on('swiperight', event => {
   // $("#wrapper").css('margin-left', '360px');
   window.location.href = urls[(getUrlPos(window.location.pathname)-1 < 0)?urls.length-1:getUrlPos(window.location.pathname)-1];
});
