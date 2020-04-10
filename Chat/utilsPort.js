//for reading data in process.stdin
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
});

function readlinePort(userPort = "") {
    //resolve - case of successful completion
    //reject - case of unsuccessful completion
    var result = new Promise((resolve, reject) => {
        rl.question(userPort, (input) => {
            resolve(input);
        });
    });
    return result;
}

//for return value to require
module.exports = {
    readlinePort,
};