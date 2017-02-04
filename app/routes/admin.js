"use strict";

let express = require('express');
let router = express.Router();

let index = require('./admin/index');
let theatres = require('./admin/theatres');

router.use('/', index);
router.use('/theatres', theatres);

module.exports = router;
