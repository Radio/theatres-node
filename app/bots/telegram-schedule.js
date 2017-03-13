"use strict";

let TelegramBot = require('node-telegram-bot-api');
let ScheduleBot = require('bots/schedule');
let ChatState = require('bots/chat-state');
let moment = require('moment');
let s = require('underscore.string');
let botHelper = require('helpers/bot');
let dateHelper = require('helpers/date');

module.exports = function(token) {

    let bot = new TelegramBot(token);

    const scheduleBot = new ScheduleBot();
    const chatState = new ChatState();

    bot.onText(/\/start/, (message) => {
        bot.sendMessage(message.chat.id, messages.start(), {parse_mode: 'markdown'});
    });

    bot.onText(/\/help/, (message) => {
        bot.sendMessage(message.chat.id, messages.help(), {parse_mode: 'markdown'});
    });

    bot.onText(/\/(today|сегодня)/, (message) => {
        sendMessageWithScheduleForDate(message.chat.id, new Date());
    });

    bot.onText(/\/(tomorrow|завтра)/, (message) => {
        sendMessageWithScheduleForDate(message.chat.id, moment().add(1, 'day').toDate());
    });

    bot.onText(/\/(date|день)\s*(.*)/, (message, match) => {
        const dateString = match[2] || '';
        if (!dateString) {
            let today = moment();
            sendMonthDaysKeyboard(message.chat.id, today.month());
            chatState.set(message.chat.id, {month: today.month()});
            return;
        }
        const posterDate = botHelper.parsePosterDate(dateString);
        sendMessageWithScheduleForDate(message.chat.id, posterDate.toDate());
    });

    bot.onText(/^\d+$/, (message, match) => {
        let momentParameters = {day: match[0]};
        let state = chatState.get(message.chat.id);
        if (typeof state.month !== 'undefined') {
            momentParameters.month = state.month;
        }
        let posterDate = moment(momentParameters);
        if (!posterDate.isValid()) {
            bot.sendMessage(message.chat.id, messages.confused(), {reply_markup: {remove_keyboard: true}});
            return;
        }
        sendMessageWithScheduleForDate(message.chat.id, posterDate.toDate());
    });

    bot.onText(new RegExp('(' + dateHelper.getMonthsNames('ru').join('|') + ')', 'i'), (message, match) => {
        const month = dateHelper.mapMonth(match[1].toLowerCase(), 'ru');
        sendMonthDaysKeyboard(message.chat.id, month);
        chatState.set(message.chat.id, {month: month});
    });

    bot.onText(/отмена/, (message) => {
        chatState.clear(message.chat.id);
        bot.sendMessage(message.chat.id, 'ok', {reply_markup: {remove_keyboard: true}});
    });

    bot.on('callback_query', query => {
        if (!/^\d+-\d+-\d+$/.test(query.data)) {
            return;
        }
        let [year, month, day] = query.data.split('-');
        sendMessageWithScheduleForDate(query.message.chat.id, moment([year, month - 1, day]).toDate());
    });

    const messages = {
        start: () => {
            return "Здравствуйте!\n" +
                "Я могу показать расписание всех театров Харькова.\n" +
                "Попробуйте:\n" +
                "/today — расписание на сегодня\n" +
                "/tomorrow — расписание на завтра\n" +
                "/date — выбрать день\n" +
                "/help — деталльная справка\n";
        },
        help: () => {
            return "Доступные команды:\n" +
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
        },
        askDay: (monthMoment) => `*${s.capitalize(monthMoment.format('MMMM YYYY'))}*\nКакой день?`,
        noSchedule: (dateMoment) => {
            const adverb = dateMoment.valueOf() > Date.now() ? 'еще' : 'уже';
            return `На *${dateMoment.format('D MMMM YYYY')}* ${adverb} нет расписания.`
        },
        schedule: (dateMoment, shows) => {
            if (!shows.length) {
                return `На *${dateMoment.format('D MMMM YYYY')}* нет спектаклей.`
            }
            let lines = [`*Расписание на ${dateMoment.format('D MMMM YYYY')}*`];
            shows.forEach(show => {
                let url = show.url || show.play.url;
                lines.push(
                    '*' + moment(show.date).format('HH:mm') + '*' +
                    ' ' + (url ? ' [' + show.play.title + '](' + url + ')' : show.play.title) +
                    ' (' + show.play.theatre.title + (show.theatre ? ', ' + show.theatre.title : '') + ')'
                );
            });
            return lines.join("\n");
        },
        confused: () => "Мы вас не поняли :(\nПовторите еще раз, пожалуйста."
    };

    const keyboards = {
        scheduleInline: date => {
            let yesterday = moment(date).subtract(1, 'day');
            let tomorrow = moment(date).add(1, 'day');
            return [[
                {text: '← ' + yesterday.format('D MMM'), callback_data: yesterday.format('YYYY-MM-DD')},
                {text: tomorrow.format('D MMM') + ' →', callback_data: tomorrow.format('YYYY-MM-DD')}
            ]];
        },
        monthDays: date => {
            const currentMonth = moment(date).startOf('month');
            const previousMonth = moment(date).subtract(1, 'month');
            const nextMonth = moment(date).add(1, 'month');
            const keyboard = botHelper.getMonthDays(currentMonth.month())
                .reduce((rows, day) => {
                    const row = Math.floor((day - 1) / 8);
                    rows[row] = rows[row] || [];
                    rows[row].push(day);
                    return rows;
                }, [])
                .map(rows => rows.map(day => ({text: `${day}`})));
            keyboard.push([
                {text: '← ' + previousMonth.format('MMMM')},
                {text: 'отмена'},
                {text: nextMonth.format('MMMM') + ' →'},
            ]);
            return keyboard;
        }
    };

    function sendMonthDaysKeyboard(chatId, month) {
        const currentMonth = moment().startOf('month').month(month);
        bot.sendMessage(chatId, messages.askDay(currentMonth), {
            parse_mode: 'markdown',
            reply_markup: {
                resize_keyboard: true,
                keyboard: keyboards.monthDays(currentMonth)
            }
        });
    }

    function sendMessageWithScheduleForDate(chatId, date) {
        renderScheduleForDate(date, (err, text) => {
            if (err) throw err;
            bot.sendMessage(chatId, text, {
                parse_mode: 'markdown',
                reply_markup: {
                    inline_keyboard: keyboards.scheduleInline(date)
                },
            });
        });
    }

    function renderScheduleForDate(date, callback) {
        scheduleBot.onDate(date, function (err, schedule) {
            if (err) callback(err);
            if (typeof schedule.shows === 'undefined') {
                return callback(null, messages.noSchedule(moment(date)));
            }
            callback(null, messages.schedule(moment(date), schedule.shows));
        });
    }

    return bot;
};