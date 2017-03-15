"use strict";

let express = require('express');
let router = express.Router();

router.get('/', function(req, res) {
    res.render('index', {
        title: 'Управление',
    });
});

module.exports = router;
