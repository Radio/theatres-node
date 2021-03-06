"use strict";

let moment = require('moment');
let dateHelper = require('helpers/date');

module.exports = {
    parsePosterDate: dateString => {
        const today = moment();
        let match = String(dateString).match(/^(\d+)([.\-, \/]([a-zа-яі0-9]+))?$/);
        if (!match) {
            return today;
        }
        let day = match[1];
        let month = typeof match[3] !== 'undefined' ? parseMonth(match[3]) : today.month();
        if (month < 0) {
            month = today.month();
        }
        let year = month < today.month() ? today.year() + 1 : today.year();
        let parsedDate = moment([year, month, day]);

        return (parsedDate.isValid() ? parsedDate : today).toObject();
    },
    getMonthDays: function(month) {
        const daysInMonth = moment({month: month}).daysInMonth();
        let day = 0, days = [];
        while (day++ < daysInMonth) {
            days.push(day)
        }
        return days;
    }
};

function parseMonth(monthString) {
    if (/^\d+$/.test(monthString)) {
        return monthString - 1;
    }
    let mappedMonth = dateHelper.mapMonth(monthString.toLowerCase(), 'ru');
    if (mappedMonth < 0) {
        mappedMonth = dateHelper.mapMonth(monthString.toLowerCase(), 'ua');
    }
    if (mappedMonth < 0) {
        mappedMonth = dateHelper.mapMonth(monthString.toLowerCase(), 'en');
    }
    return mappedMonth;
}