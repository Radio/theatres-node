"use strict";

let express = require('express');
let router = express.Router();

router.use('/', require('./admin/index'));
router.use('/theatres', require('./admin/theatres'));
router.use('/scenes', require('./admin/scenes'));
router.use('/plays', require('./admin/plays'));
router.use('/schedule', require('./admin/schedule'));

module.exports = router;
