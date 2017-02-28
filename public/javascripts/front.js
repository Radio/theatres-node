(function($, viewport) {
    "use strict";

    let scrolledToDay;
    let filter = localStorage ? JSON.parse(localStorage.getItem('filter')) || {} : {};
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
            if (localStorage) {
                // localStorage.setItem('filter', JSON.stringify(filter));
            }
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
        if ($.isEmptyObject(filter)) {
            $('.filter-block.play-ages [type="checkbox"]').each(function() {
                actions.toggleFilter('age', this.name, this.checked);
            });
            $('.filter-block.play-types [type="checkbox"]').each(function() {
                actions.toggleFilter('type', this.name, this.checked);
            });
            $('.filter-block.scenes [type="checkbox"]').each(function() {
                actions.toggleFilter('scene', this.name, this.checked);
            });
        } else {
            $('.filter-block.play-ages [type="checkbox"]').each(function () {
                this.checked = (filter.age || []).indexOf(this.name) >= 0;
            });
            $('.filter-block.play-types [type="checkbox"]').each(function () {
                this.checked = (filter.type || []).indexOf(this.name) >= 0;
            });
            $('.filter-block.scenes [type="checkbox"]').each(function() {
                this.checked = (filter.scene || []).indexOf(this.name) >= 0;
            });
        }
        actions.applyFilter();
    });

    $('[data-disabled-if-unchecked]').each(function() {
        let $element = $(this);
        let dependencySelector = $element.data('disabled-if-unchecked');
        $(dependencySelector).click(function() {
            $element.attr('disabled', !this.checked);
        });
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
            $('.scroll-top').toggle($(window).scrollTop() > 100);
        }
    }

    function handleWindowResize() {
        $('.main-container').toggleClass('small-viewport', isSmallViewport());
    }

})(jQuery, ResponsiveBootstrapToolkit);