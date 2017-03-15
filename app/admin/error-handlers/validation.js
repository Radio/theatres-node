"use strict";

module.exports = function(err, req, res) {
    let messages = [];
    for (let fieldName in err.errors) {
        if (err.errors.hasOwnProperty(fieldName)) {
            messages.push(String(err.errors[fieldName]))
        }
    }
    req.flash('error', messages.join('<br>'));
    req.flash('body', req.body);
    res.redirect(req.originalUrl);
};