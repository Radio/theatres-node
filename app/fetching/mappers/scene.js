"use strict";

let Scene = require('models/scene');

let localScenesCache = {};

function mapScene(sceneKey, callback) {
    if (!sceneKey) {
        callback(new Error('Scene mapper was provided with an empty scene key.'));
    }
    function resolveScene(scene) {
        localScenesCache[sceneKey] = scene;
        callback(null, localScenesCache[sceneKey])
    }
    if (typeof localScenesCache[sceneKey] === 'undefined') {
        Scene.findByKey(sceneKey, function(err, scene) {
            if (err) return callback(err);
            if (!scene) {
                createScene(sceneKey, function(err, scene) {
                    if (err) return callback(err);
                    resolveScene(scene);
                });
                return;
            }
            resolveScene(scene);
        });
        return;
    }

    resolveScene(localScenesCache[sceneKey]);
}


function createScene(sceneKey, callback) {
    let scene = new Scene({
        key: sceneKey,
        title: sceneKey
    });
    scene.save(function(err) {
        if (err) return callback(err);
        callback(null, scene);
    });
}

module.exports = mapScene;