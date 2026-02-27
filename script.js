const imagePaths = {
    1: "assets/1.png",
    2: "assets/2.png",
    3: "assets/3.png",
    4: "assets/4.png",
    5: "assets/5.png",
    6: "assets/6.png"
};

const screens = document.querySelectorAll(".screen");
const scoreBoard = document.querySelector("#scoreBoard");
const statusText = document.querySelector("#status-text");
const ballsText = document.querySelector("#balls");
const runRateText = document.querySelector("#current-run-rate");
const bestScoreText = document.querySelector("#best-score");
const historyChips = document.querySelector("#history-chips");
const compEmoji = document.querySelector(".comp_image");
const optionButtons = document.querySelectorAll(".emoji-box");
const startBtn = document.querySelector("#start-button");
const helpBtn = document.querySelector("#help-button");
const muteBtn = document.querySelector("#mute-button");
const batFirstBtn = document.querySelector("#bat-first");
const bowlFirstBtn = document.querySelector("#bowl-first");
const roleBackBtn = document.querySelector("#role-back");
const chaseInfo = document.querySelector("#chase-info");
const lastBall = document.querySelector("#last-ball");
const helpModal = document.querySelector("#help-modal");
const closeBtn = document.querySelector(".close-btn");
const stepOne = document.querySelector(".step-1");
const stepTwo = document.querySelector(".step-2");
const inningsOverlay = document.querySelector("#innings-overlay");
const overlayOut = document.querySelector("#overlay-out");
const overlayScore = document.querySelector("#overlay-score");
const resultEmoji = document.querySelector("#result-emoji");
const resultText = document.querySelector("#result-text");
const finalScores = document.querySelector("#final-scores");
const newBestBanner = document.querySelector("#new-best-banner");
const playAgainBtn = document.querySelector("#play-again-button");
const homeBtn = document.querySelector("#home-button");

const clickSound = new Audio("assets/click.wav");
const scoreboardSound = new Audio("assets/scoreboard.wav");
const outSound = new Audio("assets/out.wav");
const choiceSound = new Audio("assets/choice.wav");

const SOUND_PREF_KEY = "emo-cricket-sound";
const HISTORY_KEY = "emo-cricket-history";

let soundEnabled = localStorage.getItem(SOUND_PREF_KEY) === null
    ? true
    : localStorage.getItem(SOUND_PREF_KEY) === "true";

let state = {
    started: false,
    userBattingFirst: true,
    innings: 1,
    userScore: 0,
    compScore: 0,
    target: null,
    balls: 0,
    gameOver: false,
    transitioning: false,
    lastUserChoice: null,
    lastCompChoice: null
};

function isMobileView() {
    return window.innerWidth < 768;
}

function showScreen(id) {
    if (!isMobileView()) return;
    screens.forEach(screen => {
        screen.classList.toggle("screen--active", screen.dataset.screen === id);
    });
}

function genCompChoice() {
    return Math.floor(Math.random() * 6) + 1;
}

function loadBestScore() {
    return Number(localStorage.getItem("emo-cricket-best") || 0);
}

function setBestScore(value) {
    localStorage.setItem("emo-cricket-best", String(value));
}

