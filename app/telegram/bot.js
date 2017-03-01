"use strict";

let TelegramBot = require('node-telegram-bot-api');
let moment = require('moment');
let s = require('underscore.string');
let botHelper = require('helpers/bot');
let dateHelper = require('helpers/date');
let Schedule = require('models/schedule');

const token = process.env.TELEGRAM_BOT_TOKEN;
const mode = process.env.TELEGRAM_BOT_MODE;
const webHookBaseUrl = process.env.TELEGRAM_BOT_WEB_HOOK_BASE_URL;

let bot = new TelegramBot(token, { polling: mode === 'polling' });
if (mode === 'webhook') {
    bot.setWebHook(webHookBaseUrl + '/bot/' + token);
}

bot.onText(/\/start/, (message) => {
    const response = "Здравствуйте!\n" +
        "Я могу показать расписание всех театров Харькова.\n" +
        "Попробуйте:\n" +
        "/today — расписание на сегодня\n" +
        "/tomorrow — расписание на завтра\n" +
        "/date — выбрать день\n" +
        "/help — деталльная справка\n";

    bot.sendMessage(message.chat.id, response, { parse_mode: 'markdown' });
});

bot.onText(/\/help/, (message) => {
    const response = "Доступные команды:\n" +
        "/start — запустить бота\n" +
        "/today — расписание на сегодня\n" +
        "/tomorrow — расписание на завтра\n" +
        "/date — выбрать день\n" +
        "\n" +
        "Можно сразу:\n" +
        "/date <день> [<месяц>]\n" +
        "<месяц> — номер или название месяца.\n" +
        "Например: \n" +
        "/date 15 — на 15 число этого месяца\n" +
        "/date 17 4 — на 17 апреля\n" +
        "/date 15 марта — на 15 марта\n" +
        "/date 15 авг — на 15 августа\n" +
        "\n" +
        "/help — помощь\n";

    bot.sendMessage(message.chat.id, response, { parse_mode: 'markdown' });
});

bot.onText(/\/(today|сегодня)/, (message) => {
    renderScheduleForDate(moment(), schedule => sendSchedule(message.chat.id, schedule));
});

bot.onText(/\/(tomorrow|завтра)/, (message) => {
    renderScheduleForDate(moment().add(1, 'day'), schedule => sendSchedule(message.chat.id, schedule));
});

bot.onText(/\/(date|день)\s*(.*)/, (message, match) => {
    const dateString = match[2] || '';
    if (!dateString) {
        let today = moment();
        sendMonthDaysKeyboard(message.chat.id, today.month());
        setState(message.chat.id, { month: today.month() });
        return;
    }
    const posterDate = botHelper.parsePosterDate(dateString);
    renderScheduleForDate(posterDate, schedule => sendSchedule(message.chat.id, schedule));
});

bot.onText(/^\d+$/, (message, match) => {
    let momentParameters = { day: match[0] };
    let state = getState(message.chat.id);
    if (state.month) {
        momentParameters.month = state.month;
    }
    let posterDate = moment(momentParameters);
    if (!posterDate.isValid()) {
        bot.sendMessage(message.chat.id, "Мы вас не поняли :(\nПовторите еще раз, пожалуйста.",
            { reply_markup: { remove_keyboard: true } });
        return;
    }
    renderScheduleForDate(posterDate, schedule => sendSchedule(message.chat.id, schedule));
});
bot.onText(/отмена/, (message) => {
    clearState(message.chat.id);
    bot.sendMessage(message.chat.id, 'ok', { reply_markup: { remove_keyboard: true } });
});

bot.onText(new RegExp('(' + dateHelper.getMonthsNames('ru').join('|') + ')', 'i'), (message, match) => {
    let month = dateHelper.mapMonth(match[1].toLowerCase(), 'ru');
    sendMonthDaysKeyboard(message.chat.id, month);
    setState(message.chat.id, { month: month });
});

bot.on('callback_query', query => {
    if (! /^\d+-\d+-\d+$/.test(query.data)) {
        return;
    }
    let [year, month, day] = query.data.split('-');
    renderScheduleForDate(moment([year, month - 1, day]), schedule => sendSchedule(query.message.chat.id, schedule));
});

let chatState = {};
function clearState(chatId) {
    delete chatState[chatId];
}
function setState(chatId, state) {
    chatState[chatId] = { set: Date.now(), state: state };
}
function getState(chatId) {
    return typeof chatState[chatId] !== 'undefined' ? chatState[chatId].state : {};
}

function sendMonthDaysKeyboard(chatId, month) {
    let firstDay = moment().startOf('month').month(month);
    let response = '*' + s.capitalize(firstDay.format('MMMM YYYY')) + "*\nКакой день?";
    let keyboard = botHelper.getMonthDays(firstDay.month()).reduce((rows, day) => {
        let row = Math.min(Math.floor((day - 1) / 8), 3);
        rows[row] = rows[row] || [];
        rows[row].push(day);
        return rows;
    }, [])
        .map(rows => rows.map(day => ({text: `${day}`})));
    keyboard.push([
        { text: '← ' + firstDay.subtract(1, 'month').format('MMMM') },
        { text: 'отмена' },
        { text: firstDay.add(2, 'months').format('MMMM') + ' →' },
    ]);
    bot.sendMessage(chatId, response, {
        parse_mode: 'markdown',
        reply_markup: {
            resize_keyboard: true,
            keyboard: keyboard
        }
    });
}

function sendSchedule(chatId, schedule) {
    let yesterday = moment(schedule.date).subtract(1, 'day');
    let tomorrow = moment(schedule.date).add(1, 'day');
    bot.sendMessage(chatId, schedule.text, {
        parse_mode: 'markdown',
        reply_markup: {
            remove_keyboard: true,
            inline_keyboard: [[
                {text: '← ' + yesterday.format('D MMM'), callback_data: yesterday.format('YYYY-MM-DD') },
                {text: tomorrow.format('D MMM') + ' →', callback_data: tomorrow.format('YYYY-MM-DD')}
            ]]
        },
    });
}

function renderScheduleForDate(date, callback) {
    findSchedule(date, function(err, schedule) {
        if (err) throw err;
        if (!schedule) {
            return callback({date: date, text: botHelper.formatNoDataMessage(date)});
        }
        callback({
            date: date,
            text: botHelper.formatPosterMessage(date, schedule.shows.filter(show => date.isSame(show.date, 'day')))
        });
    });
}

function findSchedule(date, callback) {
    Schedule.findByMonthAndYear(date.month(), date.year())
        .populate('shows.scene')
        .populate({
            path: 'shows.play',
            populate: [{ path:'scene' }, { path:'theatre' }]
        }).exec(callback)
}

module.exports = bot;