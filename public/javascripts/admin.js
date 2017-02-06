(function() {
    "use strict";

    let actions = {
        remove: (url, id) => $.post(url, {id: id}),
        resetFilters: function(form) {
            let $form = $(form);
            $form.find("input[type=text], input[type=search], select").val("");
            $form.submit();
        }
    };

    $('[data-action="remove"]').click(function(event) {
        if (confirm('Уверенны?')) {
            const $button = $(event.target);
            actions.remove($button.data('url'), $button.data('id')).then(function () {
                location.href = $button.data('return-url') || location.pathname;
            });
        }
    });

    $('[data-action="reset-filters"]').click(function(event) {
        actions.resetFilters(event.target.form);
    });



})(jQuery);