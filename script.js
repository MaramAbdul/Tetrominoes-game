document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const grid = 30;
  const rows = canvas.height / grid;
  const columns = canvas.width / grid;

  let isGameRunning = false;
  let score = 0;
  let lastTime = 0;
  let dropCounter = 0;
  const dropInterval = 500;

  const tetrominoes = {
    I: [[1, 1, 1, 1]],
    J: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    L: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  };

  const colors = {
    I: "blue",
    J: "cyan",
    L: "orange",
    O: "yellow",
    S: "red",
    T: "purple",
    Z: "green",
  };

  const board = Array.from({ length: rows }, () => Array(columns).fill(0));

  let currentTetromino;

  function displayMessage(text) {
    ctx.fillStyle = "black";
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, canvas.height / 2 - 30, canvas.clientWidth, 60);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white";
    ctx.font = "20px monospace";
    ctx.textAlign = "center";
    // ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  displayMessage("Press Space to Start!");
  function newTetromino() {
    const types = Object.keys(tetrominoes);
    const type = types[Math.floor(Math.random() * types.length)];

    let newTetromino = {
      shape: tetrominoes[type],
      x: Math.floor(columns / 2) - Math.floor(tetrominoes[type][0].length / 2),
      y: 0,
      type,
    };
    if (
      collisionDetection(newTetromino.shape, newTetromino.x, newTetromino.y)
    ) {
      isGameRunning = false;
      displayMessage("GAME OVER!");
      return;
    }

    currentTetromino = newTetromino;
  }
  function gameLoop(time = 0) {
    if (!isGameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      moveDown();
      dropCounter = 0;

      if (!isGameRunning) {
        return;
      }
    }

    draw();
    requestAnimationFrame(gameLoop);
  }

  function draw() {
    drawBoard();
    drawGrid();
    drawTetromino();
  }

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (board[y][x]) {
          drawSquare(x, y, board[y][x]);
        }
      }
    }
  }

  function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * grid, y * grid, grid, grid);
    ctx.strokeStyle = "#333";
    ctx.strokeRect(x * grid, y * grid, grid, grid);
  }

  function drawTetromino() {
    currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawSquare(
            x + currentTetromino.x,
            y + currentTetromino.y,
            colors[currentTetromino.type]
          );
        }
      });
    });
  }

  function collisionDetection(tetromino, offsetX, offsetY) {
    return tetromino.some((row, y) =>
      row.some((value, x) => {
        if (value) {
          const newX = x + offsetX;
          const newY = y + offsetY;
          return (
            newX < 0 || newX >= columns || newY >= rows || board[newY][newX]
          );
        }
        return false;
      })
    );
  }

  function moveLeft() {
    if (
      !collisionDetection(
        currentTetromino.shape,
        currentTetromino.x - 1,
        currentTetromino.y
      )
    ) {
      currentTetromino.x--;
    }
  }

  function moveRight() {
    if (
      !collisionDetection(
        currentTetromino.shape,
        currentTetromino.x + 1,
        currentTetromino.y
      )
    ) {
      currentTetromino.x++;
    }
  }

  function moveDown() {
    if (
      !collisionDetection(
        currentTetromino.shape,
        currentTetromino.x,
        currentTetromino.y + 1
      )
    ) {
      currentTetromino.y++;
    } else {
      mergeTetromino();
      newTetromino();
      if (
        collisionDetection(
          currentTetromino.shape,
          currentTetromino.x,
          currentTetromino.y
        )
      ) {
        isGameRunning = false;
        displayMessage("GAME OVER!");
      }
    }
  }

  function rotateMatrix(matrix) {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
  }

  function rotateTetromino() {
    const rotatedShape = rotateMatrix(currentTetromino.shape);
    if (
      !collisionDetection(rotatedShape, currentTetromino.x, currentTetromino.y)
    ) {
      currentTetromino.shape = rotatedShape;
    }
  }

  function mergeTetromino() {
    currentTetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          board[y + currentTetromino.y][x + currentTetromino.x] =
            colors[currentTetromino.type];
        }
      });
    });
    checkLines();
  }

  function checkLines() {
    for (let y = rows - 1; y >= 0; y--) {
      if (board[y].every((cell) => cell)) {
        board.splice(y, 1);
        board.unshift(Array(columns).fill(0));
        score += 100;
        updateScore();
        y++;
      }
    }
  }

  function updateScore() {
    document.getElementById("score").textContent = score;
  }

  function drawGrid() {
    ctx.strokeStyle = "#232332";
    ctx.lineWidth = 1;
    for (let i = 1; i < rows; i++) {
      let position = grid * i;
      ctx.beginPath();
      ctx.moveTo(0, position);
      ctx.lineTo(canvas.width, position);
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, canvas.height);
      ctx.stroke();
      ctx.closePath();
    }
  }

  window.addEventListener("keydown", (e) => {
    if (!isGameRunning && (e.key === " " || e.code === "Space")) {
      isGameRunning = true;
      score = 0;
      updateScore();
      board.forEach((row) => row.fill(0));
      newTetromino();
      requestAnimationFrame(gameLoop);
    }

    if (isGameRunning) {
      if (e.key === "ArrowLeft") moveLeft();
      else if (e.key === "ArrowRight") moveRight();
      else if (e.key === "ArrowDown") moveDown();
      else if (e.key === "ArrowUp") rotateTetromino();
    }
  });
});
