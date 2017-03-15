"use strict";

const Scene = require('domain/models/scene');

module.exports = (key, callback) => Scene.findByKey(key, callback);