"use strict";

module.exports = function(app) {
    app.use('/', require('front/routes'));
};