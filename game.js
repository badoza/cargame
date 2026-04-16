const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const startBtn = document.getElementById('start-btn');

const tileSize = 20;
let score = 0;
let isPlaying = false;
let animationId;

// 1 = Wall, 0 = Pellet, 2 = Empty
const initialMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
    [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let map = [];
let pelletsCount = 0;

const player = { x: 9 * tileSize, y: 13 * tileSize, size: 14, speed: 2, dx: 0, dy: 0, nextDx: 0, nextDy: 0 };
let ghosts = [];

function initMap() {
    map = initialMap.map(row => [...row]);
    pelletsCount = 0;
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 0) pelletsCount++;
        }
    }
}

function initGhosts() {
    ghosts = [
        { x: 9 * tileSize, y: 7 * tileSize, color: '#ff0000', dx: 2, dy: 0 },
        { x: 9 * tileSize, y: 9 * tileSize, color: '#ffb8ff', dx: -2, dy: 0 }
    ];
}

function checkCollision(x, y, dx, dy, size) {
    const nextX = x + dx;
    const nextY = y + dy;
    const offset = size / 2 - 1; 

    // Check the 4 corners of the bounding box against the grid
    const corners = [
        { cx: nextX - offset, cy: nextY - offset },
        { cx: nextX + offset, cy: nextY - offset },
        { cx: nextX - offset, cy: nextY + offset },
        { cx: nextX + offset, cy: nextY + offset }
    ];

    for (let corner of corners) {
        let gridX = Math.floor(corner.cx / tileSize);
        let gridY = Math.floor(corner.cy / tileSize);
        
        // Wrap around logic for tunnel
        if (gridX < 0 || gridX >= map[0].length) continue; 
        
        if (map[gridY][gridX] === 1) return true; // Hit a wall
    }
    return false;
}

function update() {
    if (!isPlaying) return;

    // Player Movement Logic
    // Try to move in the 'next' queued direction first
    if (player.nextDx !== 0 || player.nextDy !== 0) {
        if (!checkCollision(player.x, player.y, player.nextDx, player.nextDy, player.size)) {
            player.dx = player.nextDx;
            player.dy = player.nextDy;
            // Clear queue
            player.nextDx = 0; 
            player.nextDy = 0; 
        }
    }

    // Move if current direction is clear
    if (!checkCollision(player.x, player.y, player.dx, player.dy, player.size)) {
        player.x += player.dx;
        player.y += player.dy;
    }

    // Screen wrap (Tunnel)
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;

    // Eat pellets
    let gridX = Math.floor(player.x / tileSize);
    let gridY = Math.floor(player.y / tileSize);
    if (gridX >= 0 && gridX < map[0].length && map[gridY][gridX] === 0) {
        map[gridY][gridX] = 2; // Set to empty
        score += 10;
        scoreElement.innerText = score;
        pelletsCount--;

        if (pelletsCount <= 0) {
            endGame("YOU WIN");
            return;
        }
    }

    // Update Ghosts
    ghosts.forEach(ghost => {
        // Simple Ghost AI: If it hits a wall, pick a random valid direction
        if (checkCollision(ghost.x, ghost.y, ghost.dx, ghost.dy, tileSize - 2)) {
            const directions = [
                { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 }
            ];
            let validMoves = directions.filter(dir => !checkCollision(ghost.x, ghost.y, dir.dx, dir.dy, tileSize - 2));
            if (validMoves.length > 0) {
                let move = validMoves[Math.floor(Math.random() * validMoves.length)];
                ghost.dx = move.dx;
                ghost.dy = move.dy;
            } else {
                ghost.dx = 0; ghost.dy = 0;
            }
        }
        ghost.x += ghost.dx;
        ghost.y += ghost.dy;

        // Ghost collision with player
        const dist = Math.hypot(player.x - ghost.x, player.y - ghost.y);
        if (dist < player.size) {
            endGame("GAME OVER");
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 1) {
                ctx.fillStyle = '#fff'; // Minimalist white walls
                // Create hollow box effect for a premium look
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                ctx.fillStyle = '#000';
                ctx.fillRect(col * tileSize + 1, row * tileSize + 1, tileSize - 2, tileSize - 2);
            } else if (map[row][col] === 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(col * tileSize + tileSize/2, row * tileSize + tileSize/2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw Player
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0.2 * Math.PI, 1.8 * Math.PI); // Open mouth
    ctx.lineTo(player.x, player.y);
    ctx.fill();

    // Draw Ghosts
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.fillRect(ghost.x - tileSize/2 + 2, ghost.y - tileSize/2 + 2, tileSize - 4, tileSize - 4);
    });
}

function loop() {
    update();
    draw();
    if (isPlaying) {
        animationId = requestAnimationFrame(loop);
    }
}

function startGame() {
    initMap();
    initGhosts();
    player.x = 9 * tileSize + tileSize/2;
    player.y = 13 * tileSize + tileSize/2;
    player.dx = 0; player.dy = 0;
    player.nextDx = 0; player.nextDy = 0;
    score = 0;
    scoreElement.innerText = score;
    isPlaying = true;
    overlay.classList.add('hidden');
    loop();
}

function endGame(message) {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    overlayTitle.innerText = message;
    startBtn.innerText = "PLAY AGAIN";
    overlay.classList.remove('hidden');
}

// Input Handling
function setDirection(dx, dy) {
    player.nextDx = dx;
    player.nextDy = dy;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') setDirection(0, -player.speed);
    if (e.key === 'ArrowDown' || e.key === 's') setDirection(0, player.speed);
    if (e.key === 'ArrowLeft' || e.key === 'a') setDirection(-player.speed, 0);
    if (e.key === 'ArrowRight' || e.key === 'd') setDirection(player.speed, 0);
});

// Mobile Controls
document.getElementById('btn-up').addEventListener('pointerdown', () => setDirection(0, -player.speed));
document.getElementById('btn-down').addEventListener('pointerdown', () => setDirection(0, player.speed));
document.getElementById('btn-left').addEventListener('pointerdown', () => setDirection(-player.speed, 0));
document.getElementById('btn-right').addEventListener('pointerdown', () => setDirection(player.speed, 0));

startBtn.addEventListener('click', startGame);
draw(); // Initial draw before start
