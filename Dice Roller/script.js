const KEY = "dice-royale-state-v1";
const state = {
    mode: "computer", currentTurn: 1, phase: "player1", player1Roll: null, player2Roll: null,
    player1Name: "", player2Name: "", player1Character: "male", player2Character: "female",
    playerWins: 0, opponentWins: 0, rounds: 0, history: []
};
let rolling = false;
let aiTimer = null;

const $ = (id) => document.getElementById(id);
const p1Input = $("player1Name");
const p2Input = $("player2Name");
const p1Card = $("playerCard");
const p2Card = $("computerCard");
const p1Dice = $("playerDice");
const p2Dice = $("computerDice");
const rollButton = $("rollButton");

function randomValue() { return Math.floor(Math.random() * 6) + 1; }
function nameOf(input, fallback) { return input.value.trim().slice(0, 18) || fallback; }
function names() { return [nameOf(p1Input, "Player 1"), state.mode === "computer" ? "Computer" : nameOf(p2Input, "Player 2")]; }

function setDie(element, value) {
    element.replaceChildren();
    const dot = document.createElement("span");
    dot.className = `dot d${value}`;
    element.append(dot);
    element.setAttribute("aria-label", `Die showing ${value}`);
}

function updateAvatar(element, type) {
    element.className = `avatar avatar-${type} large`;
    if (type === "robot") {
        const left = document.createElement("i"), right = document.createElement("i"), mouth = document.createElement("i");
        left.className = "robot-eye left"; right.className = "robot-eye right"; mouth.className = "robot-mouth";
        element.replaceChildren(left, right, mouth);
    } else {
        const head = document.createElement("i"), body = document.createElement("i");
        head.className = "avatar-head"; body.className = "avatar-body"; element.replaceChildren(head, body);
    }
}

function updateUI() {
    const [p1, p2] = names();
    $("player1Display").textContent = p1;
    $("player2Display").textContent = p2;
    $("score1Label").textContent = `${p1.toUpperCase()} WINS`;
    $("score2Label").textContent = `${p2.toUpperCase()} WINS`;
    updateAvatar($("playerAvatar"), state.player1Character);
    updateAvatar($("opponentAvatar"), state.mode === "computer" ? "robot" : state.player2Character);
    $("opponentType").textContent = state.mode === "computer" ? "ARENA AI" : "PLAYER TWO";
}

function updateMode(mode) {
    if (rolling) return;
    state.mode = mode;
    state.currentTurn = 1;
    state.phase = "player1";
    state.player1Roll = null;
    state.player2Roll = null;
    document.querySelectorAll(".mode-option").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
    const local = mode === "local";
    $("player2Config").classList.toggle("is-hidden", !local);
    $("aiNote").classList.toggle("is-hidden", local);
    p2Input.disabled = !local;
    updateUI();
    updateTurnUI();
}

function selectCharacter(player, character, button) {
    state[`player${player}Character`] = character;
    button.closest(".character-options").querySelectorAll(".character-option").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
    });
    updateUI();
    save();
}

function scoreUI() {
    $("playerWins").textContent = state.playerWins;
    $("computerWins").textContent = state.opponentWins;
    $("rounds").textContent = state.rounds;
}

function updateTurnUI() {
    const [p1, p2] = names();
    const isPlayer1 = state.phase === "player1";
    const isPlayer2 = state.phase === "player2";
    const isComputer = state.phase === "computer";
    const waiting = state.phase === "result";
    const title = isPlayer1 ? (state.mode === "computer" ? "YOUR TURN" : `${p1.toUpperCase()} TURN`) : isPlayer2 ? `${p2.toUpperCase()} TURN` : isComputer ? "COMPUTER IS ROLLING..." : "ROUND COMPLETE";
    const subtitle = isPlayer1 ? "Roll the dice to attack" : isPlayer2 ? "Player 1 is locked. Your roll is ready." : isComputer ? "The arena AI is calculating its response" : "Next round starts with Player 1";
    $("turnTitle").textContent = title;
    $("turnSubtitle").textContent = subtitle;
    $("turnIndicator").className = `turn-indicator ${state.phase}`;
    p1Card.classList.toggle("turn-active", isPlayer1);
    p2Card.classList.toggle("turn-active", isPlayer2 || isComputer);
    p1Card.classList.toggle("turn-locked", !isPlayer1 && !isComputer);
    p2Card.classList.toggle("turn-locked", !isPlayer2 && !isComputer);
    rollButton.disabled = rolling || waiting || isComputer || (isPlayer2 && state.mode === "computer");
    $("rollLabel").textContent = isComputer ? "COMPUTER IS ROLLING..." : isPlayer2 ? "ROLL FOR PLAYER 2" : "ROLL DICE";
}

