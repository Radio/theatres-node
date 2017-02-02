"use strict";

let Theatre = require('models/theatre');

let localTheatresCache = {};

function mapTheatre(theatreKey, callback) {
    if (!theatreKey) {
        callback(new Error('Theatre mapper was provided with an empty theatre key.'));
    }
    function resolveTheatre(theatre) {
        localTheatresCache[theatreKey] = theatre;
        callback(null, localTheatresCache[theatreKey])
    }
    if (typeof localTheatresCache[theatreKey] === 'undefined') {
        Theatre.findByKey(theatreKey, function(err, theatre) {
            if (err) return callback(err);
            if (!theatre) {
                createTheatre(theatreKey, function(err, theatre) {
                    if (err) return callback(err);
                    resolveTheatre(theatre);
                });
                return;
            }
            resolveTheatre(theatre);
        });
        return;
    }

    resolveTheatre(localTheatresCache[theatreKey]);
}


function createTheatre(theatreKey, callback) {
    let theatre = new Theatre({
        key: theatreKey,
        title: theatreKey
    });
    theatre.save(function(err) {
        if (err) return callback(err);
        callback(null, theatre);
    });
}

module.exports = mapTheatre;