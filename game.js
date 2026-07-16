// 1. KẾT NỐI MẠNG LƯỚI MULTIPLAYER (Socket.io)
// 🔴 CHÚ Ý: Đừng quên thay link Render của bro vào đây để giữ kết nối nhé!
const socket = io('LINK_RENDER_CỦA_BRO_VÀO_ĐÂY'); 

// 2. SETUP VŨ TRỤ 3D & GÓC NHÌN ISOMETRIC (Top-down chéo)
const scene = new THREE.Scene();
// Thiết lập camera góc nhìn từ trên xuống và hơi chéo (Isometric / Top-down view)
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Vị trí camera đặt cao và lùi lại để tạo góc nhìn chéo chuẩn game chiến thuật bóng đá
camera.position.set(0, 15, 18); 

// 3. XÂY DỰNG MÔI TRƯỜNG THEO YÊU CẦU MÀU SẮC
// Mặt phẳng nền đất chính nơi cầu thủ đứng (Màu trắng xám)
const mainFieldGeo = new THREE.PlaneGeometry(60, 60);
const mainFieldMat = new THREE.MeshBasicMaterial({ color: 0xE5E7E9, side: THREE.DoubleSide });
const mainField = new THREE.Mesh(mainFieldGeo, mainFieldMat);
mainField.rotation.x = Math.PI / 2;
scene.add(mainField);

// Mặt phẳng nền phía xa/phía sau đường chân trời (Màu xanh lá cây đậm)
const bgFieldGeo = new THREE.PlaneGeometry(300, 300);
const bgFieldMat = new THREE.MeshBasicMaterial({ color: 0x196F3D, side: THREE.DoubleSide });
const bgField = new THREE.Mesh(bgFieldGeo, bgFieldMat);
bgField.rotation.x = Math.PI / 2;
bgField.position.y = -0.05; // Đặt hơi thấp xuống một chút để không đè lên sân chính
scene.add(bgField);

// 4. DỰNG KHUNG THÀNH (Giữ lại từ bài trước để sút bóng)
function createGoal(x, z, rotation) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), material);
    leftPost.position.set(-3, 1.5, 0);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), material);
    rightPost.position.set(3, 1.5, 0);
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.2, 0.2), material);
    topBar.position.set(0, 3, 0);
    group.add(leftPost, rightPost, topBar);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
}
createGoal(0, -25, 0);
createGoal(0, 25, 0);

// Quả bóng (Màu trắng)
const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0.5, 0);
scene.add(ball);

// 5. HÀM KHỞI TẠO NHÂN VẬT 3D DẠNG KHỐI PHÂN CẤP (Voxel/Blocky Model)
function createBlockyPlayer(isLocalPlayer) {
    const playerGroup = new THREE.Group();

    // Quy định màu sắc chuẩn theo yêu cầu:
    const headColor = 0x2C3E50;      // Xanh đen / Xám đậm ở đỉnh đầu
    const torsoColor = 0x4682B4;     // Xanh dương Denim (Blue Jeans)
    const waistColor = 0x000000;     // Vạch đen ở giữa (Thắt lưng)
    const legsColor = 0x2E5B88;      // Xanh dương đồng bộ cho phần chân

    // A. PHẦN THÂN DƯỚI / CHÂN (Khối hộp dưới cùng)
    const legsGeo = new THREE.BoxGeometry(0.8, 0.7, 0.4);
    const legsMat = new THREE.MeshBasicMaterial({ color: legsColor });
    const legsMesh = new THREE.Mesh(legsGeo, legsMat);
    legsMesh.position.y = 0.35; // Nâng tâm lên để chân chạm mặt đất (Y=0)
    playerGroup.add(legsMesh);

    // B. PHẦN THẮT LƯNG (Vạch ngang màu đen ở giữa)
    const waistGeo = new THREE.BoxGeometry(0.82, 0.15, 0.42); // Hơi to hơn tí để lộ rõ vạch đen
    const waistMat = new THREE.MeshBasicMaterial({ color: waistColor });
    const waistMesh = new THREE.Mesh(waistGeo, waistMat);
    waistMesh.position.y = 0.775; // Đặt ngay trên phần chân
    playerGroup.add(waistMesh);

    // C. PHẦN THÂN TRÊN / TORSO (Khối hộp đứng thon dài, không có cánh tay)
    const torsoGeo = new THREE.BoxGeometry(0.8, 0.8, 0.4);
    const torsoMat = new THREE.MeshBasicMaterial({ color: torsoColor });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 1.25; // Đặt ngay trên phần thắt lưng
    playerGroup.add(torsoMesh);

    // D. PHẦN ĐẦU (Khối hộp trên cùng)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshBasicMaterial({ color: headColor });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.9; // Đặt trên đỉnh Torso
    playerGroup.add(headMesh);

    return playerGroup;
}

// Khởi tạo nhân vật của chính mình
const player = createBlockyPlayer(true);
scene.add(player);

// Mạng lưới quản lý đối thủ
const otherPlayers = {};

// 6. LOGIC KẾT NỐI SOCKET MULTIPLAYER
socket.on('currentPlayers', (players) => {
    for (let id in players) {
        if (id === socket.id) continue;
        addOtherPlayer(id, players[id]);
    }
});

socket.on('newPlayer', (data) => {
    addOtherPlayer(data.playerId, data.playerInfo);
});

function addOtherPlayer(id, info) {
    // Tạo nhân vật dạng khối cho đối thủ khi họ vào phòng đấu
    const mesh = createBlockyPlayer(false);
    mesh.position.set(info.x, 0, info.z);
    scene.add(mesh);
    otherPlayers[id] = mesh;
}

socket.on('playerMoved', (data) => {
    if (otherPlayers[data.playerId]) {
        otherPlayers[data.playerId].position.x = data.playerInfo.x;
        otherPlayers[data.playerId].position.z = data.playerInfo.z;
    }
});

socket.on('playerDisconnected', (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});

// 7. HỆ THỐNG ĐIỀU KHIỂN & DI CHUYỂN
const keys = { w: false, a: false, s: false, d: false, shift: false };

document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// 8. VÒNG LẶP THỜI GIAN (Game Loop)
function animate() {
    requestAnimationFrame(animate);

    // Tính toán tốc độ chạy bứt tốc (Sprint)
    let speed = keys.shift ? 0.25 : 0.15;
    let isMoving = false;

    // Di chuyển nhân vật trên mặt phẳng
    if (keys.w) { player.position.z -= speed; isMoving = true; }
    if (keys.s) { player.position.z += speed; isMoving = true; }
    if (keys.a) { player.position.x -= speed; isMoving = true; }
    if (keys.d) { player.position.x += speed; isMoving = true; }

    // Bắt camera khóa góc nhìn theo sát nhân vật (Meta-Vision Isometric)
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 18; 
    camera.lookAt(player.position);

    // Đồng bộ vị trí lên server Render để người chơi khác cùng thấy
    if (isMoving) {
        socket.emit('playerMovement', {
            x: player.position.x,
            z: player.position.z
        });
    }

    renderer.render(scene, camera);
}
animate();

// Tự động co giãn màn hình khi đổi kích thước trình duyệt
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
