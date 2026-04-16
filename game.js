const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const overlay = document.getElementById('ui-overlay');
const msgEl = document.getElementById('message');
const startBtn = document.getElementById('start-btn');

const tileSize = 20;
let score = 0;
let isPlaying = false;
let animationId;
let pelletsRemaining = 0;

// 1 = Wall, 0 = Pellet, 2 = Empty
const level = [
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
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let grid = [];
const rows = level.length;
const cols = level[0].length;

// Entities
const player = { x: 9 * tileSize, y: 15 * tileSize, vx: 0, vy: 0, nextVx: 0, nextVy: 0, speed: 2 };
const ghosts = [
    { x: 8 * tileSize, y: 9 * tileSize, vx: 2, vy: 0, color: '#ff0000' },
    { x: 10 * tileSize, y: 9 * tileSize, vx: -2, vy: 0, color: '#ffb8ff' }
];

function initGame() {
    grid = level.map(row => [...row]);
    pelletsRemaining = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 0) pelletsRemaining++;
        }
    }
    
    player.x = 9 * tileSize;
    player.y = 15 * tileSize;
    player.vx = 0; player.vy = 0;
    player.nextVx = 0; player.nextVy = 0;

    ghosts[0].x = 8 * tileSize; ghosts[0].y = 9 * tileSize;
    ghosts[1].x = 10 * tileSize; ghosts[1].y = 9 * tileSize;

    score = 0;
    scoreEl.innerText = score;
    isPlaying = true;
    overlay.classList.add('hidden');
    loop();
}

function isWall(x, y) {
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return false; // allow tunnel
    return grid[r][c] === 1;
}

function updateEntity(ent, isPlayer) {
    // Only allow turns when perfectly aligned to the grid
    if (ent.x % tileSize === 0 && ent.y % tileSize === 0) {
        
        if (isPlayer) {
            // Check if queued turn is valid
            if (!isWall(ent.x + ent.nextVx * tileSize, ent.y + ent.nextVy * tileSize)) {
                ent.vx = ent.nextVx;
                ent.vy = ent.nextVy;
            }
            // Stop if hitting a wall in current direction
            if (isWall(ent.x + ent.vx * tileSize, ent.y + ent.vy * tileSize)) {
                ent.vx = 0;
                ent.vy = 0;
            }
        } else {
            // Ghost AI: Change direction if hitting a wall
            if (isWall(ent.x + ent.vx * tileSize, ent.y + ent.vy * tileSize)) {
                const moves = [
                    {vx: 2, vy: 0}, {vx: -2, vy: 0}, {vx: 0, vy: 2}, {vx: 0, vy: -2}
                ];
                const validMoves = moves.filter(m => !isWall(ent.x + m.vx * (tileSize/2), ent.y + m.vy * (tileSize/2)));
                if (validMoves.length > 0) {
                    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                    ent.vx = move.vx;
                    ent.vy = move.vy;
                }
            }
        }
    }

    ent.x += ent.vx;
    ent.y += ent.vy;

    // Tunnel Wrapping
    if (ent.x < -tileSize) ent.x = cols * tileSize;
    if (ent.x > cols * tileSize) ent.x = -tileSize;
}

function update() {
    if (!isPlaying) return;

    updateEntity(player, true);
    ghosts.forEach(g => updateEntity(g, false));

    // Eat pellets
    if (player.x % tileSize === 0 && player.y % tileSize === 0) {
        let c = player.x / tileSize;
        let r = player.y / tileSize;
        if (c >= 0 && c < cols && grid[r][c] === 0) {
            grid[r][c] = 2;
            score += 10;
            scoreEl.innerText = score;
            pelletsRemaining--;
            if (pelletsRemaining === 0) return gameOver("YOU WIN");
        }
    }

    // Ghost Collision
    ghosts.forEach(g => {
        if (Math.abs(player.x - g.x) < tileSize - 4 && Math.abs(player.y - g.y) < tileSize - 4) {
            gameOver("GAME OVER");
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                ctx.fillStyle = '#111';
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
                ctx.strokeRect(c * tileSize + 2, r * tileSize + 2, tileSize - 4, tileSize - 4);
            } else if (grid[r][c] === 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(c * tileSize + tileSize/2, r * tileSize + tileSize/2, 3, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    // Draw Player
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(player.x + tileSize/2, player.y + tileSize/2, tileSize/2 - 2, 0.2*Math.PI, 1.8*Math.PI);
    ctx.lineTo(player.x + tileSize/2, player.y + tileSize/2);
    ctx.fill();

    // Draw Ghosts
    ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.arc(g.x + tileSize/2, g.y + tileSize/2, tileSize/2 - 2, Math.PI, 0);
        ctx.lineTo(g.x + tileSize - 2, g.y + tileSize - 2);
        ctx.lineTo(g.x + 2, g.y + tileSize - 2);
        ctx.fill();
    });
}

function loop() {
    update();
    draw();
    if (isPlaying) animationId = requestAnimationFrame(loop);
}

function gameOver(msg) {
    isPlaying = false;
    msgEl.innerText = msg;
    startBtn.innerText = "PLAY AGAIN";
    overlay.classList.remove('hidden');
}

// Input Controllers
function setDir(vx, vy) {
    player.nextVx = vx;
    player.nextVy = vy;
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') setDir(0, -player.speed);
    if (e.key === 'ArrowDown' || e.key === 's') setDir(0, player.speed);
    if (e.key === 'ArrowLeft' || e.key === 'a') setDir(-player.speed, 0);
    if (e.key === 'ArrowRight' || e.key === 'd') setDir(player.speed, 0);
});

// Mobile Controls
document.getElementById('btn-up').addEventListener('pointerdown', () => setDir(0, -player.speed));
document.getElementById('btn-down').addEventListener('pointerdown', () => setDir(0, player.speed));
document.getElementById('btn-left').addEventListener('pointerdown', () => setDir(-player.speed, 0));
document.getElementById('btn-right').addEventListener('pointerdown', () => setDir(player.speed, 0));

startBtn.addEventListener('click', initGame);
draw(); // Initial render
