(function() {
    "use strict";

    let actions = {
        remove: (url, id) => $.ajax(url, {method:'delete', data: {id: id}}),
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

    $(document).ready(function() {
        const path = location.pathname.replace(/^(\/.*?\/.*?)\/.*/, '$1');
        $('#main-nav').find('a[href^="' + path + '"]').closest('li').addClass('active');
    });

    $('[data-action="reset-filters"]').click(function(event) {
        actions.resetFilters($(event.target.form));
    });

    $('#filter-nav').find('select').change(function() {
        this.form.submit();
    });

    $('[data-optgroup-dependent-on]').each(function() {
        let $element = $(this);
        let $master = $($element.data('optgroup-dependent-on'));
        $element.data('original-value', $element.val());
        filterOptgroup();
        $master.change(filterOptgroup);
        function filterOptgroup() {
            $element.find('optgroup').hide().find('option').attr('disabled', true);
            $element.find('optgroup[data-dependency-id="' + $master.val() + '"]').show()
                    .find('option').attr('disabled', false);
            if ($element.has('option[value="' + $element.data('original-value') + '"]:enabled').length) {
                $element.val($element.data('original-value'));
                return;
            }
            $element.val('');
        }
    });

    $('[data-datetimepicker]').each(function() {
        const $element = $(this);
        $element.datetimepicker({
            weekStart: 1,
            autoclose: true,
            startView: 'month',
            minView: 'hour',
            maxView: 'month',
            language: 'ru',
            startDate: $element.data('start-date'),
            endDate: $element.data('end-date'),
        })
    });


})(jQuery);