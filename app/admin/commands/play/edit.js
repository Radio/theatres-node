"use strict";

const modelHelper = require('helpers/model');

module.exports = function(play, editRequest, callback) {
    return editPlay(play, editRequest, callback);
};

function editPlay(play, editRequest, callback) {

    const oldTitle = play.title;

    play.key = editRequest.key;
    if (!play.key) {
        play.key = modelHelper.generateKey(play.title);
    }
    play.title = editRequest.title;
    play.theatre = editRequest.theatre;
    play.scene = editRequest.scene;
    play.url = editRequest.url;
    play.director = editRequest.director;
    play.author = editRequest.author;
    play.genre = editRequest.genre;
    play.duration = editRequest.duration;
    play.description = editRequest.description;
    play.image = editRequest.image;
    play.premiere = editRequest.premiere;
    play.musical = editRequest.musical;
    play.dancing = editRequest.dancing;
    play.forKids = editRequest.forKids;
    play.opera = editRequest.opera;
    play.ballet = editRequest.ballet;
    play.mapAs = editRequest.mapAs;
    play.tags = editRequest.tags.map(tag => tag.trim());
    play.addTag(editRequest.title.trim());
    if (oldTitle && oldTitle !== editRequest.title) {
        play.addTag(oldTitle.trim());
    }
    if (typeof editRequest.hidden !== 'undefined') {
        play.hidden = editRequest.hidden;
    }

    play.save(callback);
}

