"use strict";

module.exports = (user, editRequest, callback) => {
    user.email = editRequest.email;
    user.name = editRequest.name;
    if (editRequest.password) {
        // this will save the user as well.
        return user.changePassword(editRequest.password, callback);
    }
    user.save(callback);
};