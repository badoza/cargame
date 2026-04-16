// UI Elements
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud');
const speedDisplay = document.getElementById('speed');

// Three.js Core Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
// Add fog to hide the horizon and simulate depth
scene.fog = new THREE.Fog(0x111111, 10, 50); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Position camera directly behind the player
camera.position.set(0, 3, 7); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// The "Road"
const roadGeometry = new THREE.PlaneGeometry(20, 200, 10, 100);
const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333, 
    wireframe: true // Wireframe gives a cool sense of speed for now
});
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2; // Lay flat
scene.add(road);

// The Player "Bike" (Temporary Box Model)
const bikeGeometry = new THREE.BoxGeometry(1, 1.5, 2);
const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const bike = new THREE.Mesh(bikeGeometry, bikeMaterial);
bike.position.y = 0.75; // Sit on the road
scene.add(bike);

// Game State & Input
let isPlaying = false;
let speed = 0;
const keys = { a: false, d: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Game Loop
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        // Accelerate
        if (speed < 120) speed += 0.5;
        speedDisplay.innerText = Math.floor(speed);

        // Steering
        if (keys.a || keys.ArrowLeft) {
            bike.position.x -= 0.15;
            bike.rotation.z = 0.2; // Lean left
        } else if (keys.d || keys.ArrowRight) {
            bike.position.x += 0.15;
            bike.rotation.z = -0.2; // Lean right
        } else {
            // Return to center balance
            bike.rotation.z *= 0.8; 
        }

        // Keep bike on the road
        if (bike.position.x < -9) bike.position.x = -9;
        if (bike.position.x > 9) bike.position.x = 9;

        // Animate the road texture to simulate movement
        // We move the road backwards towards the camera, then reset it
        road.position.z += speed * 0.005;
        if (road.position.z > 10) {
            road.position.z = 0;
        }
        
        // Camera follows bike slightly
        camera.position.x = bike.position.x * 0.5;
    }

    renderer.render(scene, camera);
}

// Start sequence
startBtn.addEventListener('click', () => {
    uiLayer.classList.add('hidden');
    hud.classList.remove('hidden');
    isPlaying = true;
});

animate();
