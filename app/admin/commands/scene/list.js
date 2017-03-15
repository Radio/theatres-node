"use strict";

const Scene = require('domain/models/scene');

module.exports = (callback) => Scene.find({}).sort({title: 1}).exec(callback);