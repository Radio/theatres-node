"use strict";

let express = require('express');
let router = express.Router();

router.get('/', function(req, res) {
    res.render('admin/index', {
        title: 'Управление',
    });
});

module.exports = router;
