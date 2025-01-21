
// const emoji = document.querySelectorAll(".emoji-box");
// const msg = document.querySelector("#msg");

// emoji.forEach((value) => {
//     value.addEventListener("click", () => {
//         const altText = box.querySelector("img").alt;
//         msg.innerText = `${altText} was clicked`;
//     })
// })


document.addEventListener("DOMContentLoaded", function () {
    // Show the game options when Start is clicked
    document.getElementById("start-button").addEventListener("click", function () {
        const options = document.getElementById("options");
        options.style.visibility = "visible";
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

function genCompChoice()
{
    return (Math.floor(Math.random() * 6)) + 1;
}

function match(user_choice)
{
    let comp_choice = genCompChoice();
    if(comp_choice == user_choice)
    {
        console.log('You are out bcs comps choice: ' + comp_choice + ' and yours: ' + user_choice);
    }
    else
        {
            console.log('You are not out bcs comps choice: ' + comp_choice + ' and yours: ' + user_choice);
        }
}

emoji.forEach((value) => {
        value.addEventListener("click", () => {
            let user_choice = value.getAttribute("id");
           match(user_choice);
        })
    })
