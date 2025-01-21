const imagePaths = {
    1: "assets/1.png",
    2: "assets/2.png",
    3: "assets/3.png",
    4: "assets/4.png",
    5: "assets/5.png",
    6: "assets/6.png"
};

const emoji = document.querySelectorAll(".image");
const comp_emoji = document.querySelector(".comp_image");
const scoreBoard = document.querySelector("#scoreBoard");

// Audio files
const clickSound = new Audio('assets/click.wav');
const cycleSound = new Audio('assets/cycle.mp3');
const choiceSound = new Audio('assets/choice.wav');
const scoreboardSound = new Audio('assets/scoreboard.wav');
const outSound = new Audio('assets/out.wav');

function genCompChoice() {
    return (Math.floor(Math.random() * 6)) + 1;
}

function play() {
    let user_score = 0;
    let comp_score = 0;

    scoreBoard.innerText = 'Your Score: ' + user_score + ' | Comp\'s Score:  ' + comp_score;

    function match(user_choice) {
        let comp_choice = genCompChoice();
        let a = imagePaths[comp_choice];

        // Play cycle sound
        cycleSound.play();

        // To create the effect of cycling through images
        let count = 0;
        let cycleDuration = 40; // Set to 40 iterations for 4 seconds (40 * 100ms = 4000ms)
        let cycleInterval = setInterval(() => {
            // Generate a random choice to show during the cycle
            let randomChoice = Math.floor(Math.random() * 6) + 1;
            comp_emoji.setAttribute('src', imagePaths[randomChoice]);

            count++;
            if (count >= cycleDuration) { // 4 seconds
                clearInterval(cycleInterval); // Stop the cycle
                comp_emoji.setAttribute('src', a); // Show the final choice

                // Play the choice sound after cycling
                choiceSound.play();

                // Now that the cycling is done, update the score
                if (comp_choice === user_choice) {
                    // When user is out, show the current score without change
                    scoreBoard.innerText = 'You are out at ' + user_score;
                    outSound.play(); // Play the out sound
                    user_score = 0;
                    comp_score = 0;
                } else {
                    // Update user's score
                    user_score += user_choice;
                    scoreboardSound.play(); // Play scoreboard update sound
                    scoreBoard.innerText = 'Your Score: ' + user_score + ' | Comp\'s Score:  ' + comp_score;
                }
            }
        }, 100); // 100ms interval for cycling effect
    }

    emoji.forEach((value) => {
        value.addEventListener("click", () => {
            clickSound.play(); // Play the click sound
            let user_choice = value.getAttribute("id");
            let num = Number(user_choice);
            match(num);  // Call the match function when a user choice is made
        });
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Show the game options when Start is clicked
    document.getElementById("start-button").addEventListener("click", function () {
        const options = document.querySelectorAll(".options");
        options.forEach(option => {
            option.style.visibility = "visible";
        });

        document.getElementById("start-button").innerText = 'Restart';
        play();
    });

    // Show the help modal when Help is clicked
    document.getElementById("help-button").addEventListener("click", function () {
        const modal = document.getElementById("help-modal");
        modal.style.display = "block";  // Show the modal when Help is clicked
    });

    // Close the modal when the close button is clicked
    document.querySelector(".close-btn").addEventListener("click", function () {
        const modal = document.getElementById("help-modal");
        modal.style.display = "none";  // Hide the modal when the close button is clicked
    });

    // Close the modal if the user clicks anywhere outside of it
    window.addEventListener("click", function (event) {
        const modal = document.getElementById("help-modal");
        if (event.target == modal) {
            modal.style.display = "none";  // Close the modal if clicked outside of it
        }
    });
});
