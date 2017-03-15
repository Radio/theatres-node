"use strict";

module.exports = function(err, req, res) {
    let errorMessage = err.message;
    for (let fieldName in err.errors) {
        if (err.errors.hasOwnProperty(fieldName)) {
            errorMessage += '<br>' + String(err.errors[fieldName])
        }
    }
    req.flash('error', errorMessage);
    req.flash('body', req.body);
    res.redirect(req.originalUrl);
};