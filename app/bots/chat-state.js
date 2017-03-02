"use strict";

class ChatState {
    constructor() {
        this.state = {};
        setInterval(this.cleanupStates, 86400000); // each day
    }
    clear(chatId) {
        delete this.state[chatId];
    }
    set(chatId, state) {
        this.state[chatId] = { set: Date.now(), state: state };
    }
    get(chatId) {
        return typeof this.state[chatId] !== 'undefined' ? this.state[chatId].state : {};
    }
    cleanupStates() {
        const edge = Date.now() - 604800000; // persist state for a week.
        for (let chatId in this.state) if (this.state.hasOwnProperty(chatId)) {
            if (this.state[chatId].set.getTime() < edge) {
                this.clearState(chatId)
            }
        }
    }
}

module.exports = ChatState;