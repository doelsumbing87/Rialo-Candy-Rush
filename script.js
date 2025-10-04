// Game Configuration
const BOARD_SIZE = 8;
const CANDY_TYPES = ['🍬', '🍭', '🍫', '🍩', '🍪', '🧁'];

// Game State
let board = [];
let score = 0;
let moves = 30;
let target = 1000;
let selectedCandy = null;
let isProcessing = false;
let combo = 0;
let soundEnabled = true;

// Audio Elements
let bgMusic, matchSound, comboSound, swapSound, winSound, gameOverSound;

// Initialize Audio
function initAudio() {
    bgMusic = document.getElementById('bgMusic');
    matchSound = document.getElementById('matchSound');
    comboSound = document.getElementById('comboSound');
    swapSound = document.getElementById('swapSound');
    winSound = document.getElementById('winSound');
    gameOverSound = document.getElementById('gameOverSound');
    
    // Set volume levels
    bgMusic.volume = 0.3;
    matchSound.volume = 0.5;
    comboSound.volume = 0.6;
    swapSound.volume = 0.4;
    winSound.volume = 0.7;
    gameOverSound.volume = 0.6;
}

// Play Sound Function
function playSound(sound) {
    if (soundEnabled && sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Toggle Sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');
    
    if (soundEnabled) {
        btn.textContent = '🔊 SUARA ON';
        bgMusic.play().catch(e => console.log('BGM play failed:', e));
    } else {
        btn.textContent = '🔇 SUARA OFF';
        bgMusic.pause();
    }
}

// Initialize Board
function initBoard() {
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
        }
    }
    removeInitialMatches();
}

// Remove Initial Matches
function removeInitialMatches() {
    let hasMatch = true;
    while (hasMatch) {
        hasMatch = false;
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (checkMatchAt(i, j)) {
                    board[i][j] = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
                    hasMatch = true;
                }
            }
        }
    }
}

// Check Match at Position
function checkMatchAt(row, col) {
    const candy = board[row][col];
    
    // Check horizontal
    if (col >= 2 && board[row][col-1] === candy && board[row][col-2] === candy) return true;
    if (col >= 1 && col < BOARD_SIZE-1 && board[row][col-1] === candy && board[row][col+1] === candy) return true;
    if (col <= BOARD_SIZE-3 && board[row][col+1] === candy && board[row][col+2] === candy) return true;
    
    // Check vertical
    if (row >= 2 && board[row-1][col] === candy && board[row-2][col] === candy) return true;
    if (row >= 1 && row < BOARD_SIZE-1 && board[row-1][col] === candy && board[row+1][col] === candy) return true;
    if (row <= BOARD_SIZE-3 && board[row+1][col] === candy && board[row+2][col] === candy) return true;
    
    return false;
}

// Render Board
function renderBoard() {
    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            const candy = document.createElement('div');
            candy.className = 'candy';
            candy.textContent = board[i][j];
            candy.dataset.row = i;
            candy.dataset.col = j;
            candy.onclick = () => selectCandy(i, j);
            gameBoard.appendChild(candy);
        }
    }
}

// Select Candy
function selectCandy(row, col) {
    if (isProcessing || moves <= 0) return;

    const candy = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (!selectedCandy) {
        selectedCandy = { row, col };
        candy.classList.add('selected');
        playSound(swapSound);
    } else {
        const prevSelected = document.querySelector('.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        
        if (isAdjacent(selectedCandy.row, selectedCandy.col, row, col)) {
            swapCandies(selectedCandy.row, selectedCandy.col, row, col);
            selectedCandy = null;
        } else {
            selectedCandy = { row, col };
            candy.classList.add('selected');
            playSound(swapSound);
        }
    }
}

// Check if Adjacent
function isAdjacent(row1, col1, row2, col2) {
    return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
           (Math.abs(col1 - col2) === 1 && row1 === row2);
}

// Swap Candies
async function swapCandies(row1, col1, row2, col2) {
    isProcessing = true;
    
    [board[row1][col1], board[row2][col2]] = [board[row2][col2], board[row1][col1]];
    renderBoard();
    playSound(swapSound);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const matches = findMatches();
    
    if (matches.length === 0) {
        // Invalid move - swap back
        [board[row1][col1], board[row2][col2]] = [board[row2][col2], board[row1][col1]];
        renderBoard();
        isProcessing = false;
        return;
    }
    
    moves--;
    updateStats();
    
    combo = 0;
    await processMatches();
    
    isProcessing = false;
    checkGameOver();
}

// Find Matches
function findMatches() {
    const matches = new Set();
    
    // Horizontal matches
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE - 2; j++) {
            if (board[i][j] === board[i][j+1] && board[i][j] === board[i][j+2]) {
                matches.add(`${i},${j}`);
                matches.add(`${i},${j+1}`);
                matches.add(`${i},${j+2}`);
            }
        }
    }
    
    // Vertical matches
    for (let i = 0; i < BOARD_SIZE - 2; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === board[i+1][j] && board[i][j] === board[i+2][j]) {
                matches.add(`${i},${j}`);
                matches.add(`${i+1},${j}`);
                matches.add(`${i+2},${j}`);
            }
        }
    }
    
    return Array.from(matches).map(pos => {
        const [row, col] = pos.split(',').map(Number);
        return { row, col };
    });
}

