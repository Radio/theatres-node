"use strict";

let User = require('domain/models/user');
const edit = require('./edit');

module.exports = (createRequest, callback) => {
    let user = new User;
    edit(user, createRequest, err => callback(err, user));
};