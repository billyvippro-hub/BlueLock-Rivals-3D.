// 1. KẾT NỐI MẠNG LƯỚI META-VISION (Socket.io)
// 🔴 THAY LINK RENDER CỦA NÍ VÀO ĐÂY (Vd: 'https://blue-lock-server.onrender.com')
const socket = io('https://bluelock-rivals-3d.onrender.com/'); 

// 2. SETUP VŨ TRỤ 3D
const scene = new THREE.Scene(); 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Vẽ Sân Cỏ
const fieldGeometry = new THREE.PlaneGeometry(100, 100);
const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x2e8b57, side: THREE.DoubleSide });
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = Math.PI / 2;
scene.add(field);

// Vẽ Quả Bóng Tròn Tròn (Chuẩn bị cho cơ chế sút M1)
const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.y = 0.5;
scene.add(ball);

// 3. TẠO CẦU THỦ CỦA MÌNH (Local Player)
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Của mình màu Xanh Dương
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;
scene.add(player);

camera.position.set(0, 8, 12);

// Danh sách chứa đối thủ/đồng đội trên sân
const otherPlayers = {}; 

// 4. LẮNG NGHE ĐỐI THỦ TỪ SERVER
// Nhận danh sách người đang có mặt trên sân
socket.on('currentPlayers', (players) => {
    for (let id in players) {
        if (id === socket.id) continue; // Bỏ qua bản thân mình
        addOtherPlayer(id, players[id]);
    }
});

// Có kẻ mới gia nhập sân khấu
socket.on('newPlayer', (data) => {
    addOtherPlayer(data.playerId, data.playerInfo);
});

// Hàm tạo "cục gạch" cho đối thủ
function addOtherPlayer(id, info) {
    const mat = new THREE.MeshBasicMaterial({ color: info.color });
    const mesh = new THREE.Mesh(playerGeometry, mat);
    mesh.position.set(info.x, 1, info.z);
    scene.add(mesh);
    otherPlayers[id] = mesh;
}

// Thấy đối thủ di chuyển hoặc bật Flow
socket.on('playerMoved', (data) => {
    if (otherPlayers[data.playerId]) {
        otherPlayers[data.playerId].position.x = data.playerInfo.x;
        otherPlayers[data.playerId].position.z = data.playerInfo.z;
        otherPlayers[data.playerId].material.color.setHex(data.playerInfo.color.replace('#', '0x'));
    }
});

// Kẻ thù rớt mạng hoặc out game
socket.on('playerDisconnected', (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});

// 5. CƠ CHẾ ĐIỀU KHIỂN & KỸ NĂNG BLUE LOCK
const keys = { w: false, a: false, s: false, d: false, shift: false, q: false };
let isFlowActive = false;
let myColor = '#0000ff'; // Xanh dương mặc định

document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;

    // Kích hoạt Flow (G)
    if (key === 'g') {
        isFlowActive = !isFlowActive;
        if (isFlowActive) {
            myColor = '#00ffff'; // Hào quang Cyan (Isagi)
            player.material.color.setHex(0x00ffff);
            console.log("🔥 ĐÃ BẬT FLOW: MỞ KHÓA META-VISION!");
        } else {
            myColor = '#0000ff'; 
            player.material.color.setHex(0x0000ff);
        }
    }
});

document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// M1 - Chuột trái để Sút (Tạm thời in log, bài sau code vật lý bóng bay)
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // 0 là chuột trái
        console.log("⚽ ĐANG VẬN LỰC SÚT BÓNG (M1)...");
    }
});

// 6. VÒNG LẶP THỜI GIAN (Game Loop)
function animate() {
    requestAnimationFrame(animate);

    // Xử lý tốc độ theo Flow và Sprint
    let speed = 0.15; 
    if (keys.shift) speed = 0.25; 
    if (isFlowActive) speed = 0.35; // Flow chà đạp mọi chỉ số

    let isMoving = false;

    if (keys.w) { player.position.z -= speed; isMoving = true; }
    if (keys.s) { player.position.z += speed; isMoving = true; }
    if (keys.a) { player.position.x -= speed; isMoving = true; }
    if (keys.d) { player.position.x += speed; isMoving = true; }

    // Góc nhìn Meta-Vision (Camera đi theo cầu thủ)
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 12; 
    camera.lookAt(player.position);

    // LIÊN TỤC BÁO CÁO TỌA ĐỘ VỀ SERVER NẾU CÓ DI CHUYỂN
    if (isMoving || keys.g) { // Gửi update khi đi hoặc bật/tắt Flow
        socket.emit('playerMovement', {
            x: player.position.x,
            z: player.position.z,
            color: myColor,
            isFlow: isFlowActive
        });
    }

    renderer.render(scene, camera); 
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
