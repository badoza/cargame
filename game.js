const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score-display');
const title = document.getElementById('title');
const hud = document.getElementById('hud');
const currentScoreElement = document.getElementById('current-score');

canvas.width = 400;
canvas.height = 600;

let isGameActive = false;
let score = 0;
let gameSpeed = 5;
let animationId;

// Player Car
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 100,
    width: 40,
    height: 70,
    color: '#00d2ff',
    speed: 6,
    dx: 0
};

// Obstacles Array
let obstacles = [];

// Input handling (Keyboard)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.dx = -player.speed;
    if (e.key === 'ArrowRight' || e.key === 'd') player.dx = player.speed;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = 0;
    }
});

function drawCar(car, isEnemy = false) {
    ctx.fillStyle = car.color;
    // Simple car shape
    ctx.fillRect(car.x, car.y, car.width, car.height);
    // Wheels
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x - 5, car.y + 10, 5, 15);
    ctx.fillRect(car.x + car.width, car.y + 10, 5, 15);
    ctx.fillRect(car.x - 5, car.y + car.height - 25, 5, 15);
    ctx.fillRect(car.x + car.width, car.y + car.height - 25, 5, 15);
}

function handleObstacles() {
    // Generate new obstacles
    if (Math.random() < 0.03) {
        let obsX = Math.random() * (canvas.width - 40);
        obstacles.push({
            x: obsX,
            y: -70,
            width: 40,
            height: 70,
            color: '#ff4b2b'
        });
    }

    // Move and draw obstacles
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.y += gameSpeed;
        drawCar(obs, true);

        // Collision Detection
        if (player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y) {
            gameOver();
        }

        // Remove off-screen obstacles and increase score
        if (obs.y > canvas.height) {
            obstacles.splice(i, 1);
            score++;
            currentScoreElement.innerText = score;
            i--;
            
            // Make the game crazier!
            if (score % 5 === 0) gameSpeed += 0.5; 
        }
    }
}

function update() {
    if (!isGameActive) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Road Lines
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.lineDashOffset = -Date.now() / 20 * gameSpeed; // Animate lines
    ctx.stroke();

    // Move Player
    player.x += player.dx;
    
    // Boundary check
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    drawCar(player);
    handleObstacles();

    animationId = requestAnimationFrame(update);
}

function startGame() {
    isGameActive = true;
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    player.x = canvas.width / 2 - 20;
    currentScoreElement.innerText = score;
    
    uiLayer.classList.add('hidden');
    hud.classList.remove('hidden');
    
    update();
}

function gameOver() {
    isGameActive = false;
    cancelAnimationFrame(animationId);
    
    uiLayer.classList.remove('hidden');
    hud.classList.add('hidden');
    title.innerText = 'CRASHED!';
    scoreDisplay.innerText = `Final Score: ${score}`;
    startBtn.innerText = 'Try Again';
}

startBtn.addEventListener('click', startGame);
