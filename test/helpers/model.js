"use strict";

let setup = require('../setup.js');
let assert = require('chai').assert;

let ModelHelper = require('helpers/model.js');

describe('Model Helper', function() {
    describe('generate key', function() {
        it('should convert titles to keys', function() {
            let gk = ModelHelper.generateKey;
            assert.equal(gk('О чем говорят мужчины?'), 'o-chem-govoryat-muzhchiny');
            assert.equal(gk('PORT-DANUBE (Дунайський порт)'), 'port-danube-dunayskiy-port');
            assert.equal(gk('На початку і наприкінці часів'), 'na-pochatku-i-naprikinci-chasiv');
            assert.equal(gk('Принцеса, Дракон і п\'ять чарівних планет'), 'princesa-drakon-i-pyat-charivnih-planet');
            assert.equal(gk('«Мені однаково, чи буду...»'), 'meni-odnakovo-chi-budu');
            assert.equal(gk('РеVIзоР. Містична комедія'), 'revizor-mistichna-komediya');
        });
    });
});