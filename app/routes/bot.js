"use strict";

let express = require('express');
let router = express.Router();
let bot = require('telegram/bot');

const token = process.env.TELEGRAM_BOT_TOKEN;

router.post('/' + token, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

module.exports = router;