(function() {
    "use strict";

    let scrolledToDay;
    let actions = {
        toggleShowDetails: function($showRow) {
            $showRow.toggleClass('detailed');
        },
        scrollToDay: function(day) {
            scrolledToDay = day;
            let $dayNode = $('.date-' + day);
            if ($dayNode.length) {
                $("html, body").animate({
                    scrollTop: $dayNode.offset().top - $('.main-header').height()
                }, '300', 'swing');
            }
        },
        fixScrolledToDay: function() {
            if (scrolledToDay) {
                if (!isSmallViewport()) {
                    setTimeout(() => actions.scrollToDay(scrolledToDay), 300);
                }
            }
        }
    };

    function isSmallViewport() {
        return false; //ResponsiveBootstrapToolkit.is('xs') || ResponsiveBootstrapToolkit.is('sm');
    }

    function fixPosterMargin() {
        if (isSmallViewport()) {
            let tries = 5;
            let interval = setInterval(function() {
                let headerHeight = $('.main-header').height();
                $('.scroll-top').css({'top': headerHeight});
                $('.filters-col').css({'margin-top': headerHeight});
                if (!--tries) {
                    clearInterval(interval);
                }
            }, 500);
        }
    }


    $('.show-title a').click(function(event) {
        event.preventDefault();
        actions.toggleShowDetails($(event.target).closest('.show-row'));
    });

    $('.calendar .day').click(function(event) {
        actions.scrollToDay($(event.target).data('day'));
    });

})(jQuery);