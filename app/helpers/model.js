"use strict";

let s = require("underscore.string");
let mongoose = require('mongoose');

let lettersMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh',
    'щ': 'sch', 'ь': '', 'ы': 'y', 'ъ': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'і': 'i', 'ї': 'yi', 'ґ': 'g', 'є': 'ye',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'Ch', 'Ш': 'Sh',
    'Щ': 'Sch', 'Ь': '', 'Ы': 'Y', 'Ъ': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'І': 'I', 'Ї': 'yi', 'Ґ': 'G', 'Є': 'ye',
    '\'': '',
};

function generateKey(title) {
    return s(title)
        .map((char) => (typeof lettersMap[char] !== 'undefined' ? lettersMap[char] : char))
        .slugify()
        .value();
}

function getId(candidate) {
    if (!candidate) {
        return null;
    }
    if (typeof candidate === 'string') {
        return candidate;
    }
    return candidate instanceof mongoose.Types.ObjectId ? candidate : candidate._id;
}
function sameIds(idA, idB) {
    return String(getId(idA)) === String(getId(idB));
}

module.exports.generateKey = generateKey;
module.exports.getId = getId;
module.exports.sameIds = sameIds;