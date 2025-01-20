const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Asking a question
rl.question("Please enter your name: ", function(userInput) {
    console.log("Hello, " + userInput + "!");
    rl.close();  // Close the readline interface
});