// Process Matches
async function processMatches() {
    let matches = findMatches();
    
    while (matches.length > 0) {
        combo++;
        const comboBonus = combo > 1 ? combo * 10 : 0;
        const scoreGain = matches.length * 10 + comboBonus;
        score += scoreGain;
        
        // Play sound effects
        if (combo > 1) {
            playSound(comboSound);
            showComboPopup(combo);
        } else {
            playSound(matchSound);
        }
        
        // Show score popup
        showScorePopup(scoreGain, matches[0]);
        
        // Animate matching candies
        matches.forEach(({row, col}) => {
            const candy = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (candy) candy.classList.add('matching');
        });
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Remove matched candies
        matches.forEach(({row, col}) => {
            board[row][col] = null;
        });
        
        applyGravity();
        fillEmpty();
        renderBoard();
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        matches = findMatches();
        updateStats();
    }
}

// Apply Gravity
function applyGravity() {
    for (let j = 0; j < BOARD_SIZE; j++) {
        let emptyRow = BOARD_SIZE - 1;
        for (let i = BOARD_SIZE - 1; i >= 0; i--) {
            if (board[i][j] !== null) {
                if (i !== emptyRow) {
                    board[emptyRow][j] = board[i][j];
                    board[i][j] = null;
                }
                emptyRow--;
            }
        }
    }
}

// Fill Empty Spaces
function fillEmpty() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === null) {
                board[i][j] = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
            }
        }
    }
}

// Update Stats
function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('moves').textContent = moves;
    const progress = Math.min((score / target) * 100, 100);
    const progressBar = document.getElementById('progress');
    progressBar.style.width = progress + '%';
    progressBar.textContent = Math.round(progress) + '%';
}

// Show Combo Popup
function showComboPopup(comboCount) {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.textContent = `COMBO x${comboCount}! 🔥`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

// Show Score Popup
function showScorePopup(points, position) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${(position.col + 1) * 50}px`;
    popup.style.top = `${(position.row + 1) * 50}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

// Check Game Over
function checkGameOver() {
    if (score >= target) {
        playSound(winSound);
        bgMusic.pause();
        setTimeout(() => {
            showModal('🎉 MENANG!', `Selamat! Anda mencapai target dengan ${moves} moves tersisa!`);
        }, 500);
    } else if (moves <= 0) {
        playSound(gameOverSound);
        bgMusic.pause();
        setTimeout(() => {
            showModal('😢 GAME OVER', `Sayang sekali! Anda hampir mencapai target!`);
        }, 500);
    }
}

// Show Modal
function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverModal').style.display = 'flex';
}

// Close Modal
function closeModal() {
    document.getElementById('gameOverModal').style.display = 'none';
    startGame();
}

// Start Game
function startGame() {
    score = 0;
    moves = 30;
    target = 1000;
    combo = 0;
    selectedCandy = null;
    isProcessing = false;
    
    initBoard();
    renderBoard();
    updateStats();
    
    // Start background music
    if (soundEnabled) {
        bgMusic.currentTime = 0;
        bgMusic.play().catch(e => console.log('BGM play failed:', e));
    }
}

// Reset Game
function resetGame() {
    startGame();
}

// Initialize Game on Load
window.addEventListener('DOMContentLoaded', () => {
    initAudio();
    startGame();
});
