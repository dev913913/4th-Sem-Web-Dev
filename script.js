const imagePaths = {
    1: "assets/1.png",
    2: "assets/2.png",
    3: "assets/3.png",
    4: "assets/4.png",
    5: "assets/5.png",
    6: "assets/6.png"
};

const scoreBoard = document.querySelector("#scoreBoard");
const statusText = document.querySelector("#status-text");
const phaseText = document.querySelector("#phase");
const ballsText = document.querySelector("#balls");
const runRateText = document.querySelector("#current-run-rate");
const bestScoreText = document.querySelector("#best-score");
const compEmoji = document.querySelector(".comp_image");
const compChoiceBox = document.querySelector("#comp-choice-box");
const revealHint = document.querySelector("#reveal-hint");
const optionButtons = document.querySelectorAll(".emoji-box");
const startBtn = document.querySelector("#start-button");
const helpBtn = document.querySelector("#help-button");
const batFirstBtn = document.querySelector("#bat-first");
const bowlFirstBtn = document.querySelector("#bowl-first");

const clickSound = new Audio("assets/click.wav");
const cycleSound = new Audio("assets/cycle.mp3");
const scoreboardSound = new Audio("assets/scoreboard.wav");
const outSound = new Audio("assets/out.wav");
const choiceSound = new Audio("assets/choice.wav");

let state = {
    started: false,
    userBattingFirst: true,
    innings: 1,
    userScore: 0,
    compScore: 0,
    target: null,
    balls: 0,
    gameOver: false,
    resolvingBall: false
};

