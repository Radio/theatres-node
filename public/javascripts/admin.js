(function() {
    "use strict";

    let actions = {
        remove: (url, id) => $.ajax(url, {method:'delete', data: {id: id}}),
        resetFilters: function($form) {
            location.href = location.pathname;
            // $form.find("input[type=text], input[type=search], select").each(function() {
            //     const $element = $(this);
            //     let startingValue = $element.data('starting-value') ||
            //         $element.find('option[data-starting-value]').attr('value') || '';
            //     $element.val(startingValue);
            // });
            // $form.submit();
        },
        displayResetButton: function($form) {
            const $changedElements = $form.find("input[type=text], input[type=search], select").filter(function() {
                const $element = $(this);
                let startingValue = $element.data('starting-value') ||
                    $element.find('option[data-starting-value]').attr('value') || '';
                return $element.val() !== startingValue;
            });
            if ($changedElements.length) {
                $form.find('[data-action="reset-filters"]').attr('hidden', false);
            }
        },
        showAbsorbCandidateDetails: function (details, $container) {
            $container.html(details ? JSON.stringify(details, null, 2) : '');
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

    $('[data-default-option-dependent-on]').each(function() {
        let $element = $(this);
        let $master = $($element.data('default-option-dependent-on'));
        let dataAttribute = $element.data('default-option-dependent-on-data-attribute');
        if (!$element.val()) {
            $master.change(function () {
                let $dependentOnValue = dataAttribute ? $master.find(':selected').data(dataAttribute) : $master.val();
                $element.val($dependentOnValue);
            });
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

    $('#original').change(function() {
        actions.showAbsorbCandidateDetails(
            $(this).find(':selected').data('candidate-details'),
            $('#candidate-details')
        )
    });

    $('[name="auto-hash"]').click(function() {
        $('[name="hash"]').attr('disabled', this.checked).attr('hidden', this.checked);
        $('#hash-static').attr('hidden', !this.checked);
    });

})(jQuery);