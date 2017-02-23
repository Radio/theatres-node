"use strict";

let express = require('express');
let router = express.Router();

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

router.use('/', require('./admin/index'));
router.use('/users', require('./admin/users'));
router.use('/theatres', require('./admin/theatres'));
router.use('/scenes', require('./admin/scenes'));
router.use('/plays', require('./admin/plays'));
router.use('/schedule', require('./admin/schedule'));
router.use('/login', require('./admin/login'));
router.post('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/admin/login');
});

module.exports = router;
