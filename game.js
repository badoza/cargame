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

// 1 = Wall, 0 = Pellet, 2 = Empty Path
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

const player = { x: 9 * tileSize, y: 15 * tileSize, vx: 0, vy: 0, nextVx: 0, nextVy: 0, speed: 2 };

const ghosts = [
    { x: 8 * tileSize, y: 9 * tileSize, vx: 2, vy: 0, speed: 2, color: '#ff0000' }, // Red
    { x: 10 * tileSize, y: 9 * tileSize, vx: -2, vy: 0, speed: 2, color: '#ffb8ff' }, // Pink
    { x: 9 * tileSize, y: 7 * tileSize, vx: 0, vy: 2, speed: 2, color: '#00ffff' }, // Cyan
    { x: 9 * tileSize, y: 11 * tileSize, vx: 0, vy: -2, speed: 2, color: '#ffb852' } // Orange
];

// BULLETPROOF GRID WRAPPER: Prevents Javascript from crashing on map edges
function getGrid(r, c) {
    if (r < 0 || r >= rows) return 1; // Treat out-of-bounds up/down as solid walls
    if (c < 0) c = cols - 1;          // Wrap left tunnel
    if (c >= cols) c = 0;             // Wrap right tunnel
    return grid[r][c];
}

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

    ghosts[0].x = 8 * tileSize; ghosts[0].y = 9 * tileSize; ghosts[0].vx = 2; ghosts[0].vy = 0;
    ghosts[1].x = 10 * tileSize; ghosts[1].y = 9 * tileSize; ghosts[1].vx = -2; ghosts[1].vy = 0;
    ghosts[2].x = 9 * tileSize; ghosts[2].y = 7 * tileSize; ghosts[2].vx = 0; ghosts[2].vy = 2;
    ghosts[3].x = 9 * tileSize; ghosts[3].y = 11 * tileSize; ghosts[3].vx = 0; ghosts[3].vy = -2;

    score = 0;
    scoreEl.innerText = score;
    isPlaying = true;
    overlay.classList.add('hidden');
    loop();
}

function updateEntity(ent, isPlayer) {
    
    // INSTANT REVERSE FOR PLAYER: Makes controls feel incredibly responsive
    if (isPlayer) {
        if ((ent.nextVx !== 0 && ent.nextVx === -ent.vx) || 
            (ent.nextVy !== 0 && ent.nextVy === -ent.vy)) {
            ent.vx = ent.nextVx;
            ent.vy = ent.nextVy;
        }
    }

    // STRICT JUNCTION LOCK: Only evaluates turns when perfectly centered
    if (ent.x % tileSize === 0 && ent.y % tileSize === 0) {
        let col = Math.floor(ent.x / tileSize);
        let row = Math.floor(ent.y / tileSize);

        if (isPlayer) {
            // 1. Try to turn to queued direction
            if (ent.nextVx !== 0 || ent.nextVy !== 0) {
                let nCol = col + Math.sign(ent.nextVx);
                let nRow = row + Math.sign(ent.nextVy);
                
                if (getGrid(nRow, nCol) !== 1) {
                    ent.vx = ent.nextVx;
                    ent.vy = ent.nextVy;
                }
            }
            
            // 2. Stop moving if hitting a wall straight ahead
            let tCol = col + Math.sign(ent.vx);
            let tRow = row + Math.sign(ent.vy);
            
            if (getGrid(tRow, tCol) === 1) {
                ent.vx = 0;
                ent.vy = 0;
            }
        } else {
            // GHOST AI: Continuously evaluate intersections without crashing
            let possibleMoves = [];
            const directions = [
                {vx: ent.speed, vy: 0}, {vx: -ent.speed, vy: 0},
                {vx: 0, vy: ent.speed}, {vx: 0, vy: -ent.speed}
            ];

            for (let dir of directions) {
                let tCol = col + Math.sign(dir.vx);
                let tRow = row + Math.sign(dir.vy);
                
                if (getGrid(tRow, tCol) !== 1) {
                    let isReversing = (dir.vx !== 0 && dir.vx === -ent.vx) || (dir.vy !== 0 && dir.vy === -ent.vy);
                    possibleMoves.push({ ...dir, isReversing });
                }
            }

            if (possibleMoves.length > 0) {
                let forwardMoves = possibleMoves.filter(m => !m.isReversing);
                if (forwardMoves.length > 0) {
                    // Pick a random open path that isn't backwards
                    let move = forwardMoves[Math.floor(Math.random() * forwardMoves.length)];
                    ent.vx = move.vx;
                    ent.vy = move.vy;
                } else {
                    // Reverse only if trapped in a dead end
                    ent.vx = possibleMoves[0].vx;
                    ent.vy = possibleMoves[0].vy;
                }
            }
        }
    }

    // Apply movement
    ent.x += ent.vx;
    ent.y += ent.vy;

    // Endless Tunnel Wrapping
    if (ent.x < -tileSize) ent.x = (cols - 1) * tileSize;
    if (ent.x > (cols - 1) * tileSize) ent.x = -tileSize;
}

function update() {
    if (!isPlaying) return;

    updateEntity(player, true);
    ghosts.forEach(g => updateEntity(g, false));

    // Pellet Eating Logic
    if (player.x % tileSize === 0 && player.y % tileSize === 0) {
        let c = Math.floor(player.x / tileSize);
        let r = Math.floor(player.y / tileSize);
        if (c >= 0 && c < cols && grid[r][c] === 0) {
            grid[r][c] = 2; // Erase the pellet
            score += 10;
            scoreEl.innerText = score;
            pelletsRemaining--;
            if (pelletsRemaining === 0) return gameOver("YOU WIN");
        }
    }

    // Deadly Collision Hitboxes
    ghosts.forEach(g => {
        const dist = Math.hypot((player.x - g.x), (player.y - g.y));
        if (dist < tileSize - 4) {
            gameOver("GAME OVER");
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Walls and Pellets
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

    // Render Pac-Man (Rotates based on velocity)
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    let angle = 0;
    if (player.vx > 0) angle = 0;
    else if (player.vx < 0) angle = Math.PI;
    else if (player.vy > 0) angle = Math.PI / 2;
    else if (player.vy < 0) angle = -Math.PI / 2;
    
    ctx.translate(player.x + tileSize/2, player.y + tileSize/2);
    ctx.rotate(angle);
    ctx.arc(0, 0, tileSize/2 - 2, 0.2*Math.PI, 1.8*Math.PI);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.rotate(-angle);
    ctx.translate(-(player.x + tileSize/2), -(player.y + tileSize/2));

    // Render Ghosts
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

// Input Routing
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

// Mobile Layout Support
document.getElementById('btn-up').addEventListener('pointerdown', () => setDir(0, -player.speed));
document.getElementById('btn-down').addEventListener('pointerdown', () => setDir(0, player.speed));
document.getElementById('btn-left').addEventListener('pointerdown', () => setDir(-player.speed, 0));
document.getElementById('btn-right').addEventListener('pointerdown', () => setDir(player.speed, 0));

startBtn.addEventListener('click', initGame);
draw();
