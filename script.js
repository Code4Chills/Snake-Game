const canvas = document.getElementById('game-board');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start-button');
const touchButtons = document.querySelectorAll('[data-direction]');

const cellSize = 24;
const cellCount = canvas.width / cellSize;
const tickRate = 120;
const colors = {
  board: '#adcc60',
  grid: 'rgba(43, 51, 24, 0.12)',
  snake: '#2b3318',
  snakeHead: '#1d250f',
  food: '#ff4f5e',
  foodHighlight: '#ffd1d6',
  text: '#2b3318'
};

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem('retroSnakeBestScore')) || 0;
let gameState;
let gameLoop;

bestScoreElement.textContent = bestScore;

function createInitialState() {
  snake = [
    { x: 6, y: 9 },
    { x: 5, y: 9 },
    { x: 4, y: 9 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  food = createFood();
  gameState = 'ready';
  scoreElement.textContent = score;
}

function createFood() {
  let newFood;

  do {
    newFood = {
      x: Math.floor(Math.random() * cellCount),
      y: Math.floor(Math.random() * cellCount)
    };
  } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

  return newFood;
}

function drawBoard() {
  context.fillStyle = colors.board;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = colors.grid;
  context.lineWidth = 1;

  for (let position = 0; position <= canvas.width; position += cellSize) {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();

    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    context.fillStyle = index === 0 ? colors.snakeHead : colors.snake;
    drawRoundedCell(segment.x, segment.y, 7);
  });
}

function drawFood() {
  const centerX = food.x * cellSize + cellSize / 2;
  const centerY = food.y * cellSize + cellSize / 2;

  context.fillStyle = colors.food;
  context.beginPath();
  context.arc(centerX, centerY, cellSize * 0.36, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = colors.foodHighlight;
  context.beginPath();
  context.arc(centerX - 4, centerY - 4, cellSize * 0.11, 0, Math.PI * 2);
  context.fill();
}

function drawRoundedCell(x, y, radius) {
  const inset = 2;
  const left = x * cellSize + inset;
  const top = y * cellSize + inset;
  const size = cellSize - inset * 2;

  context.beginPath();
  context.roundRect(left, top, size, size, radius);
  context.fill();
}

function render() {
  drawBoard();
  drawFood();
  drawSnake();
}

function update() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (hasCollision(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreElement.textContent = score;
    food = createFood();
  } else {
    snake.pop();
  }

  render();
}

function hasCollision(head) {
  const hitWall = head.x < 0 || head.x >= cellCount || head.y < 0 || head.y >= cellCount;
  const hitTail = snake.some(segment => segment.x === head.x && segment.y === head.y);

  return hitWall || hitTail;
}

function startGame() {
  clearInterval(gameLoop);
  createInitialState();
  gameState = 'running';
  overlay.classList.add('hidden');
  render();
  gameLoop = setInterval(update, tickRate);
}

function endGame() {
  clearInterval(gameLoop);
  gameState = 'ended';

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('retroSnakeBestScore', bestScore);
    bestScoreElement.textContent = bestScore;
  }

  overlay.classList.remove('hidden');
  overlay.querySelector('h2').textContent = 'Game Over';
  overlay.querySelector('p').textContent = `Final score: ${score}. Press Start or an arrow key to try again.`;
  startButton.textContent = 'Play Again';
}

function togglePause() {
  if (gameState === 'running') {
    clearInterval(gameLoop);
    gameState = 'paused';
    overlay.classList.remove('hidden');
    overlay.querySelector('h2').textContent = 'Paused';
    overlay.querySelector('p').textContent = 'Press Space to resume.';
    startButton.textContent = 'Resume';
  } else if (gameState === 'paused') {
    gameState = 'running';
    overlay.classList.add('hidden');
    gameLoop = setInterval(update, tickRate);
  }
}

function setDirection(newDirection) {
  const isOpposite = newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0;

  if (!isOpposite) {
    nextDirection = newDirection;
  }

  if (gameState === 'ready' || gameState === 'ended') {
    startGame();
    nextDirection = newDirection;
  }
}

function handleKeyDown(event) {
  const keys = {
    ArrowUp: { x: 0, y: -1 },
    KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyD: { x: 1, y: 0 }
  };

  if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
    return;
  }

  if (keys[event.code]) {
    event.preventDefault();
    setDirection(keys[event.code]);
  }
}

startButton.addEventListener('click', () => {
  if (gameState === 'paused') {
    togglePause();
  } else {
    overlay.querySelector('h2').textContent = 'Retro Snake';
    overlay.querySelector('p').textContent = 'Press Start or use an arrow key to play.';
    startButton.textContent = 'Start Game';
    startGame();
  }
});

touchButtons.forEach(button => {
  button.addEventListener('click', () => {
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    setDirection(directions[button.dataset.direction]);
  });
});

window.addEventListener('keydown', handleKeyDown);

createInitialState();
render();