function loadHistory() {
    try {
        const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveHistory(entry) {
    const history = loadHistory();
    history.unshift(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

function renderHistory() {
    const items = loadHistory().slice(0, 3);
    if (items.length === 0) {
        historyChips.innerHTML = '<span class="history-chip">No matches yet</span>';
        return;
    }

    historyChips.innerHTML = items.map(item => {
        const emoji = item.result === "win" ? "✅" : item.result === "loss" ? "❌" : "🤝";
        return `<span class="history-chip">${emoji} ${item.userScore}-${item.compScore}</span>`;
    }).join("");
}

function updateBestScore() {
    bestScoreText.textContent = loadBestScore();
}

function playSound(audio) {
    if (!soundEnabled) return;
    audio.currentTime = 0;
    audio.play();
}

function formatRunRate() {
    if (!state.started || state.balls === 0) return "0.00";
    const userBattingNow = (state.innings === 1 && state.userBattingFirst) ||
        (state.innings === 2 && !state.userBattingFirst);
    const score = userBattingNow ? state.userScore : state.compScore;
    return ((score / state.balls) * 6).toFixed(2);
}

function setPlayButtons(enabled) {
    optionButtons.forEach(btn => {
        btn.disabled = !enabled;
    });
}

function updateStepper() {
    stepOne.classList.toggle("active", state.innings === 1);
    stepTwo.classList.toggle("active", state.innings === 2);
    stepOne.textContent = `${state.innings === 1 ? "●" : "○"} 1st Innings`;
    stepTwo.textContent = `${state.innings === 2 ? "●" : "○"} 2nd Innings`;
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
    optionButtons.forEach(btn => {
        if (userChoice === null) {
            btn.classList.remove("active");
            return;
        }
        btn.classList.toggle("active", Number(btn.dataset.run) === userChoice);
    });
}

function renderBoard(message = "") {
    if (message) {
        scoreBoard.textContent = message;
    } else if (!state.started) {
        scoreBoard.textContent = "You: 0 | Comp: 0 | Target: —";
    } else {
        scoreBoard.textContent = `You: ${state.userScore} | Comp: ${state.compScore} | Target: ${state.target ?? "—"}`;
    }

    ballsText.textContent = String(state.balls);
    runRateText.textContent = formatRunRate();
    updateChaseInfo();
    updateBestScore();
    renderHistory();
    updateStepper();
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
        transitioning: false,
        lastUserChoice: null,
        lastCompChoice: null
    };
    inningsOverlay.hidden = true;
    compEmoji.setAttribute("src", "assets/0.png");
    statusText.textContent = userBattingFirst ? "You are batting first. Score big!" : "You are bowling first. Restrict the computer!";
    setPlayButtons(true);
    setActiveChoice(null);
    updateLastBallText();
    renderBoard();
    showScreen("game");
}

function completeMatch() {
    state.gameOver = true;
    state.started = false;
    setPlayButtons(false);

    let result = "tie";
    let message = "It's a tie!";
    let emoji = "🤝";

    if (state.userScore > state.compScore) {
        result = "win";
        message = "You won the match!";
        emoji = "🏆";
    }

    if (state.userScore < state.compScore) {
        result = "loss";
        message = "Computer won the match.";
        emoji = "😔";
    }

    const oldBest = loadBestScore();
    const isNewBest = state.userScore > oldBest;
    if (isNewBest) {
        setBestScore(state.userScore);
    }

    saveHistory({
        date: new Date().toISOString(),
        userScore: state.userScore,
        compScore: state.compScore,
        result,
        userBatFirst: state.userBattingFirst
    });

    resultEmoji.textContent = emoji;
    resultText.textContent = message;
    finalScores.textContent = `Final: You ${state.userScore} | Comp ${state.compScore}`;
    newBestBanner.hidden = !isNewBest;
    statusText.textContent = "Press Start Match to play again.";
    renderBoard(`${message} Final — You: ${state.userScore}, Comp: ${state.compScore}`);
    showScreen("result");
}

function beginSecondInnings(outMessage) {
    state.innings = 2;
    state.balls = 0;
    state.target = (state.userBattingFirst ? state.userScore : state.compScore) + 1;
    state.transitioning = false;
    statusText.textContent = state.userBattingFirst
        ? `Computer needs ${state.target} to win.`
        : `You need ${state.target} to win.`;
    inningsOverlay.hidden = true;
    setPlayButtons(true);
    renderBoard(`${outMessage} Target is ${state.target}.`);
}

function switchInnings(outMessage) {
    playSound(outSound);

    if (state.innings === 1) {
        state.transitioning = true;
        setPlayButtons(false);
        overlayOut.textContent = outMessage;
        overlayScore.textContent = `You: ${state.userScore} | Comp: ${state.compScore}`;
        inningsOverlay.hidden = false;
        setTimeout(() => beginSecondInnings(outMessage), 2500);
        return;
    }

    completeMatch();
}

function playBall(userChoice) {
    if (!state.started || state.gameOver || state.transitioning) return;

    playSound(clickSound);

    const compChoice = genCompChoice();
    compEmoji.setAttribute("src", imagePaths[compChoice]);
    compEmoji.classList.add("pop");
    playSound(choiceSound);

    state.lastUserChoice = userChoice;
    state.lastCompChoice = compChoice;
    setActiveChoice(userChoice);
    state.balls += 1;

    const userBattingThisInnings = (state.innings === 1 && state.userBattingFirst) || (state.innings === 2 && !state.userBattingFirst);

    if (navigator.vibrate) {
        navigator.vibrate(compChoice === userChoice ? [60, 30, 60] : 30);
    }

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
}

function toggleHelpModal(show) {
    helpModal.style.display = show ? "block" : "none";
    helpModal.setAttribute("aria-hidden", show ? "false" : "true");
}

startBtn.addEventListener("click", () => {
    state.started = false;
    state.gameOver = false;
    state.transitioning = false;
    state.lastUserChoice = null;
    state.lastCompChoice = null;
    setPlayButtons(false);
    setActiveChoice(null);
    updateLastBallText();
    statusText.textContent = "Select Bat First or Bowl First to begin.";
    renderBoard();
    showScreen("role-select");
});

roleBackBtn.addEventListener("click", () => {
    showScreen("lobby");
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

window.addEventListener("click", event => {
    if (event.target === helpModal) toggleHelpModal(false);
});

muteBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_PREF_KEY, String(soundEnabled));
    muteBtn.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
    muteBtn.setAttribute("aria-pressed", String(!soundEnabled));
});

playAgainBtn.addEventListener("click", () => {
    showScreen("role-select");
});

homeBtn.addEventListener("click", () => {
    showScreen("lobby");
});

document.addEventListener("keydown", event => {
    if (event.key >= "1" && event.key <= "6") {
        playBall(Number(event.key));
    }

    if (event.key === "Enter" && !state.started) {
        startBtn.click();
    }

    if (event.key === "Escape") {
        toggleHelpModal(false);
    }
});

compEmoji.addEventListener("animationend", () => {
    compEmoji.classList.remove("pop");
});

window.addEventListener("resize", () => {
    if (!isMobileView()) {
        screens.forEach(screen => screen.classList.add("screen--active"));
    } else {
        if (!document.querySelector(".screen--active")) showScreen("lobby");
    }
});

muteBtn.textContent = soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
muteBtn.setAttribute("aria-pressed", String(!soundEnabled));
setPlayButtons(false);
setActiveChoice(null);
renderBoard();
showScreen("lobby");
