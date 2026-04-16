const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud');
const speedDisplay = document.getElementById('speed');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// CRITICAL FIX: Force canvas to the background layer
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '1';

document.getElementById('game-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Road Environment
const roadGeometry = new THREE.PlaneGeometry(20, 200, 10, 100);
const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, wireframe: true });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

// Player Bike Placeholder
const bikeGeometry = new THREE.BoxGeometry(1, 1.5, 2);
const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const bike = new THREE.Mesh(bikeGeometry, bikeMaterial);
bike.position.y = 0.75;
scene.add(bike);

let isPlaying = false;
let speed = 0;
const keys = { a: false, d: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        if (speed < 120) speed += 0.5;
        speedDisplay.innerText = Math.floor(speed);

        if (keys.a || keys.ArrowLeft) {
            bike.position.x -= 0.15;
            bike.rotation.z = 0.2;
        } else if (keys.d || keys.ArrowRight) {
            bike.position.x += 0.15;
            bike.rotation.z = -0.2;
        } else {
            bike.rotation.z *= 0.8;
        }

        if (bike.position.x < -9) bike.position.x = -9;
        if (bike.position.x > 9) bike.position.x = 9;

        // Simulate forward motion
        road.position.z += speed * 0.005;
        if (road.position.z > 10) road.position.z = 0;
        
        camera.position.x = bike.position.x * 0.5;
    }

    renderer.render(scene, camera);
}

startBtn.addEventListener('click', () => {
    uiLayer.classList.add('hidden');
    hud.classList.remove('hidden');
    isPlaying = true;
});

animate();
