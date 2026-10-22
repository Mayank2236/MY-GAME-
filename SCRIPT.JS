const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const message = document.getElementById("message");
const startButton = document.getElementById("start");
const restartButton = document.getElementById("restart");

const BLOCK = 30;
const COLS = 10;
const ROWS = 20;

const colors = [
    null,
    "#22d3ee",
    "#3b82f6",
    "#f97316",
    "#facc15",
    "#22c55e",
    "#a855f7",
    "#ef4444"
];

const shapes = [
    [],
    [[1, 1, 1, 1]],
    [[2, 0, 0], [2, 2, 2]],
    [[0, 0, 3], [3, 3, 3]],
    [[4, 4], [4, 4]],
    [[0, 5, 5], [5, 5, 0]],
    [[0, 6, 0], [6, 6, 6]],
    [[7, 7, 0], [0, 7, 7]]
];

let board;
let piece;
let score = 0;
let playing = false;
let gameOver = false;
let lastTime = 0;
let dropCounter = 0;
let animationId = null;

function createBoard() {
    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );
}

function randomPiece() {
    const shape = shapes[
        Math.floor(Math.random() * 7) + 1
    ].map(row => [...row]);

    return {
        shape: shape,
        x: Math.floor((COLS - shape[0].length) / 2),
        y: 0
    };
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        x * BLOCK,
        y * BLOCK,
        BLOCK,
        BLOCK
    );
}

function draw() {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawCell(x, y, colors[board[y][x]]);
            }
        }
    }

    if (piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    drawCell(
                        piece.x + x,
                        piece.y + y,
                        colors[value]
                    );
                }
            });
        });
    }
}

function collision(shape, offsetX, offsetY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (!shape[y][x]) continue;

            const newX = offsetX + x;
            const newY = offsetY + y;

            if (
                newX < 0 ||
                newX >= COLS ||
                newY >= ROWS
            ) {
                return true;
            }

            if (newY >= 0 && board[newY][newX]) {
                return true;
            }
        }
    }

    return false;
}

function mergePiece() {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = piece.y + y;
                const boardX = piece.x + x;

                if (boardY >= 0) {
                    board[boardY][boardX] = value;
                }
            }
        });
    });
}

function clearLines() {
    let cleared = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            y++;
        }
    }

    const points = [0, 100, 300, 500, 800];
    score += points[cleared] || cleared * 200;
    scoreDisplay.textContent = score;
}

function lockPiece() {
    mergePiece();
    clearLines();

    piece = randomPiece();

    if (collision(piece.shape, piece.x, piece.y)) {
        gameOver = true;
        playing = false;
        message.textContent = "Game Over! Press Restart.";
        startButton.textContent = "Play Again";
    }
}

function movePiece(direction) {
    if (!playing) return;

    if (
        !collision(
            piece.shape,
            piece.x + direction,
            piece.y
        )
    ) {
        piece.x += direction;
    }

    draw();
}

function dropPiece() {
    if (!playing) return;

    if (!collision(piece.shape, piece.x, piece.y + 1)) {
        piece.y++;
    } else {
        lockPiece();
    }

    draw();
}

function rotatePiece() {
    if (!playing) return;

    const rotated = piece.shape[0].map((_, index) =>
        piece.shape.map(row => row[index]).reverse()
    );

    if (!collision(rotated, piece.x, piece.y)) {
        piece.shape = rotated;
    }

    draw();
}

function update(time = 0) {
    if (!playing) return;

    const delta = time - lastTime;
    lastTime = time;
    dropCounter += delta;

    if (dropCounter > 700) {
        dropPiece();
        dropCounter = 0;
    }

    draw();

    if (playing) {
        animationId = requestAnimationFrame(update);
    }
}

function startGame() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    board = createBoard();
    piece = randomPiece();
    score = 0;
    playing = true;
    gameOver = false;
    lastTime = 0;
    dropCounter = 0;
    animationId = null;

    scoreDisplay.textContent = score;
    message.textContent = "Game is running!";
    startButton.textContent = "Playing...";

    draw();
    animationId = requestAnimationFrame(update);
}

document.addEventListener("keydown", event => {
    if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]
            .includes(event.key)
    ) {
        event.preventDefault();
    }

    if (!playing) return;

    if (event.key === "ArrowLeft") {
        movePiece(-1);
    } else if (event.key === "ArrowRight") {
        movePiece(1);
    } else if (event.key === "ArrowUp") {
        rotatePiece();
    } else if (event.key === "ArrowDown") {
        dropPiece();
    } else if (event.code === "Space") {
        while (
            playing &&
            !collision(piece.shape, piece.x, piece.y + 1)
        ) {
            piece.y++;
        }

        if (playing) {
            lockPiece();
            draw();
        }
    }
});

startButton.addEventListener("click", () => {
    if (!playing) {
        startGame();
    }
});

restartButton.addEventListener("click", startGame);

board = createBoard();
draw();