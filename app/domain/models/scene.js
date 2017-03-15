"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let sceneSchema = new Schema({
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true }
});
sceneSchema.set('toObject', { versionKey: false });

sceneSchema.statics.findByKey = function(key, callback) {
    return this.findOne({ key: key }, callback);
};

module.exports = mongoose.model('Scene', sceneSchema);