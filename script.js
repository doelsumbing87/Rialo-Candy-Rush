// === DOM ELEMENT SELECTION ===
// Getting all the necessary elements from the HTML to manipulate them with JavaScript
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const startButton = document.getElementById('start-button');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const boardElement = document.getElementById('board');

// Buttons
const restartButton = document.getElementById('restart-button');
const instructionsButton = document.getElementById('instructions-button');
const playAgainButton = document.getElementById('play-again-button');

// Modals
const instructionsModal = document.getElementById('instructions-modal');
const gameOverModal = document.getElementById('game-over-modal');
const closeInstructionsButton = document.getElementById('close-instructions');
const closeGameOverButton = document.getElementById('close-game-over');
const finalScoreElement = document.getElementById('final-score');

// === GAME VARIABLES ===
// Variables to control the game's state and logic
const candies = ["Blue", "Orange", "Green", "Yellow", "Red", "Purple"];
const BLANK_CANDY = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="; // Embedded transparent image
let board = [];
const rows = 9;
const columns = 9;
let score = 0;
let timeLeft = 60;

let currTile;
let otherTile;

let timerInterval;
let gameLoopInterval;

// === EVENT LISTENERS ===
// This section makes the buttons and other elements interactive

// When the "Start Playing" button is clicked
startButton.addEventListener('click', () => {
    startScreen.classList.remove('active');
    gameContainer.classList.add('active');
    startGame();
});

// Restart button during the game
restartButton.addEventListener('click', startGame);

// Play Again button on the Game Over screen
playAgainButton.addEventListener('click', () => {
    closeModal(gameOverModal);
    startGame();
});

// Instructions button
instructionsButton.addEventListener('click', () => {
    openModal(instructionsModal);
});

// Close buttons for modals
closeInstructionsButton.addEventListener('click', () => closeModal(instructionsModal));
closeGameOverButton.addEventListener('click', () => closeModal(gameOverModal));

// === GAME FUNCTIONS ===

/**
 * Initializes or resets the game state.
 */
function startGame() {
    // Reset game board and variables
    boardElement.innerHTML = ''; // Clear previous board
    board = [];
    score = 0;
    timeLeft = 60;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft;

    // Stop any previous game loops or timers
    clearInterval(timerInterval);
    clearInterval(gameLoopInterval);

    // Create the visual board
    createBoard();

    // Start the timer countdown
    timerInterval = setInterval(updateTimer, 1000);

    // Start the main game loop (checking for crushes, sliding candies)
    gameLoopInterval = setInterval(() => {
        crushCandy();
        slideCandy();
        generateCandy();
    }, 100);
}

/**
 * Updates the game timer every second and handles game over.
 */
function updateTimer() {
    timeLeft--;
    timerElement.innerText = timeLeft;
    if (timeLeft <= 0) {
        endGame();
    }
}

/**
 * Ends the game, stops timers, and shows the game over modal.
 */
function endGame() {
    clearInterval(timerInterval);
    clearInterval(gameLoopInterval);
    finalScoreElement.innerText = score;
    openModal(gameOverModal);
}

/**
 * Generates a random candy type.
 * @returns {string} A candy color name.
 */
function randomCandy() {
    return candies[Math.floor(Math.random() * candies.length)];
}

/**
 * Creates the grid of candies on the board.
 */
function createBoard() {
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            let tile = document.createElement("img");
            tile.id = `${r.toString()}-${c.toString()}`;
            tile.src = `./images/${randomCandy()}.png`;

            // Add drag-and-drop event listeners to each candy tile
            tile.addEventListener("dragstart", dragStart);
            tile.addEventListener("dragover", dragOver);
            tile.addEventListener("dragenter", dragEnter);
            tile.addEventListener("dragleave", dragLeave);
            tile.addEventListener("drop", dragDrop);
            tile.addEventListener("dragend", dragEnd);

            boardElement.append(tile);
            row.push(tile);
        }
        board.push(row);
    }
}

// === DRAG & DROP FUNCTIONS ===

function dragStart() { currTile = this; }
function dragOver(e) { e.preventDefault(); }
function dragEnter(e) { e.preventDefault(); }
function dragLeave() {}
function dragDrop() { otherTile = this; }

function dragEnd() {
    if (currTile.src === BLANK_CANDY || otherTile.src === BLANK_CANDY) {
        return;
    }

    let currCoords = currTile.id.split("-");
    let r1 = parseInt(currCoords[0]);
    let c1 = parseInt(currCoords[1]);

    let otherCoords = otherTile.id.split("-");
    let r2 = parseInt(otherCoords[0]);
    let c2 = parseInt(otherCoords[1]);

    // Check if the move is to an adjacent tile
    let isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

    if (isAdjacent) {
        // Swap the images
        let currImg = currTile.src;
        let otherImg = otherTile.src;
        currTile.src = otherImg;
        otherTile.src = currImg;

        // If the swap is not a valid move, swap them back
        if (!checkValid()) {
            currTile.src = currImg;
            otherTile.src = otherImg;
        }
    }
}

// === CANDY CRUSHING LOGIC ===

function crushCandy() {
    // Check for 3-in-a-row/column and crush them
    // This function can be expanded to check for 4 or 5 matches for special candies
    crushThree();
    document.getElementById("score").innerText = score;
}

function crushThree() {
    // Check rows for matches
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c + 1];
            let candy3 = board[r][c + 2];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy1.src !== BLANK_CANDY) {
                candy1.src = BLANK_CANDY;
                candy2.src = BLANK_CANDY;
                candy3.src = BLANK_CANDY;
                score += 30;
            }
        }
    }

    // Check columns for matches
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r + 1][c];
            let candy3 = board[r + 2][c];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy1.src !== BLANK_CANDY) {
                candy1.src = BLANK_CANDY;
                candy2.src = BLANK_CANDY;
                candy3.src = BLANK_CANDY;
                score += 30;
            }
        }
    }
}

function checkValid() {
    // Check if there are any possible moves after a swap
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns - 2; c++) {
            let candy1 = board[r][c];
            let candy2 = board[r][c + 1];
            let candy3 = board[r][c + 2];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy1.src !== BLANK_CANDY) return true;
        }
    }
    for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows - 2; r++) {
            let candy1 = board[r][c];
            let candy2 = board[r + 1][c];
            let candy3 = board[r + 2][c];
            if (candy1.src === candy2.src && candy2.src === candy3.src && candy1.src !== BLANK_CANDY) return true;
        }
    }
    return false;
}

function slideCandy() {
    // Slides candies down to fill blank spaces
    for (let c = 0; c < columns; c++) {
        let ind = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
            if (board[r][c].src !== BLANK_CANDY) {
                board[ind][c].src = board[r][c].src;
                ind -= 1;
            }
        }
        for (let r = ind; r >= 0; r--) {
            board[r][c].src = BLANK_CANDY;
        }
    }
}

function generateCandy() {
    // Generates new candies at the top where there are blank spaces
    for (let c = 0; c < columns; c++) {
        if (board[0][c].src === BLANK_CANDY) {
            board[0][c].src = `./images/${randomCandy()}.png`;
        }
    }
}

// === MODAL (POP-UP) FUNCTIONS ===

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

