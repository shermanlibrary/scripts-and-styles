/* ==================
 * Tooltips */
tinsleyfied_tooltips = function() { 

	$('.icon-help[data-info]').on('click', function( e ) {
		var tooltip 	= $(this).data('info'),
			portlet		= $(this).parents('.portlet'),
			help 		= portlet.siblings('.help');

			console.log(portlet);

		if ( help.length === 0 ) {

	 	portlet.after('<aside class="help"><span class="icon-info" aria-hidden="true"></span><p>' + tooltip + '</p></aside>');
	 	portlet.siblings('.help').slideDown().animate({
	 		opacity: 1
	 	});

		}

		else if ( !(help.children('p').text() == tooltip) ) {
			help
			.animate({ opacity: 0}, function() {
			help.children('p').text(tooltip);
			})
			.animate({ opacity: 1 });

		}

		else {
			help.animate({
				opacity: 0
			}).slideUp(function() {
				help.remove();
			});
		}

		e.preventDefault();

	});
}
