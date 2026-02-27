const imagePaths = {
    0: "assets/0.png",
    1: "assets/1.png",
    2: "assets/2.png",
    3: "assets/3.png",
    4: "assets/4.png",
    5: "assets/5.png",
    6: "assets/6.png"
};

const STORAGE_KEYS = {
    sound: "emo-cricket-sound",
    history: "emo-cricket-history",
    best: "emo-cricket-best"
};

const TIMING = {
    revealDelayMs: 220,
    inningsSwitchMs: 1800,
    feedbackPulseMs: 420
};

const dom = {
    screens: document.querySelectorAll(".screen"),
    statusText: document.querySelector("#status-text"),
    scoreBoard: document.querySelector("#scoreBoard"),
    scoreYou: document.querySelector("#score-you"),
    scoreComp: document.querySelector("#score-comp"),
    scoreTarget: document.querySelector("#score-target"),
    ballsText: document.querySelector("#balls"),
    runRateText: document.querySelector("#current-run-rate"),
    bestScoreText: document.querySelector("#best-score"),
    historyChips: document.querySelector("#history-chips"),
    compEmoji: document.querySelector(".comp_image"),
    optionGrid: document.querySelector("#player-options"),
    optionButtons: document.querySelectorAll(".emoji-box"),
    startBtn: document.querySelector("#start-button"),
    helpBtn: document.querySelector("#help-button"),
    muteBtn: document.querySelector("#mute-button"),
    batFirstBtn: document.querySelector("#bat-first"),
    bowlFirstBtn: document.querySelector("#bowl-first"),
    roleBackBtn: document.querySelector("#role-back"),
    chaseInfo: document.querySelector("#chase-info"),
    lastBall: document.querySelector("#last-ball"),
    helpModal: document.querySelector("#help-modal"),
    closeBtn: document.querySelector(".close-btn"),
    stepOne: document.querySelector(".step-1"),
    stepTwo: document.querySelector(".step-2"),
    inningsOverlay: document.querySelector("#innings-overlay"),
    overlayOut: document.querySelector("#overlay-out"),
    overlayScore: document.querySelector("#overlay-score"),
    resultEmoji: document.querySelector("#result-emoji"),
    resultText: document.querySelector("#result-text"),
    finalScores: document.querySelector("#final-scores"),
    newBestBanner: document.querySelector("#new-best-banner"),
    playAgainBtn: document.querySelector("#play-again-button"),
    homeBtn: document.querySelector("#home-button"),
    feedbackBanner: document.querySelector("#feedback-banner")
};

const audio = {
    click: new Audio("assets/click.wav"),
    scoreboard: new Audio("assets/scoreboard.wav"),
    out: new Audio("assets/out.wav"),
    choice: new Audio("assets/choice.wav")
};

const gameState = {
    phase: "lobby", // lobby | role-select | game | result
    started: false,
    inputLocked: false,
    userBattingFirst: true,
    innings: 1,
    userScore: 0,
    compScore: 0,
    target: null,
    balls: 0,
    gameOver: false,
    lastUserChoice: null,
    lastCompChoice: null,
    soundEnabled: loadSoundPreference(),
    bestScore: loadBestScore(),
    pendingTimers: new Set()
};

function isMobileView() {
    return window.innerWidth < 768;
}

function randomRun() {
    // Fair and unbiased 1-6 distribution.
    return crypto.getRandomValues(new Uint32Array(1))[0] % 6 + 1;
}

function loadSoundPreference() {
    const stored = localStorage.getItem(STORAGE_KEYS.sound);
    return stored === null ? true : stored === "true";
}

function loadBestScore() {
    return Number(localStorage.getItem(STORAGE_KEYS.best) || 0);
}

function setBestScore(value) {
    gameState.bestScore = value;
    localStorage.setItem(STORAGE_KEYS.best, String(value));
}

function loadHistory() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveHistory(entry) {
    const history = loadHistory();
    history.unshift(entry);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 10)));
}

function clearTimers() {
    gameState.pendingTimers.forEach(timerId => clearTimeout(timerId));
    gameState.pendingTimers.clear();
}

function schedule(callback, delayMs) {
    const timerId = setTimeout(() => {
        gameState.pendingTimers.delete(timerId);
        callback();
    }, delayMs);
    gameState.pendingTimers.add(timerId);
}

function playSound(effect) {
    if (!gameState.soundEnabled) return;
    effect.currentTime = 0;
    effect.play();
}

