"use strict";

let express = require('express');
let router = express.Router();

router.use('/', require('./routes/month'));

module.exports = router;
