"use strict";

let express = require('express');
let router = express.Router();

let index = require('./admin/index');
let theatres = require('./admin/theatres');
let scenes = require('./admin/scenes');

router.use('/', index);
router.use('/theatres', theatres);
router.use('/scenes', scenes);

module.exports = router;