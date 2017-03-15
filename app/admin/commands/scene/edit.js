"use strict";

module.exports = (scene, editRequest, callback) => {
    scene.title = editRequest.title;
    scene.key = editRequest.key;
    scene.save(callback);
};