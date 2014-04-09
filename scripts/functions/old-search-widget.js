Modernizr.load({
	load: 'http://staff.library.nova.edu/library/assets/js/frontpage.js',
	complete: function() {
		$('section#old-search-widget').load('ajax/old-search-widget.html', function() {
			$('#tabs').tabs();
		});
	}
});
