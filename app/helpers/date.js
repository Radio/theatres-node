"use strict";

let moment = require('moment');

const monthsMap = {
    ru: {
        'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'мая': 4, 'июн': 5,
        'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
    },
    ua: {
        'січ': 0, 'лют': 1, 'бер': 2, 'кві': 3, 'тра': 4, 'чер': 5,
        'лип': 6, 'сер': 7, 'вер': 8, 'жов': 9, 'лис': 10, 'гру': 11,
    },
    en: {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    }
};

const monthsNames = {
    ru: ['январь', 'января', 'февраль', 'февраля', 'март', 'марта', 'апрель', 'апреля',
        'май', 'мая', 'июнь', 'июня', 'июль', 'июля', 'август', 'августа', 'сентябрь',
        'сентября', 'октябрь', 'октября', 'ноябрь', 'ноября', 'декабрь', 'декабря'],
    ru_short: ['янв', 'фев', 'мар', 'апр', 'май', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    ua: ['січень', 'січня',  'лютий', 'лютого',  'березень', 'березня',  'квітень', 'квітня',
        'травень', 'травня',  'червень', 'червня', 'липень', 'липня',  'серпень', 'серпня',
        'вересень', 'вересня',  'жовтень', 'жовтня',  'листопад', 'листопада',  'грудень', 'грудня']
};

module.exports = {
    getMonthDays: function(month, year) {
        let monthFirstDay = moment([year, month, 1]);
        let daysInMonth = monthFirstDay.daysInMonth();
        let days = [monthFirstDay];
        for (let i = 2; i <= daysInMonth; i++) {
            days.push(moment([year, month, i]));
        }
        return days;
    },
    getCalendarDays: function(monthDays) {
        return monthDays.reduce(function(cal, date) {
            if (cal.weeks[cal.week] && date.weekday() === 0) {
                cal.week++;
            }
            cal.weeks[cal.week] = cal.weeks[cal.week] || ['', '', '', '', '', '', ''];
            cal.weeks[cal.week][date.weekday()] = date.date();

            return cal;
        }, { week: 0, weeks: [] }).weeks;
    },
    /**
     * Map given month name to month number according to Date.
     *
     * @param {String} textualMonth
     * @param {String} mapCode
     *
     * @return {Number}
     */
    mapMonth: function(textualMonth, mapCode) {
        const index = textualMonth.substr(0, 3);
        if (typeof monthsMap[mapCode][index] === 'undefined') {
            return -1;
        }
        return monthsMap[mapCode][index];
    },
    getMonthsNames: mapCode => monthsNames[mapCode] || []
};