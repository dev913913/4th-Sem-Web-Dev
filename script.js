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
const optionButtons = document.querySelectorAll(".emoji-box");
const startBtn = document.querySelector("#start-button");
const helpBtn = document.querySelector("#help-button");
const muteBtn = document.querySelector("#mute-button");
const batFirstBtn = document.querySelector("#bat-first");
const bowlFirstBtn = document.querySelector("#bowl-first");
const chaseInfo = document.querySelector("#chase-info");
const lastBall = document.querySelector("#last-ball");
const helpModal = document.querySelector("#help-modal");
const closeBtn = document.querySelector(".close-btn");
const controlsPanel = document.querySelector("#controls-panel");
const scorePanel = document.querySelector("#score-panel");
const choicesPanel = document.querySelector("#choices-panel");
const mobileQuery = window.matchMedia("(max-width: 700px)");

const clickSound = new Audio("assets/click.wav");
const scoreboardSound = new Audio("assets/scoreboard.wav");
const outSound = new Audio("assets/out.wav");
const choiceSound = new Audio("assets/choice.wav");

let soundEnabled = true;

let state = {
    started: false,
    userBattingFirst: true,
    innings: 1,
    userScore: 0,
    compScore: 0,
    target: null,
    balls: 0,
    gameOver: false,
    lastUserChoice: null,
    lastCompChoice: null
};

function genCompChoice() {
    return Math.floor(Math.random() * 6) + 1;
}

function loadBestScore() {
    return Number(localStorage.getItem("emo-cricket-best") || 0);
}

function setBestScore(value) {
    localStorage.setItem("emo-cricket-best", String(value));
}

function updateBestScore() {
    const best = loadBestScore();
    bestScoreText.textContent = best;
}

function playSound(audio) {
    if (!soundEnabled) return;
    audio.currentTime = 0;
    audio.play();
}

function formatRunRate() {
    if (!state.started || state.balls === 0) return "0.00";
    const score = state.innings === 1 ? state.userScore : state.userBattingFirst ? state.compScore : state.userScore;
    return ((score / state.balls) * 6).toFixed(2);
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

function updateChaseInfo() {
    if (!(state.innings === 2 && state.target)) {
        chaseInfo.hidden = true;
        return;
    }

    const chasingScore = state.userBattingFirst ? state.compScore : state.userScore;
    const need = Math.max(0, state.target - chasingScore);
    chaseInfo.textContent = need > 0 ? `Need ${need} runs to win` : "Target reached!";
    chaseInfo.hidden = false;
}

function updateLastBallText() {
    if (!state.lastUserChoice || !state.lastCompChoice) {
        lastBall.textContent = "Last ball: —";
        return;
    }
    lastBall.textContent = `Last ball: You played ${state.lastUserChoice}, Computer played ${state.lastCompChoice}`;
}

function setActiveChoice(userChoice) {
    optionButtons.forEach(button => {
        button.classList.toggle("active", Number(button.dataset.run) === userChoice);
    });
}

function updateMobileLayout() {
    const isMobile = mobileQuery.matches;
    if (!isMobile) {
        controlsPanel.classList.remove("mobile-hidden");
        scorePanel.classList.remove("mobile-hidden");
        choicesPanel.classList.remove("mobile-hidden");
        return;
    }

    controlsPanel.classList.remove("mobile-hidden");
    scorePanel.classList.remove("mobile-hidden");

    const showChoices = state.started && !state.gameOver;
    choicesPanel.classList.toggle("mobile-hidden", !showChoices);
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
        lastUserChoice: null,
        lastCompChoice: null
    };
    compEmoji.setAttribute("src", "assets/0.png");
    statusText.textContent = userBattingFirst ? "You are batting first. Score big!" : "You are bowling first. Restrict the computer!";
    phaseText.textContent = "1st innings";
    setRoleButtons(false);
    setPlayButtons(true);
    updateLastBallText();
    renderBoard();
    updateMobileLayout();
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
    updateChaseInfo();
    updateBestScore();
}

function completeMatch() {
    state.gameOver = true;
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
    renderBoard(`${result} Final — You: ${state.userScore}, Computer: ${state.compScore}`);
    updateMobileLayout();
}

function switchInnings(outMessage) {
    playSound(outSound);

    if (state.innings === 1) {
        state.innings = 2;
        state.balls = 0;
        state.target = (state.userBattingFirst ? state.userScore : state.compScore) + 1;
        phaseText.textContent = "2nd innings";
        statusText.textContent = state.userBattingFirst
            ? `Computer needs ${state.target} to win.`
            : `You need ${state.target} to win.`;
        renderBoard(`${outMessage} Target is ${state.target}.`);
        return;
    }

    completeMatch();
}

function playBall(userChoice) {
    if (!state.started || state.gameOver) return;

    playSound(clickSound);

    const compChoice = genCompChoice();
    compEmoji.setAttribute("src", imagePaths[compChoice]);
    playSound(choiceSound);

    state.lastUserChoice = userChoice;
    state.lastCompChoice = compChoice;
    setActiveChoice(userChoice);
    state.balls += 1;

    const userBattingThisInnings = (state.innings === 1 && state.userBattingFirst) || (state.innings === 2 && !state.userBattingFirst);

    if (compChoice === userChoice) {
        updateLastBallText();
        const outMessage = userBattingThisInnings ? `You are OUT on ${state.userScore}.` : `Computer is OUT on ${state.compScore}.`;
        switchInnings(outMessage);
        return;
    }

    playSound(scoreboardSound);

    if (userBattingThisInnings) {
        state.userScore += userChoice;
    } else {
        state.compScore += compChoice;
    }

    updateLastBallText();

    if (state.innings === 2 && state.target) {
        if (state.userBattingFirst && state.compScore >= state.target) {
            completeMatch();
            return;
        }

        if (!state.userBattingFirst && state.userScore >= state.target) {
            completeMatch();
            return;
        }
    }

    renderBoard();
    updateMobileLayout();
}

function toggleHelpModal(show) {
    helpModal.style.display = show ? "block" : "none";
    helpModal.setAttribute("aria-hidden", show ? "false" : "true");
}

startBtn.addEventListener("click", () => {
    setRoleButtons(true);
    setPlayButtons(false);
    state.started = false;
    state.gameOver = false;
    state.lastUserChoice = null;
    state.lastCompChoice = null;
    setActiveChoice(-1);
    updateLastBallText();
    statusText.textContent = "Select Bat First or Bowl First to begin.";
    phaseText.textContent = "Waiting for role";
    renderBoard();
    updateMobileLayout();
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
    toggleHelpModal(true);
});

closeBtn.addEventListener("click", () => {
    toggleHelpModal(false);
});

window.addEventListener("click", (event) => {
    if (event.target === helpModal) toggleHelpModal(false);
});

muteBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    muteBtn.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
    muteBtn.setAttribute("aria-pressed", String(!soundEnabled));
});

document.addEventListener("keydown", (event) => {
    if (event.key >= "1" && event.key <= "6") {
        const targetRun = Number(event.key);
        playBall(targetRun);
    }

    if (event.key === "Enter" && !state.started) {
        startBtn.click();
    }

    if (event.key === "Escape") {
        toggleHelpModal(false);
    }
});


mobileQuery.addEventListener("change", updateMobileLayout);

setPlayButtons(false);
setRoleButtons(false);
updateBestScore();
renderBoard();
updateMobileLayout();
