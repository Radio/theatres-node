"use strict";

const monthTitles = {
    'nominative': ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    'genitive': ['', 'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря']
};
const currentDate = new Date();

module.exports = {
    getCurrentDate: function () {
        return currentDate;
    },
    getCurrentMonth: function() {
        return currentDate.getMonth() + 1;
    },
    getCurrentYear: function() {
        return currentDate.getFullYear();
    },
    getNextMonth: function(currentMonth) {
        currentMonth = currentMonth || this.getCurrentMonth();
        return (currentMonth + 1) % 12;
    },
    getNextMonthYear: function(currentMonth)
    {
        currentMonth = currentMonth || this.getCurrentMonth();
        return this.getCurrentYear() + (currentMonth === 12 ? 1 : 0);
    },
    getMonthTitle: function(monthNumber, _case) {
        return monthTitles[_case || 'nominative'][monthNumber];
    },
    getMonthDays: function(monthNumber, year) {
        let days = [];
        let weeks = [];
        let daysInMonth = this.getNumberOfDaysInMonth(monthNumber, year);
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, monthNumber - 1, i));
        }
        return days;
    },
    getNumberOfDaysInMonth: function(monthNumber, year) {
        monthNumber = monthNumber || currentDate.getMonth();
        year = year || currentDate.getFullYear();
        return new Date(year, monthNumber, 0).getDate();
    },
    datesAreEqual: function(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    },

    dateStringToObject: function(item, properties) {
        properties.forEach(function(property) {
            if (typeof item[property] === 'string') {
                try {
                    let dateTime = item[property].split(' ');
                    let d = dateTime[0].split('-');
                    let t = dateTime[1].split(':');
                    item[property] = new Date(d[0], d[1] - 1, d[2], t[0], t[1], t[2], 0);
                } catch (e) {
                    item[property] = new Date(item[property]);
                }
            }
        });
    },
    dateObjectToString: function(item, properties, format) {
        format = format || 'YYYY-MM-DD HH:mm:ss';
        properties.forEach(function(property) {
            if (typeof item[property] === 'object') {
                item[property] = moment(item[property]).format(format);
            }
        });
    }
};