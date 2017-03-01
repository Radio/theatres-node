"use strict";

let setup = require('../setup');
let assert = require('chai').assert;
let moment = require('moment');
let botHelper = require('helpers/bot');

const maxDay = moment().daysInMonth();

describe('Bot Helper', function() {
    describe('parse date string', function() {
        it('should parse plain number as day of current month', function() {
            assert.isTrue(moment({day: 1}).isSame(botHelper.parsePosterDate('01')));
            assert.isTrue(moment({day: 1}).isSame(botHelper.parsePosterDate('1')));
            assert.isTrue(moment({day: 17}).isSame(botHelper.parsePosterDate('17')));
            assert.isTrue(moment({day: maxDay}).isSame(botHelper.parsePosterDate(maxDay)));
            assert.isTrue(moment().isSame(botHelper.parsePosterDate(maxDay + 1)));
        });
        it('should parse day and month separated by [.-, ]', function() {
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('07.01')));
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('7.01')));
            assert.isTrue(moment({day: 7, month: 5, year: 2017}).isSame(botHelper.parsePosterDate('7.6')));
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('7.янв')));
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('7 января')));
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('7 янвdfsdf')));
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('7-jan')));
            assert.isTrue(moment({day: 7, month: 0, year: 2018}).isSame(botHelper.parsePosterDate('7,січня')));
            assert.isTrue(moment().isSame(botHelper.parsePosterDate('7.50')));
            assert.isTrue(moment().isSame(botHelper.parsePosterDate('30.02')));
            assert.isTrue(moment({day: 12}).isSame(botHelper.parsePosterDate('12 test')));
        });
    });
});