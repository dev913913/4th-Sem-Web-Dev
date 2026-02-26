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

    // This should be outside the match function
    emoji.forEach((value) => {
        value.addEventListener("click", () => {
            clickSound.play();
            let user_choice = value.getAttribute("id");
            let num = Number(user_choice);
            match(num);  // Call match on click
        });
    });

    function match(user_choice) {
        let comp_choice = genCompChoice();
        let a = imagePaths[comp_choice];
        comp_emoji.setAttribute('src', a);

        // Here you can implement the score calculation and cycling effect if needed
        if (comp_choice === user_choice) {
            scoreBoard.innerText = 'You are out at ' + user_score;
            outSound.play();
            user_score = 0;
            comp_score = 0;
        } else {
            user_score += user_choice; // Score logic update
            scoreboardSound.play();
            scoreBoard.innerText = 'Your Score: ' + user_score + ' | Comp\'s Score:  ' + comp_score;
        }
    }
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
