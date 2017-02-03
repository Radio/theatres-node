"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let theatreSchema = new Schema({
    key: String,
    title: String,
    abbreviation: String,
    url: String,
    hasFetcher: Boolean,
    houseSlug: String   // The theatre slug in "Actor's House"
});
theatreSchema.set('toObject', { versionKey: false });

const HOUSE_ABBREVIATION = 'ДА';
const HOUSE_TITLE_ADDITION = 'в Доме Актера';

theatreSchema.virtual('fullAbbreviation').get(function() {
    return this.abbreviation + (this.isInHouse() ? ' (' + HOUSE_ABBREVIATION + ')' : '');
});
theatreSchema.virtual('fullTitle').get(function() {
    return this.title + (this.isInHouse() ? ' (' + HOUSE_TITLE_ADDITION + ')' : '');
});

theatreSchema.statics.findByKey = function(key, callback) {
    return this.findOne({ key: key }, callback);
};

theatreSchema.methods.isInHouse = function() {
    return !!this.houseSlug;
};

module.exports = mongoose.model('Theatre', theatreSchema);