"use strict";

let Scene = require('domain/models/scene');

let localScenesCache = {};

function mapScene(sceneData, callback) {
    const sceneKey = sceneData.key;
    if (!sceneKey) {
        callback(new Error('Scene mapper has been provided with an empty scene key.'));
    }
    if (typeof localScenesCache[sceneKey] === 'undefined') {
        Scene.findByKey(sceneKey, function(err, scene) {
            if (err) return callback(err);
            if (!scene) {
                createScene(sceneData, function(err, scene) {
                    if (err) return callback(err);
                    resolveScene(scene);
                });
                return;
            }
            resolveScene(scene);
        });
        return;
    }

    return resolveScene(localScenesCache[sceneKey]);

    function resolveScene(scene) {
        localScenesCache[sceneKey] = scene;
        callback(null, localScenesCache[sceneKey])
    }
}


function createScene(sceneData, callback) {
    let scene = new Scene(sceneData);
    if (!scene.title) {
        scene.set('title', sceneData.key);
    }
    scene.save(function(err) {
        if (err) return callback(err);
        callback(null, scene);
    });
}

module.exports = mapScene;