"use strict";

let Play = require('domain/models/play');
let edit = require('admin/commands/play/edit');

module.exports = function(createRequest, callback) {
    let play = new Play();
    return edit(play, createRequest, err => callback(err, play));
};