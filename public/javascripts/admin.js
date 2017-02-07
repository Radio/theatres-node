(function() {
    "use strict";

    let actions = {
        remove: (url, id) => $.post(url, {id: id}),
        resetFilters: function($form) {
            $form.find("input[type=text], input[type=search], select").each(function() {
                const $element = $(this);
                $element.val($element.data('starting-value') || '');
            });
            $form.submit();
        },
        displayResetButton: function($form) {
            const $changedElements = $form.find("input[type=text], input[type=search], select").filter(function() {
                const $element = $(this);
                return $element.val() !== ($element.data('starting-value') || '');
            });
            if ($changedElements.length) {
                $form.find('[data-action="reset-filters"]').attr('hidden', false);
            }
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

    $(document).ready(function() {
        const $resetButton = $('[data-action="reset-filters"]');
        if ($resetButton.length) {
            actions.displayResetButton($resetButton.closest('form'));
        }
    });

    $('[data-action="reset-filters"]').click(function(event) {
        actions.resetFilters($(event.target.form));
    });

    $('#filter-nav').find('select').change(function() {
        this.form.submit();
    });



})(jQuery);