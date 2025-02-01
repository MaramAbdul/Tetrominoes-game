document.addEventListener("DOMContentLoaded", () => {
  // Game Constants
  const FPS = 60;
  const FRAME_TIME = 1000 / FPS;
  const GRID_SIZE = 30;
  const ROWS = 20;
  const COLS = 10;
  const DROP_INTERVAL = 1000;

  // Game State
  let lastFrameTime = 0;
  let dropCounter = 0;
  let score = 0;
  let lives = 1;
  let gameTimer = 0;
  let isGameRunning = false;
  let isPaused = false;
  let board = Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(null));
  let currentPiece = null;
  let gameBoard = document.querySelector(".game-board");
  let cells = [];

  // Tetrominoes
  const TETROMINOES = {
    I: {
      shape: [[1, 1, 1, 1]],
      color: "cyan",
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      color: "blue",
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
      ],
      color: "orange",
    },
    O: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "yellow",
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      color: "green",
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: "purple",
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      color: "red",
    },
  };

  // Initialize game board
  function createBoard() {
    gameBoard.innerHTML = "";
    cells = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(null));

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.style.top = `${row * GRID_SIZE}px`;
        cell.style.left = `${col * GRID_SIZE}px`;
        gameBoard.appendChild(cell);
        cells[row][col] = cell;
      }
    }
  }

  // Game controls
  function setupControls() {
    document.addEventListener("keydown", handleKeyPress);
    document.getElementById("continue").addEventListener("click", togglePause);
    document.getElementById("restart").addEventListener("click", restartGame);
  }

  function handleKeyPress(event) {
    if (!isGameRunning || isPaused) return;

    switch (event.key) {
      case "ArrowLeft":
        movePiece(-1, 0);
        break;
      case "ArrowRight":
        movePiece(1, 0);
        break;
      case "ArrowDown":
        movePiece(0, 1);
        break;
      case "ArrowUp":
        rotatePiece();
        break;
      case "Escape":
        togglePause();
        break;
    }
  }

  // Game mechanics
  function createNewPiece() {
    const pieces = Object.keys(TETROMINOES);
    const pieceType = pieces[Math.floor(Math.random() * pieces.length)];
    const piece = TETROMINOES[pieceType];

    currentPiece = {
      type: pieceType,
      shape: piece.shape,
      color: piece.color,
      x: Math.floor((COLS - piece.shape[0].length) / 2),
      y: 0,
    };

    if (checkCollision(currentPiece)) {
      handleGameOver();
      showStartScreen();
    }
  }

  function checkCollision(piece, offsetX = 0, offsetY = 0) {
    return piece.shape.some((row, y) => {
      return row.some((value, x) => {
        if (!value) return false;

        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;

        return (
          newX < 0 ||
          newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && board[newY][newX])
        );
      });
    });
  }

  function movePiece(deltaX, deltaY) {
    if (!currentPiece) return;

    if (!checkCollision(currentPiece, deltaX, deltaY)) {
      currentPiece.x += deltaX;
      currentPiece.y += deltaY;
      render();
      return true;
    }

    if (deltaY > 0) {
      lockPiece();
      clearLines();
      createNewPiece();
    }
    return false;
  }

  function rotatePiece() {
    if (!currentPiece) return;

    const originalShape = currentPiece.shape;
    currentPiece.shape = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map((row) => row[i]).reverse()
    );

    if (checkCollision(currentPiece)) {
      currentPiece.shape = originalShape;
    } else {
      render();
    }
  }

  function lockPiece() {
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            board[boardY][boardX] = currentPiece.type;
          }
        }
      });
    });
  }

  function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row].every((cell) => cell)) {
        board.splice(row, 1);
        board.unshift(Array(COLS).fill(null));
        linesCleared++;
        row++;
      }
    }

    if (linesCleared > 0) {
      score += linesCleared * 100;
      updateScore();
    }
  }

  // UI updates
  function updateScore() {
    document.getElementById("score").textContent = score;
  }

  function updateLives() {
    document.getElementById("lives").textContent = lives;
  }

  function updateTimer() {
    document.getElementById("time").textContent = gameTimer;
  }

  function render() {
    // Clear board
    cells.forEach((row) => {
      row.forEach((cell) => {
        cell.className = "cell";
      });
    });

    // Render placed pieces
    board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          cells[y][x].classList.add(value);
        }
      });
    });

    // Render current piece
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              cells[boardY][boardX].classList.add(currentPiece.type);
            }
          }
        });
      });
    }
  }

  // Game flow
  function togglePause() {
    isPaused = !isPaused;
    document.querySelector(".pause-menu").classList.toggle("hidden");

    if (!isPaused) {
      lastFrameTime = performance.now();
      requestAnimationFrame(gameLoop);
    }
  }

  function startGame() {
    isGameRunning = true;
    createNewPiece();
    startTimer();
    requestAnimationFrame(gameLoop);
  }

  function handleGameOver() {
    lives--;
    updateLives();

    if (lives <= 0) {
      isGameRunning = false;
      alert(`Game Over! Final Score: ${score}`);
      showStartScreen();
      restartGame();
    } else {
      board = Array(ROWS)
        .fill()
        .map(() => Array(COLS).fill(null));
      createNewPiece();
    }
  }

  function restartGame() {
    board = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(null));
    score = 0;
    lives = 1;
    gameTimer = 0;
    dropCounter = 0;
    isPaused = false;

    updateScore();
    updateLives();
    updateTimer();

    document.querySelector(".pause-menu").classList.add("hidden");

    createNewPiece();
    // startGame();
    showStartScreen();

    // startGame();
  }

  function startTimer() {
    setInterval(() => {
      if (isGameRunning && !isPaused) {
        gameTimer++;
        updateTimer();
      }
    }, 1000);
  }

  // Game loop
  function gameLoop(timestamp) {
    if (!isGameRunning || isPaused) return;

    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    dropCounter += deltaTime;
    if (dropCounter >= DROP_INTERVAL) {
      movePiece(0, 1);
      dropCounter = 0;
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  // Show start screen and wait for spacebar to start the game
  function showStartScreen() {
    const startScreen = document.createElement("div");
    startScreen.id = "start-screen";
    startScreen.innerHTML = `
      <h1>Press Space to Start</h1>
              <p>← → : Move</p>
        <p>↑ : Rotate</p>
        <p>↓ : Fast Drop</p>
        <p>ESC : Pause</p>
    `;
    document.body.appendChild(startScreen);

    document.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        document.body.removeChild(startScreen);
        initializeGame();
      }
    });
  }

  // Initialize game
  function initializeGame() {
    createBoard();
    setupControls();
    startGame();
  }

  // Show start screen when the page loads
  showStartScreen();
});
