var colors = require('colors');
const logSymbols = require('log-symbols');

module.exports = {
    error: function (msg) {
        console.log(logSymbols.error, msg.red)
    },
    warn: function (msg) {
        console.log(logSymbols.warn, msg.yellow)
    },
    info: function (msg) {
        console.log(logSymbols.info, msg.blue)
    },
    success: function (msg) {
        console.log(logSymbols.success, msg.green)
    }
} 