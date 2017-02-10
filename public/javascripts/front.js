(function() {
    "use strict";

    let scrolledToDay;
    let filter = {};
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
                    setTimeout(() => actions.scrollToDay(scrolledToDay), 0);
                }
            }
        },
        resetScrolledToDay: function() {
            scrolledToDay = null;
        },
        toggleFilter: function(filterName, value, on) {
            filter[filterName] = filter[filterName] || [];
            if (on) {
                filter[filterName].push(value);
            } else {
                const index = filter[filterName].indexOf(value);
                if (index >= 0) {
                    filter[filterName].splice(index, 1);
                }
            }
            this.applyFilter();
        },
        applyFilter: function() {
            let $rows = $('.show-row');
            let groups = getFilterClassesGrouped();
            if (!groups.length) {
                $rows.show();
            } else {
                $rows.each(function () {
                    let $showRow = $(this);
                    $showRow.toggle(groups.every(selector => $showRow.is(selector)));
                });
            }
            $('.month .day').each(function() {
                $(this).toggleClass('no-shows', !$(this).has('.show-row:visible').length)
            });
            this.fixScrolledToDay();
        }
    };

    function getFilterClassesGrouped() {
        let groups = [];
        for (let filterName in filter) {
            if (!filter.hasOwnProperty(filterName)) continue;
            if (filter[filterName].length) {
                groups.push(filter[filterName].map(className => '.' + className).join(','))
            }
        }
        return groups;
    }

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

    $('.filter-block.play-types [type="checkbox"]').click(function(event) {
        actions.toggleFilter('type', event.target.name, event.target.checked);
    });
    $('.filter-block.scenes [type="checkbox"]').click(function(event) {
        actions.toggleFilter('scene', event.target.name, event.target.checked);
    });

})(jQuery);