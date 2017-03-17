"use strict";

function runTelegramBot(app) {
    const appMetricaToken = process.env.APP_METRICA_TOKEN;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const mode = process.env.TELEGRAM_BOT_MODE;
    const webHookBaseUrl = process.env.TELEGRAM_BOT_WEB_HOOK_BASE_URL;

    let telegramBot = require('./bots/telegram-schedule')(token, appMetricaToken);
    if (mode === 'polling') {
        telegramBot.startPolling();
    } else if (mode === 'webhook') {
        telegramBot.setWebHook(); // Remove web hook possibly set from another environment
        telegramBot.setWebHook(webHookBaseUrl + '/bot/' + token);
        app.post('/bot/' + token, (req, res) => {
            telegramBot.processUpdate(req.body);
            res.sendStatus(200);
        });
    }
}

module.exports = app => {
    runTelegramBot(app);
};