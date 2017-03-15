"use strict";

let Theatre = require('domain/models/theatre');
const edit = require('./edit');

module.exports = (createRequest, callback) => {
    let theatre = new Theatre;
    edit(theatre, createRequest, err => callback(err, theatre));
};