function animateDie(element, finalValue) {
    element.classList.remove("rolling");
    void element.offsetWidth;
    element.classList.add("rolling");
    const timer = setInterval(() => setDie(element, randomValue()), 85);
    setTimeout(() => { clearInterval(timer); setDie(element, finalValue); }, 710);
}

function renderHistory() {
    const list = $("historyList");
    list.replaceChildren();
    if (!state.history.length) {
        const empty = document.createElement("div"); empty.className = "empty-history";
        const mark = document.createElement("span"), message = document.createElement("p"), hint = document.createElement("small");
        mark.textContent = "+"; message.textContent = "Your first round is waiting."; hint.textContent = "Roll the dice to log the match.";
        empty.append(mark, message, hint); list.append(empty);
    } else state.history.forEach((match) => {
        const item = document.createElement("div"), round = document.createElement("span"), summary = document.createElement("span"), result = document.createElement("strong");
        item.className = "history-item"; round.className = "history-round"; summary.className = "history-match"; result.className = `history-result ${match.outcome}`;
        round.textContent = `#${match.round}`; summary.textContent = `${match.p1} ${match.p1Score}  —  ${match.p2Score} ${match.p2}`;
        result.textContent = match.outcome === "win" ? "WIN" : match.outcome === "loss" ? "LOSS" : "DRAW";
        item.append(round, summary, result); list.append(item);
    });
    $("historyCount").textContent = `${state.history.length} ${state.history.length === 1 ? "round" : "rounds"}`;
}

function showResult(a, b) {
    const [p1, p2] = names();
    p1Card.classList.remove("winner", "loser"); p2Card.classList.remove("winner", "loser");
    let outcome = "draw";
    if (a > b) { state.playerWins++; outcome = "win"; p1Card.classList.add("winner"); p2Card.classList.add("loser"); $("resultTitle").textContent = `${p1} wins`; $("resultSubtitle").textContent = `${a} beats ${b}. The table belongs to ${p1}.`; }
    else if (b > a) { state.opponentWins++; outcome = "loss"; p2Card.classList.add("winner"); p1Card.classList.add("loser"); $("resultTitle").textContent = `${p2} wins`; $("resultSubtitle").textContent = `${b} beats ${a}. A new challenger rises.`; }
    else { $("resultTitle").textContent = "It's a draw"; $("resultSubtitle").textContent = `Both contenders landed on ${a}. Run it back.`; p1Card.classList.add("draw"); p2Card.classList.add("draw"); }
    state.history.unshift({ round: state.rounds, p1, p2, p1Score: a, p2Score: b, outcome });
    state.history = state.history.slice(0, 30); state.phase = "player1"; state.currentTurn = 1;
    scoreUI(); renderHistory(); updateTurnUI(); save();
}

function finishComputerRoll() {
    const value = randomValue();
    animateDie(p2Dice, value);
    setTimeout(() => { state.player2Roll = value; $("computerValue").textContent = value; state.rounds++; showResult(state.player1Roll, state.player2Roll); rolling = false; updateTurnUI(); }, 760);
}