function getBattingSideThisInnings() {
    return (gameState.innings === 1 && gameState.userBattingFirst) ||
        (gameState.innings === 2 && !gameState.userBattingFirst);
}

function calculateRunRate() {
    if (!gameState.started || gameState.balls === 0) return "0.00";
    const currentBattingScore = getBattingSideThisInnings() ? gameState.userScore : gameState.compScore;
    return ((currentBattingScore / gameState.balls) * 6).toFixed(2);
}

function setScreen(screenId) {
    gameState.phase = screenId;
    if (!isMobileView()) return;

    dom.screens.forEach(screen => {
        screen.classList.toggle("screen--active", screen.dataset.screen === screenId);
    });
}

function setPlayButtonsEnabled(enabled) {
    dom.optionButtons.forEach(button => {
        button.disabled = !enabled;
    });
}

function setActiveChoice(userChoice) {
    dom.optionButtons.forEach(button => {
        const active = userChoice !== null && Number(button.dataset.run) === userChoice;
        button.classList.toggle("active", active);
        button.classList.toggle("pressed", active);
    });
}

function pulseScoreboard() {
    dom.scoreBoard.classList.remove("scoreboard--pulse");
    void dom.scoreBoard.offsetWidth;
    dom.scoreBoard.classList.add("scoreboard--pulse");
}

function setFeedback(message, tone = "neutral") {
    dom.feedbackBanner.textContent = message;
    dom.feedbackBanner.dataset.tone = tone;
    dom.feedbackBanner.classList.add("show");

    schedule(() => {
        if (!gameState.gameOver) {
            dom.feedbackBanner.classList.remove("show");
            dom.feedbackBanner.dataset.tone = "neutral";
        }
    }, TIMING.feedbackPulseMs);
}

function renderHistory() {
    const items = loadHistory().slice(0, 3);
    if (items.length === 0) {
        dom.historyChips.innerHTML = '<span class="history-chip">No matches yet</span>';
        return;
    }

    dom.historyChips.innerHTML = items.map(item => {
        const emoji = item.result === "win" ? "✅" : item.result === "loss" ? "❌" : "🤝";
        return `<span class="history-chip">${emoji} ${item.userScore}-${item.compScore}</span>`;
    }).join("");
}

function renderLastBall() {
    if (!gameState.lastUserChoice || !gameState.lastCompChoice) {
        dom.lastBall.textContent = "Last ball: —";
        return;
    }
    dom.lastBall.textContent = `Last ball: You ${gameState.lastUserChoice} · Comp ${gameState.lastCompChoice}`;
}

function renderStepper() {
    const inFirst = gameState.innings === 1;
    dom.stepOne.classList.toggle("active", inFirst);
    dom.stepTwo.classList.toggle("active", !inFirst);
    dom.stepOne.textContent = `${inFirst ? "●" : "○"} 1st Innings`;
    dom.stepTwo.textContent = `${inFirst ? "○" : "●"} 2nd Innings`;
}

function renderChaseInfo() {
    if (!(gameState.innings === 2 && gameState.target)) {
        dom.chaseInfo.hidden = true;
        return;
    }

    const chasingScore = gameState.userBattingFirst ? gameState.compScore : gameState.userScore;
    const need = Math.max(0, gameState.target - chasingScore);
    dom.chaseInfo.textContent = need > 0 ? `Need ${need} runs to win` : "Target reached!";
    dom.chaseInfo.hidden = false;
}

function renderScoreboard() {
    dom.scoreYou.textContent = String(gameState.userScore);
    dom.scoreComp.textContent = String(gameState.compScore);
    dom.scoreTarget.textContent = gameState.target ?? "—";
    dom.ballsText.textContent = String(gameState.balls);
    dom.runRateText.textContent = calculateRunRate();
    dom.bestScoreText.textContent = String(gameState.bestScore);
    renderStepper();
    renderChaseInfo();
}

function renderLobby() {
    renderHistory();
    dom.statusText.textContent = "Choose your role to begin.";
}

function revealComputerChoice(compChoice) {
    dom.compEmoji.src = imagePaths[compChoice];
    dom.compEmoji.classList.remove("pop");
    void dom.compEmoji.offsetWidth;
    dom.compEmoji.classList.add("pop");
}

