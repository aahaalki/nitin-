// Basic Snake game with white background

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const btnRestart = document.getElementById('btnRestart');
const btnPause = document.getElementById('btnPause');
const speedRange = document.getElementById('speedRange');

// Grid config
const gridSize = 24; // number of cells across
const cell = Math.floor(canvas.width / gridSize);
const boardSize = cell * gridSize; // ensure integer size
canvas.width = boardSize;
canvas.height = boardSize;

// Colors (on white background)
const colorSnake = '#16a34a';
const colorSnakeHead = '#15803d';
const colorFood = '#ef4444';
const colorGrid = '#f3f4f6';

// Game state
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let score = 0;
let highScore = Number(localStorage.getItem('snake_high_score') || 0);
let playing = true;
let tickMs = speedToMs(Number(speedRange.value));
let lastTick = 0;

// Touch swipe state
let touchStartX = null;
let touchStartY = null;
const swipeThreshold = 24; // px minimal movement to count as a swipe

function speedToMs(speedSliderValue) {
	// Higher slider = faster = shorter interval
	const min = 60; // fastest
	const max = 220; // slowest
	const t = (speedSliderValue - Number(speedRange.min)) / (Number(speedRange.max) - Number(speedRange.min));
	return Math.round(max - t * (max - min));
}

function initGame() {
	snake = [
		{ x: 6, y: 12 },
		{ x: 5, y: 12 },
		{ x: 4, y: 12 }
	];
	direction = { x: 1, y: 0 };
	nextDirection = { x: 1, y: 0 };
	score = 0;
	updateScore();
	spawnFood();
	playing = true;
}

function spawnFood() {
	while (true) {
		const x = Math.floor(Math.random() * gridSize);
		const y = Math.floor(Math.random() * gridSize);
		const onSnake = snake.some(seg => seg.x === x && seg.y === y);
		if (!onSnake) {
			food = { x, y };
			return;
		}
	}
}

function updateScore() {
	scoreEl.textContent = String(score);
	highScoreEl.textContent = String(highScore);
}

function setDirection(nx, ny) {
	// Prevent reversing directly
	if (nx === -direction.x && ny === -direction.y) return;
	nextDirection = { x: nx, y: ny };
}

// Input: keyboard
window.addEventListener('keydown', (e) => {
	const k = e.key.toLowerCase();
	if (k === 'arrowup' || k === 'w') setDirection(0, -1);
	else if (k === 'arrowdown' || k === 's') setDirection(0, 1);
	else if (k === 'arrowleft' || k === 'a') setDirection(-1, 0);
	else if (k === 'arrowright' || k === 'd') setDirection(1, 0);
	else if (k === ' ' || k === 'spacebar') togglePause();
	else if (k === 'r') restart();
});

// Input: buttons
document.querySelectorAll('.dpad').forEach(btn => {
	btn.addEventListener('click', () => {
		const dir = btn.getAttribute('data-dir');
		if (dir === 'up') setDirection(0, -1);
		if (dir === 'down') setDirection(0, 1);
		if (dir === 'left') setDirection(-1, 0);
		if (dir === 'right') setDirection(1, 0);
	});
});

btnRestart.addEventListener('click', restart);
btnPause.addEventListener('click', togglePause);
speedRange.addEventListener('input', () => {
	tickMs = speedToMs(Number(speedRange.value));
});

// Touch gesture handlers
canvas.addEventListener('touchstart', (e) => {
	if (e.touches.length > 0) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
	// Prevent scrolling while swiping on canvas
	e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
	if (touchStartX === null || touchStartY === null) return;
	const touch = e.changedTouches && e.changedTouches[0];
	if (!touch) return;
	const dx = touch.clientX - touchStartX;
	const dy = touch.clientY - touchStartY;

	if (Math.abs(dx) < swipeThreshold && Math.abs(dy) < swipeThreshold) {
		// Tap: toggle pause
		// Only if short tap; avoid accidental pauses on small drags
		// Single tap toggles pause
		togglePause();
		touchStartX = null;
		touchStartY = null;
		return;
	}

	if (Math.abs(dx) > Math.abs(dy)) {
		// Horizontal swipe
		setDirection(dx > 0 ? 1 : -1, 0);
	} else {
		// Vertical swipe
		setDirection(0, dy > 0 ? 1 : -1);
	}

	touchStartX = null;
	touchStartY = null;
}, { passive: true });

function restart() {
	initGame();
}

function togglePause() {
	playing = !playing;
	btnPause.textContent = playing ? 'Pause' : 'Resume';
}

function gameTick() {
	// Move snake
	direction = nextDirection;
	const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

	// Wrap around edges
	if (head.x < 0) head.x = gridSize - 1;
	if (head.x >= gridSize) head.x = 0;
	if (head.y < 0) head.y = gridSize - 1;
	if (head.y >= gridSize) head.y = 0;

	// Check self collision
	if (snake.some((seg, i) => i !== 0 && seg.x === head.x && seg.y === head.y)) {
		playing = false;
		btnPause.textContent = 'Resume';
		return; // stop growth/move this tick
	}

	snake.unshift(head);

	// Food
	if (head.x === food.x && head.y === food.y) {
		score += 1;
		if (score > highScore) {
			highScore = score;
			localStorage.setItem('snake_high_score', String(highScore));
		}
		updateScore();
		spawnFood();
	} else {
		snake.pop();
	}
}

function drawGrid() {
	ctx.strokeStyle = colorGrid;
	ctx.lineWidth = 1;
	ctx.beginPath();
	for (let i = 1; i < gridSize; i++) {
		const p = i * cell + 0.5; // crisp 1px
		ctx.moveTo(p, 0);
		ctx.lineTo(p, boardSize);
		ctx.moveTo(0, p);
		ctx.lineTo(boardSize, p);
	}
	ctx.stroke();
}

function draw() {
	// Clear to white
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	drawGrid();

	// Food
	ctx.fillStyle = colorFood;
	ctx.fillRect(food.x * cell, food.y * cell, cell, cell);

	// Snake
	for (let i = 0; i < snake.length; i++) {
		const seg = snake[i];
		ctx.fillStyle = i === 0 ? colorSnakeHead : colorSnake;
		ctx.fillRect(seg.x * cell, seg.y * cell, cell, cell);
	}

	// If paused and not at game over due to collision we still render overlay
	if (!playing) {
		ctx.fillStyle = 'rgba(0,0,0,0.25)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = '#ffffff';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Arial';
		ctx.fillText('Paused - Press Space or Resume', canvas.width / 2, canvas.height / 2);
	}
}

function loop(timestamp) {
	if (!lastTick) lastTick = timestamp;
	const elapsed = timestamp - lastTick;

	if (elapsed >= tickMs) {
		if (playing) {
			gameTick();
		}
		lastTick = timestamp;
	}

	draw();
	requestAnimationFrame(loop);
}

// Bootstrap
initGame();
updateScore();
highScoreEl.textContent = String(highScore);
requestAnimationFrame(loop);


