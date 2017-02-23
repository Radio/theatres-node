"use strict";

let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let bcrypt = require('bcrypt');
const saltRounds = 10;

let userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    // hash_salt: { type: String, required: true },
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

userSchema.methods.edit = function(editRequest, callback) {
    this.email = editRequest.email;
    this.name = editRequest.name;
    if (editRequest.password) {
        const user = this;
        bcrypt.hash(editRequest.password, saltRounds, function(err, hash) {
            if (err) return callback(err);
            user.password_hash = hash;
            user.save(callback);
        });
        return;
    }
    this.save(callback);
};

module.exports = mongoose.model('User', userSchema);