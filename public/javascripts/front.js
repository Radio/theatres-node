(function() {
    "use strict";

    let actions = {
        showShowDetails: function() {

        }
    };

    $('.show-title a').click(function(event) {
        event.preventDefault();
        let $showRow = ($(event.target).closest('.show-row'));
        $showRow.toggleClass('detailed');
    })

})(jQuery);