function resetForRoleSelect() {
    clearTimers();
    gameState.started = false;
    gameState.gameOver = false;
    gameState.inputLocked = false;
    gameState.lastUserChoice = null;
    gameState.lastCompChoice = null;

    setPlayButtonsEnabled(false);
    setActiveChoice(null);
    dom.inningsOverlay.hidden = true;
    dom.compEmoji.src = imagePaths[0];
    dom.feedbackBanner.textContent = "Pick a run to play the ball.";
    dom.feedbackBanner.dataset.tone = "neutral";
    renderLastBall();
    renderScoreboard();
}

function startMatch(userBattingFirst) {
    clearTimers();

    Object.assign(gameState, {
        started: true,
        inputLocked: false,
        userBattingFirst,
        innings: 1,
        userScore: 0,
        compScore: 0,
        target: null,
        balls: 0,
        gameOver: false,
        lastUserChoice: null,
        lastCompChoice: null
    });

    dom.inningsOverlay.hidden = true;
    dom.compEmoji.src = imagePaths[0];
    dom.statusText.textContent = userBattingFirst
        ? "You bat first. Build pressure with big shots!"
        : "You bowl first. Hunt for an early wicket!";

    setPlayButtonsEnabled(true);
    setActiveChoice(null);
    renderLastBall();
    renderScoreboard();
    setScreen("game");
}

function finalizeMatch() {
    gameState.gameOver = true;
    gameState.started = false;
    gameState.inputLocked = true;
    setPlayButtonsEnabled(false);

    let result = "tie";
    let message = "It's a tie!";
    let emoji = "🤝";

    if (gameState.userScore > gameState.compScore) {
        result = "win";
        message = "You won the match!";
        emoji = "🏆";
    } else if (gameState.userScore < gameState.compScore) {
        result = "loss";
        message = "Computer won the match.";
        emoji = "💀";
    }

    const isNewBest = gameState.userScore > gameState.bestScore;
    if (isNewBest) {
        setBestScore(gameState.userScore);
    }

    saveHistory({
        date: new Date().toISOString(),
        userScore: gameState.userScore,
        compScore: gameState.compScore,
        result,
        userBatFirst: gameState.userBattingFirst
    });

    dom.resultEmoji.textContent = emoji;
    dom.resultText.textContent = message;
    dom.finalScores.textContent = `Final: You ${gameState.userScore} | Comp ${gameState.compScore}`;
    dom.newBestBanner.hidden = !isNewBest;
    dom.statusText.textContent = "Press Start Match to play again.";
    setFeedback(result === "win" ? "Victory! 🏆" : result === "loss" ? "Defeat! Regroup for the next game." : "Dead even!", result === "win" ? "good" : result === "loss" ? "bad" : "neutral");

    renderHistory();
    renderScoreboard();
    setScreen("result");
}

function beginSecondInnings(outMessage) {
    gameState.innings = 2;
    gameState.balls = 0;
    gameState.target = (gameState.userBattingFirst ? gameState.userScore : gameState.compScore) + 1;
    gameState.inputLocked = false;

    dom.statusText.textContent = gameState.userBattingFirst
        ? `Computer needs ${gameState.target}. Defend every run!`
        : `You need ${gameState.target}. Chase calmly.`;

    dom.inningsOverlay.hidden = true;
    setPlayButtonsEnabled(true);
    renderScoreboard();
    setFeedback(`2nd innings starts. Target: ${gameState.target}`, "neutral");
    playSound(audio.scoreboard);

    if (outMessage) {
        dom.lastBall.textContent = outMessage;
    }
}

function switchInnings(outMessage) {
    playSound(audio.out);

    if (gameState.innings === 1) {
        gameState.inputLocked = true;
        setPlayButtonsEnabled(false);
        dom.overlayOut.textContent = outMessage;
        dom.overlayScore.textContent = `You: ${gameState.userScore} | Comp: ${gameState.compScore}`;
        dom.inningsOverlay.hidden = false;
        schedule(() => beginSecondInnings(outMessage), TIMING.inningsSwitchMs);
        return;
    }

    finalizeMatch();
}

function shouldChaseEnd() {
    if (!(gameState.innings === 2 && gameState.target)) return false;

    if (gameState.userBattingFirst) {
        return gameState.compScore >= gameState.target;
    }

    return gameState.userScore >= gameState.target;
}

