
// const emoji = document.querySelectorAll(".emoji-box");
// const msg = document.querySelector("#msg");

// emoji.forEach((value) => {
//     value.addEventListener("click", () => {
//         const altText = box.querySelector("img").alt;
//         msg.innerText = `${altText} was clicked`;
//     })
// })



document.querySelector(".button1").addEventListener("click", () => {
    const options = document.querySelector("#options");
    options.style.visibility = "visible"; // Use `style.visibility` instead of `setAttribute`
});