"use strict";

module.exports = {
    normalize: function(price) {
        return price.trim()
            .replace('грн.', 'грн')
            .replace(/,([^\s])/, ', $1')
            .replace(/\s*[-–−]\s*/i, '–')
            .replace(/([^\s])грн/i, '$1 грн');
    }
};