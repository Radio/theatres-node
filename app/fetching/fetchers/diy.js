"use strict";

const path = require('path');
const yamlFetcher = require('./factories/yaml');

const sourcePath = path.resolve('res/schedules/diy.yaml');

module.exports.fetch = yamlFetcher(sourcePath);