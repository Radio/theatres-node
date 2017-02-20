"use strict";

module.exports = {
    normalize: function(price) {
        return price.trim()
            .replace('грн.', 'грн')
            .replace(/,([^\s])/g, ', $1')
            .replace(/\s*[-–−]\s*/gi, '–')
            .replace(/([^\s])грн/gi, '$1 грн');
    }
};