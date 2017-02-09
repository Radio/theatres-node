"use strict";

let moment = require('moment');

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
    }
};