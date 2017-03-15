"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let theatreSchema = new Schema({
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    url: String,
    hasFetcher: Boolean,
    houseSlug: String   // The theatre slug in "Actor's House"
});
theatreSchema.set('toObject', { versionKey: false });

theatreSchema.statics.findByKey = function(key, callback) {
    return this.findOne({ key: key }, callback);
};

theatreSchema.statics.findByKeyOrHouseSlug = function(key, callback) {
    return this.findOne({ $or: [{ key: key }, { houseSlug: key }] }, callback);
};

theatreSchema.methods.isInHouse = function() {
    return !!this.houseSlug;
};

module.exports = mongoose.model('Theatre', theatreSchema);