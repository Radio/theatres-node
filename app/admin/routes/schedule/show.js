"use strict";

module.exports = function(router) {
    require('./show/edit')(router);
    require('./show/remove')(router);
    require('./show/hide')(router);
};