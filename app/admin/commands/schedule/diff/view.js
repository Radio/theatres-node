"use strict";

const Schedule = require('domain/models/schedule');
const async = require('async');
const jsDiff = require('diff');

module.exports = (scheduleAId, scheduleBId, callback) => {
    async.parallel({
        a: callback => loadSchedule(scheduleAId, callback),
        b: callback => loadSchedule(scheduleBId, callback)
    }, function(err, schedules) {
        if (err) return callback(err);
        if (!schedules.a || !schedules.b) {
            return callback();
        }
        schedules.diff = getDiff(getDiffableObject(schedules.b), getDiffableObject(schedules.a));
        callback(null, schedules);
    });
};

function loadSchedule(id, callback) {
    Schedule.findOne({_id: id})
        .populate('shows.scene')
        .populate({
            path: 'shows.play',
            populate: { path: 'theatre' }
        })
        .exec(callback);
}

function getDiffableObject(schedule) {
    return schedule.toObject().shows.map(function(show) {
        show.play__id = show.play._id;
        show.play__title = show.play.title;
        show.scene__id = show.scene ? show.scene._id : null;
        show.scene__title = show.scene ? show.scene.title : null;
        show.theatre__title = show.play.theatre.title;
        delete show._id;
        delete show.play;
        delete show.scene;
        delete show.theatre;
        return show;
    });
}

function getDiff(a, b) {
    return jsDiff.diffJson(a, b);
}