function applyBallResult(userChoice, compChoice) {
    const userBatting = getBattingSideThisInnings();

    if (compChoice === userChoice) {
        const outMessage = userBatting
            ? `WICKET! You are out on ${gameState.userScore}.`
            : `WICKET! Computer is out on ${gameState.compScore}.`;

        setFeedback("WICKET! 💥", "bad");
        if (navigator.vibrate) navigator.vibrate([50, 20, 80]);
        switchInnings(outMessage);
        return;
    }

    playSound(audio.scoreboard);

    if (userBatting) {
        gameState.userScore += userChoice;
        setFeedback(`+${userChoice} runs!`, "good");
    } else {
        gameState.compScore += compChoice;
        setFeedback(`Computer +${compChoice}`, "bad");
    }

    if (navigator.vibrate) navigator.vibrate(20);

    if (shouldChaseEnd()) {
        finalizeMatch();
    }
}

function lockInputForReveal() {
    gameState.inputLocked = true;
    setPlayButtonsEnabled(false);
}

function unlockInputAfterReveal() {
    if (gameState.gameOver || !gameState.started) return;
    if (gameState.innings === 1 || !dom.inningsOverlay.hidden) {
        gameState.inputLocked = false;
        setPlayButtonsEnabled(true);
    }
}

function playBall(userChoice) {
    if (!gameState.started || gameState.gameOver || gameState.inputLocked) return;

    const compChoice = randomRun();
    gameState.lastUserChoice = userChoice;
    gameState.lastCompChoice = compChoice;
    gameState.balls += 1;

    setActiveChoice(userChoice);
    renderLastBall();
    playSound(audio.click);
    lockInputForReveal();

    setFeedback("...bowler is running in", "neutral");

    schedule(() => {
        revealComputerChoice(compChoice);
        playSound(audio.choice);
        applyBallResult(userChoice, compChoice);
        renderScoreboard();
        pulseScoreboard();
        unlockInputAfterReveal();
    }, TIMING.revealDelayMs);
}

function toggleHelpModal(show) {
    dom.helpModal.style.display = show ? "block" : "none";
    dom.helpModal.setAttribute("aria-hidden", show ? "false" : "true");
}

function onOptionClick(event) {
    const button = event.target.closest(".emoji-box");
    if (!button) return;
    playBall(Number(button.dataset.run));
}

function onKeyDown(event) {
    if (event.key >= "1" && event.key <= "6") {
        playBall(Number(event.key));
    }

    if (event.key === "Enter" && !gameState.started) {
        dom.startBtn.click();
    }

    if (event.key === "Escape") {
        toggleHelpModal(false);
    }
}

function bindEvents() {
    dom.startBtn.addEventListener("click", () => {
        resetForRoleSelect();
        dom.statusText.textContent = "Select Bat First or Bowl First to begin.";
        setScreen("role-select");
    });

    dom.roleBackBtn.addEventListener("click", () => setScreen("lobby"));
    dom.batFirstBtn.addEventListener("click", () => startMatch(true));
    dom.bowlFirstBtn.addEventListener("click", () => startMatch(false));
    dom.optionGrid.addEventListener("click", onOptionClick);

    dom.helpBtn.addEventListener("click", () => toggleHelpModal(true));
    dom.closeBtn.addEventListener("click", () => toggleHelpModal(false));

    window.addEventListener("click", event => {
        if (event.target === dom.helpModal) toggleHelpModal(false);
    });

    dom.muteBtn.addEventListener("click", () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.sound, String(gameState.soundEnabled));
        dom.muteBtn.textContent = gameState.soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
        dom.muteBtn.setAttribute("aria-pressed", String(!gameState.soundEnabled));
    });

    dom.playAgainBtn.addEventListener("click", () => {
        resetForRoleSelect();
        setScreen("role-select");
    });

    dom.homeBtn.addEventListener("click", () => {
        resetForRoleSelect();
        renderLobby();
        setScreen("lobby");
    });

    document.addEventListener("keydown", onKeyDown);

    dom.compEmoji.addEventListener("animationend", () => {
        dom.compEmoji.classList.remove("pop");
    });

    window.addEventListener("resize", () => {
        if (!isMobileView()) {
            dom.screens.forEach(screen => screen.classList.add("screen--active"));
            return;
        }

        setScreen(gameState.phase || "lobby");
    });
}

function init() {
    bindEvents();
    dom.muteBtn.textContent = gameState.soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
    dom.muteBtn.setAttribute("aria-pressed", String(!gameState.soundEnabled));
    setPlayButtonsEnabled(false);
    setActiveChoice(null);
    renderLobby();
    renderLastBall();
    renderScoreboard();
    setScreen("lobby");
}

init();
