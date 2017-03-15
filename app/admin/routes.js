"use strict";

const express = require('express');
const router = express.Router();

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/admin/login')
}
router.all('*', function(req, res, next){
    if (req.params[0] === '/login') {
        return next();
    }
    ensureAuthenticated(req, res, next);
});

router.use('/', require('./routes/index'));
router.use('/users', require('./routes/users'));
router.use('/theatres', require('./routes/theatres'));
router.use('/scenes', require('./routes/scenes'));
router.use('/plays', require('./routes/plays'));
router.use('/schedule', require('./routes/schedule'));
router.use('/login', require('./routes/login'));
router.post('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/admin/login');
});

module.exports = router;
