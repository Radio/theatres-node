"use strict";

const remove = require('admin/commands/plays/remove');

module.exports = function(router) {

    router.delete('/remove/:playKey', function(req, res, next) {
        if (!req.play) return next();
        if (req.play.id !== req.body.id) return next();
        remove(function (err) {
            if (err) return next(err);
            req.flash('success', 'Спектакль «' + req.play.title + '» удален.');
            res.end();
        });
    });
    
};