"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const saltRounds = 10;

let userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true }
});
userSchema.set('toObject', {
    versionKey: false,
    transform: function (doc, plain, options) {
        delete plain.password_hash;
        delete plain.hash_salt;
        return plain;
    }
});

userSchema.statics.findByEmail = function(email, callback) {
    return this.findOne({ email: email }, callback);
};

userSchema.methods.verifyPassword = function (password, callback) {
    bcrypt.compare(password, this.password_hash, callback);
};

userSchema.methods.changePassword = function(newPassword, callback) {
    const user = this;
    bcrypt.hash(newPassword, saltRounds, function(err, hash) {
        if (err) return callback(err);
        user.password_hash = hash;
        user.save(callback);
    });
};

module.exports = mongoose.model('User', userSchema);