function genCompChoice() {
    return Math.floor(Math.random() * 6) + 1;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function loadBestScore() {
    return Number(localStorage.getItem("emo-cricket-best") || 0);
}

function setBestScore(value) {
    localStorage.setItem("emo-cricket-best", String(value));
}

function updateBestScore() {
    bestScoreText.textContent = loadBestScore();
}

function formatRunRate() {
    const balls = Math.max(1, state.balls);
    const score = state.innings === 1 ? state.userScore : state.userBattingFirst ? state.compScore : state.userScore;
    return ((score / balls) * 6).toFixed(2);
}

function setRoleButtons(enabled) {
    batFirstBtn.disabled = !enabled;
    bowlFirstBtn.disabled = !enabled;
}

function setPlayButtons(enabled) {
    optionButtons.forEach(btn => {
        btn.disabled = !enabled;
    });
}

function resetMatch(userBattingFirst = true) {
    state = {
        started: true,
        userBattingFirst,
        innings: 1,
        userScore: 0,
        compScore: 0,
        target: null,
        balls: 0,
        gameOver: false,
        resolvingBall: false
    };

    compEmoji.setAttribute("src", "assets/0.png");
    revealHint.textContent = "Pick your hand to play the next ball.";
    statusText.textContent = userBattingFirst ? "You are batting first. Score big!" : "You are bowling first. Restrict the computer!";
    phaseText.textContent = "1st innings";
    setRoleButtons(false);
    setPlayButtons(true);
    renderBoard();
}

function renderBoard(message = "") {
    if (message) {
        scoreBoard.textContent = message;
    } else if (!state.started) {
        scoreBoard.textContent = "Press Start New Match";
    } else {
        scoreBoard.textContent = `You: ${state.userScore} | Computer: ${state.compScore}${state.target ? ` | Target: ${state.target}` : ""}`;
    }

    ballsText.textContent = String(state.balls);
    runRateText.textContent = formatRunRate();
    updateBestScore();
}

function completeMatch() {
    state.gameOver = true;
    state.resolvingBall = false;
    setPlayButtons(false);
    setRoleButtons(true);

    let result = "Match tied!";
    if (state.userScore > state.compScore) result = "🎉 You won the match!";
    if (state.userScore < state.compScore) result = "😔 Computer won the match.";

    const oldBest = loadBestScore();
    if (state.userScore > oldBest) {
        setBestScore(state.userScore);
        result += " New best score!";
    }

    phaseText.textContent = "Match completed";
    statusText.textContent = "Press Start New Match for another game.";
    revealHint.textContent = "Match over. Start a new match for rematch.";
    renderBoard(`${result} Final — You: ${state.userScore}, Computer: ${state.compScore}`);
}

function switchInnings(outMessage) {
    outSound.currentTime = 0;
    outSound.play();

    if (state.innings === 1) {
        state.innings = 2;
        state.balls = 0;
        state.target = (state.userBattingFirst ? state.userScore : state.compScore) + 1;
        phaseText.textContent = "2nd innings";
        statusText.textContent = state.userBattingFirst
            ? `Computer needs ${state.target} to win.`
            : `You need ${state.target} to win.`;
        revealHint.textContent = "Innings switched. Next ball starts now.";
        renderBoard(`${outMessage} Target is ${state.target}.`);
        return;
    }

    completeMatch();
}

async function animateComputerHand(finalChoice) {
    revealHint.textContent = "Computer is choosing...";
    compChoiceBox.classList.add("shake");

    cycleSound.currentTime = 0;
    cycleSound.play();

    for (let i = 0; i < 6; i += 1) {
        const teaseChoice = genCompChoice();
        compEmoji.setAttribute("src", imagePaths[teaseChoice]);
        await wait(95);
    }

    await wait(120);
    compEmoji.setAttribute("src", imagePaths[finalChoice]);
    compChoiceBox.classList.remove("shake");

    choiceSound.currentTime = 0;
    choiceSound.play();
    revealHint.textContent = "Revealed!";
}

async function playBall(userChoice) {
    if (!state.started || state.gameOver || state.resolvingBall) return;
    state.resolvingBall = true;

    clickSound.currentTime = 0;
    clickSound.play();

    setPlayButtons(false);
    const compChoice = genCompChoice();
    await animateComputerHand(compChoice);

    state.balls += 1;

    const userBattingThisInnings = (state.innings === 1 && state.userBattingFirst) || (state.innings === 2 && !state.userBattingFirst);

    if (compChoice === userChoice) {
        const outMessage = userBattingThisInnings ? `You are OUT on ${state.userScore}.` : `Computer is OUT on ${state.compScore}.`;
        switchInnings(outMessage);
        state.resolvingBall = false;
        if (!state.gameOver) setPlayButtons(true);
        return;
    }

    scoreboardSound.currentTime = 0;
    scoreboardSound.play();

    if (userBattingThisInnings) {
        state.userScore += userChoice;
        revealHint.textContent = `Nice shot! +${userChoice} run${userChoice > 1 ? "s" : ""}.`;
    } else {
        state.compScore += compChoice;
        revealHint.textContent = `Computer scored ${compChoice}. Keep bowling!`;
    }

    if (state.innings === 2 && state.target) {
        if (state.userBattingFirst && state.compScore >= state.target) {
            completeMatch();
            state.resolvingBall = false;
            return;
        }

        if (!state.userBattingFirst && state.userScore >= state.target) {
            completeMatch();
            state.resolvingBall = false;
            return;
        }
    }

    renderBoard();
    state.resolvingBall = false;
    setPlayButtons(true);
}

startBtn.addEventListener("click", () => {
    setRoleButtons(true);
    setPlayButtons(false);
    state.started = false;
    state.gameOver = false;
    state.resolvingBall = false;
    revealHint.textContent = "Pick Bat First or Bowl First.";
    statusText.textContent = "Select Bat First or Bowl First to begin.";
    phaseText.textContent = "Waiting for role";
    renderBoard();
});

batFirstBtn.addEventListener("click", () => resetMatch(true));
bowlFirstBtn.addEventListener("click", () => resetMatch(false));

optionButtons.forEach(button => {
    button.addEventListener("click", () => {
        const run = Number(button.dataset.run);
        playBall(run);
    });
});

helpBtn.addEventListener("click", () => {
    document.getElementById("help-modal").style.display = "block";
});

document.querySelector(".close-btn").addEventListener("click", () => {
    document.getElementById("help-modal").style.display = "none";
});

window.addEventListener("click", event => {
    const modal = document.getElementById("help-modal");
    if (event.target === modal) modal.style.display = "none";
});

setPlayButtons(false);
setRoleButtons(false);
updateBestScore();
renderBoard();
