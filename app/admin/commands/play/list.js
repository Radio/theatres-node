"use strict";

let Play = require('domain/models/play');
let escapeStringRegexp = require('escape-string-regexp');

module.exports = function(filter, callback) {
    return Play.find(buildConditions(filter))
        .populate('theatre scene mapAs')
        .sort({title: 1})
        .exec(callback);
};

function buildConditions(filter) {
    let conditions = {};
    if (filter.theatre) {
        conditions.theatre = filter.theatre;
    }
    if (filter.scene) {
        conditions.scene = filter.scene;
    }
    if (filter.query) {
        const regexCondition = { '$regex': new RegExp(escapeStringRegexp(filterQuery.query), 'i') };
        conditions['$or'] = [{ title: regexCondition }, { key: regexCondition }];
    }
    return conditions;
}