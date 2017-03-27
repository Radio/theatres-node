"use strict";

let Theatre = require('domain/models/theatre');

let localTheatresCache = {};

function mapTheatre(theatreData, callback) {
    const theatreKey = theatreData.karabasHallId || theatreData.key;
    if (!theatreKey) {
        callback(new Error('Theatre mapper has been provided with an empty theatre key.'));
    }
    if (typeof localTheatresCache[theatreKey] === 'undefined') {
        Theatre.findByAnyKey(theatreKey, function(err, theatre) {
            if (err) return callback(err);
            if (!theatre) {
                createTheatre(theatreData, function(err, theatre) {
                    if (err) return callback(err);
                    resolveTheatre(theatre);
                });
                return;
            }
            resolveTheatre(theatre);
        });
        return;
    }

    return resolveTheatre(localTheatresCache[theatreKey]);

    function resolveTheatre(theatre) {
        localTheatresCache[theatreKey] = theatre;
        callback(null, localTheatresCache[theatreKey])
    }
}


function createTheatre(theatreData, callback) {
    let theatre = new Theatre(theatreData);
    if (!theatre.key) {
        theatre.set('key', theatreData.karabasHallId);
    }
    if (!theatre.title) {
        theatre.set('title', theatre.get('key'));
    }
    theatre.save(function(err) {
        if (err) return callback(err);
        callback(null, theatre);
    });
}

module.exports = mapTheatre;