(function($, viewport) {
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
        },
        applyFilter: function() {
            let $rows = $('.show-row');
            let groups = getFilterClassesGrouped();
            if (!groups.length) {
                $rows.show();
            } else {
                $rows.each(function () {
                    let $showRow = $(this);
                    $showRow.toggle(groups.every(selector => selector.length && $showRow.is(selector)));
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
            groups.push(filter[filterName].map(className => '.' + className).join(','))
        }
        return groups;
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

    $(document).ready(function() {
        const today = $('.calendar .today').data('day');
        if (today) {
            actions.scrollToDay(today);
        }
    });

    $(document).ready(function() {
        $(".lightbox").each(function(item, image) {
            $(image).imageLightbox({
                quitOnEnd: true
            })
        });
    });

    $('.show-title a').click(function(event) {
        event.preventDefault();
        actions.toggleShowDetails($(event.target).closest('.show-row'));
    });

    $('.calendar .day').click(function(event) {
        actions.scrollToDay($(event.target).data('day'));
    });

    $('.filter-block.play-ages [type="checkbox"]').click(function(event) {
        actions.toggleFilter('age', event.target.name, event.target.checked);
        actions.applyFilter();
    });
    $('.filter-block.play-types [type="checkbox"]').click(function(event) {
        actions.toggleFilter('type', event.target.name, event.target.checked);
        actions.applyFilter();
    });
    $('.filter-block.scenes [type="checkbox"]').click(function(event) {
        actions.toggleFilter('scene', event.target.name, event.target.checked);
        actions.applyFilter();
    });
    $(document).ready(function() {
        $('.filter-block.play-ages [type="checkbox"]').each(function() {
            actions.toggleFilter('age', this.name, this.checked);
        });
        $('.filter-block.play-types [type="checkbox"]').each(function() {
            actions.toggleFilter('type', this.name, this.checked);
        });
        $('.filter-block.scenes [type="checkbox"]').each(function() {
            actions.toggleFilter('scene', this.name, this.checked);
        });
        actions.applyFilter();
    });
    $('[data-disabled-if-unchecked]').each(function() {
        let $element = $(this);
        let dependencySelector = $element.data('disabled-if-unchecked');
        $(dependencySelector).click(function() {
            $element.attr('disabled', !this.checked);
        });
    });
    $(document).ready(function() {
        if (typeof window.filter === 'undefined') {
            return;
        }
        if (typeof window.filter.theatre !== 'undefined') {
            actions.toggleFilter('theatre', 'theatre-' + window.filter.theatre, true);
        }
    });
    $('body').on('click', '.scroll-top', function() {
        $('html, body').scrollTop(0);
    });
    $(window)
        .bind('scroll', handelWindowScroll)
        .bind('resize', function() {
            viewport.changed(handleWindowResize);
        });

    function isSmallViewport() {
        return viewport.is('xs') || viewport.is('sm');
    }

    function handelWindowScroll() {
        if (isSmallViewport()) {
            if ($(window).scrollTop() > 100) {
                $('.scroll-top').show();
            } else {
                $('.scroll-top').hide();
            }
        }
    }

    function handleWindowResize()
    {
        if (isSmallViewport()) {
            $('.main-container').addClass('small-viewport');
        } else {
            $('.main-container').removeClass('small-viewport');
        }
    }

})(jQuery, ResponsiveBootstrapToolkit);