function rollDice() {
    if (rolling || state.phase === "result" || state.phase === "computer" || (state.mode === "local" && state.phase !== `player${state.currentTurn}`)) return;
    rolling = true;
    p1Card.classList.remove("winner", "loser", "draw"); p2Card.classList.remove("winner", "loser", "draw");
    $("resultTitle").textContent = state.mode === "local" && state.currentTurn === 2 ? "Player 2 is rolling" : "Dice in motion";
    $("resultSubtitle").textContent = "The arena is calculating the outcome.";
    const value = randomValue();
    if (state.currentTurn === 1) { state.player1Roll = value; animateDie(p1Dice, value); }
    else { state.player2Roll = value; animateDie(p2Dice, value); }
    setTimeout(() => {
        if (state.currentTurn === 1) {
            $("playerValue").textContent = value;
            if (state.mode === "computer") { state.phase = "computer"; save(); updateTurnUI(); aiTimer = setTimeout(finishComputerRoll, 650); }
            else { state.currentTurn = 2; state.phase = "player2"; rolling = false; save(); updateTurnUI(); }
        } else { $("computerValue").textContent = value; state.rounds++; showResult(state.player1Roll, state.player2Roll); rolling = false; updateTurnUI(); }
    }, 760);
}

function save() { state.player1Name = p1Input.value.slice(0, 18); state.player2Name = p2Input.value.slice(0, 18); localStorage.setItem(KEY, JSON.stringify(state)); }

function load() {
    try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved && typeof saved === "object") Object.assign(state, saved); } catch { localStorage.removeItem(KEY); }
    p1Input.value = state.player1Name || ""; p2Input.value = state.player2Name || "";
    if (state.phase === "result" || !state.phase) { state.phase = "player1"; state.currentTurn = 1; }
    updateMode(state.mode); scoreUI(); renderHistory();
    if (state.player1Roll) { setDie(p1Dice, state.player1Roll); $("playerValue").textContent = state.player1Roll; }
    if (state.player2Roll) { setDie(p2Dice, state.player2Roll); $("computerValue").textContent = state.player2Roll; }
    updateTurnUI();
}

function resetGame() {
    clearTimeout(aiTimer); rolling = false; localStorage.removeItem(KEY);
    Object.assign(state, { mode: "computer", currentTurn: 1, phase: "player1", player1Roll: null, player2Roll: null, player1Name: "", player2Name: "", player1Character: "male", player2Character: "female", playerWins: 0, opponentWins: 0, rounds: 0, history: [] });
    p1Input.value = ""; p2Input.value = "";
    document.querySelectorAll(".character-options").forEach((group) => group.querySelectorAll(".character-option").forEach((button, index) => { button.classList.toggle("selected", index === 0); button.setAttribute("aria-pressed", String(index === 0)); }));
    setDie(p1Dice, 1); setDie(p2Dice, 1); $("playerValue").textContent = "1"; $("computerValue").textContent = "1";
    p1Card.classList.remove("winner", "loser", "draw"); p2Card.classList.remove("winner", "loser", "draw"); $("resultTitle").textContent = "Ready to roll?"; $("resultSubtitle").textContent = "Set your contenders, then press the button to begin.";
    updateMode("computer"); scoreUI(); renderHistory();
}

document.querySelectorAll(".mode-option").forEach((button) => button.addEventListener("click", () => { updateMode(button.dataset.mode); save(); }));
document.querySelectorAll(".character-options").forEach((group) => group.addEventListener("click", (event) => { const button = event.target.closest(".character-option"); if (button) selectCharacter(group.dataset.player, button.dataset.character, button); }));
p1Input.addEventListener("input", () => { updateUI(); updateTurnUI(); save(); }); p2Input.addEventListener("input", () => { updateUI(); updateTurnUI(); save(); });
rollButton.addEventListener("click", rollDice); $("resetButton").addEventListener("click", resetGame);
document.addEventListener("keydown", (event) => { if (["INPUT", "SELECT"].includes(document.activeElement.tagName) || event.isComposing) return; if (event.code === "Space") { event.preventDefault(); rollDice(); } if (event.key.toLowerCase() === "r") resetGame(); });
load();