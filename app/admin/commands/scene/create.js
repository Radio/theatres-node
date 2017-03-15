"use strict";

let Scene = require('domain/models/scene');
const edit = require('./edit');

module.exports = (createRequest, callback) => {
    let scene = new Scene;
    edit(scene, createRequest, err => callback(err, scene));
};