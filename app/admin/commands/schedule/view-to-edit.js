"use strict";

let Schedule = require('domain/models/schedule');

module.exports = (id, callback) => {
    return Schedule.findById(id)
        .where('actual', true)
        .populate('shows.scene shows.theatre')
        .populate({
            path: 'shows.play',
            populate: { path: 'theatre' }
        })
        .exec(callback);
};