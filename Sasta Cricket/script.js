
// const emoji = document.querySelectorAll(".emoji-box");
// const msg = document.querySelector("#msg");

// emoji.forEach((value) => {
//     value.addEventListener("click", () => {
//         const altText = box.querySelector("img").alt;
//         msg.innerText = `${altText} was clicked`;
//     })
// })

let user_score = 0;
let comp_score = 0

const imagePaths = {
    1: "assets/1.png",
    2: "assets/2.png",
    3: "assets/3.png",
    4: "assets/4.png",
    5: "assets/5.png",
    6: "assets/6.png"
};

document.addEventListener("DOMContentLoaded", function () {
    // Show the game options when Start is clicked
    document.getElementById("start-button").addEventListener("click", function () {
        const options = document.querySelectorAll(".options");
        options.forEach(option => {
            option.style.visibility = "visible";
        });

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

const emoji = document.querySelectorAll(".image");
const comp_emoji = document.querySelector(".comp_image");
const scoreBoard = document.querySelector("#scoreBoard");

function genCompChoice() {
    return (Math.floor(Math.random() * 6)) + 1;
}



function match(user_choice) {
    let comp_choice = genCompChoice();

    let a = imagePaths[comp_choice];

    // Wait for 2 seconds
    setTimeout(() => {
        comp_emoji.setAttribute('src', a); // Set computer's choice image

        if (comp_choice == user_choice) {
            // When user is out, show the current score without change
            scoreBoard.innerText = 'Your Score: ' + user_score + ' | Comp\'s Score:  ' + comp_score;
            console.log('You are out!');
        } else {
            // Update user's score
            user_score += user_choice;

            scoreBoard.innerText = 'Your Score: ' + user_score + ' | Comp\'s Score:  ' + comp_score;
        }
    }, 2000); // 2-second delay
}

emoji.forEach((value) => {
    value.addEventListener("click", () => {
        let user_choice = value.getAttribute("id");
        let num = Number(user_choice); 
        match(num);
    });
});
