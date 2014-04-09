/* ==================
 * Carousel */
sherman_carousel = function() {

	ajax_carousel = function() {
		$('section#carousel').load('ajax/carousel.html', function() {

			var device = ( responsive_viewport < 768 ) ? 'phone' : 'screens';

			var carouselJSON = 'http://sherman.library.nova.edu/sites/api/taxonomy/get_taxonomy_posts/?taxonomy=carousel_for_device&slug=' + device + '&custom_fields=Link&callback=?';
			
			$.getJSON( carouselJSON )
				.success(function(response) {

					var carouselHTML = '';

					$.each(response.posts, function( i, post) {

						var thumbnail  	= post.thumbnail,
							slide 		= thumbnail.replace('-125x125', '');

						carouselHTML += '<li><a href="' + post.custom_fields['Link'] + '" title="' + post.title + '">';
						carouselHTML += '<img src="' + slide + '" alt="' + post.custom_fields['Description'] + '">';
						carouselHTML += '</a></li>';

					});

					$('ul.slides').html(carouselHTML);
					$('.flexslider').flexslider();
				}); // .getJSON

		});
	}


	
	Modernizr.load([
	{
		load: '//sherman.library.nova.edu/cdn/scripts/libs/flexslider.min.js',
		complete: function() {
			ajax_carousel();
		}
	}
]);

} // sherman_carousel()
sherman_carousel();