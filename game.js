// ==========================================
// 1. KẾT NỐI MẠNG LƯỚI MULTIPLAYER (Socket.io)
// ==========================================
// 🔴 CHÚ Ý: Thay link Render của bro vào đây để đồng bộ người chơi khác nhé!
const socket = io('https://bluelock-rivals-3d.onrender.com/'); 

// ==========================================
// 2. SETUP VŨ TRỤ 3D & GÓC NHÌN ISOMETRIC CHÉO
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Góc nhìn từ trên xuống và hơi chéo (Isometric Top-down view) cực kỳ tôn dáng voxel
camera.position.set(0, 18, 22); 

// ==========================================
// 3. XÂY DỰNG MÔI TRƯỜNG & KHUNG THÀNH
// ==========================================
// Nền đất phẳng phía sau đường chân trời (Màu xanh lá cây đậm)
const bgGeo = new THREE.PlaneGeometry(500, 500);
const bgMat = new THREE.MeshBasicMaterial({ color: 0x145A32, side: THREE.DoubleSide }); // Xanh lá đậm
const bgField = new THREE.Mesh(bgGeo, bgMat);
bgField.rotation.x = Math.PI / 2;
bgField.position.y = -0.1; // Nằm dưới sân chính để không bị đè vệt màu
scene.add(bgField);

// Mặt sân thi đấu chính (Màu trắng xám sắc nét)
const pitchGeo = new THREE.PlaneGeometry(40, 70);
const pitchMat = new THREE.MeshBasicMaterial({ color: 0xD6DBDF, side: THREE.DoubleSide }); // Trắng xám cổ điển
const pitch = new THREE.Mesh(pitchGeo, pitchMat);
pitch.rotation.x = Math.PI / 2;
scene.add(pitch);

// Hàm dựng khung thành chuẩn 3D hình khối vuông vức
function createGoal(x, z, rotation) {
    const goalGroup = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Khung thành trắng
    
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.2), material);
    leftPost.position.set(-4, 1.75, 0);
    
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.2), material);
    rightPost.position.set(4, 1.75, 0);
    
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 0.2), material);
    topBar.position.set(0, 3.5, 0);
    
    goalGroup.add(leftPost, rightPost, topBar);
    goalGroup.position.set(x, 0, z);
    goalGroup.rotation.y = rotation;
    scene.add(goalGroup);
}
createGoal(0, -32, 0); // Khung thành đội A
createGoal(0, 32, Math.PI); // Khung thành đội B

// Quả bóng đá dạng khối vuông cho đồng bộ phong cách Voxel
const ballGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(0, 0.3, 0);
scene.add(ball);

// Vận tốc vật lý của quả bóng
let ballVelocity = { x: 0, z: 0 };

// ==========================================
// 4. HÀM TẠO NHÂN VẬT VOXEL PHÂN CẤP CHUẨN TỶ LỆ
// ==========================================
function createVoxelPlayer(isFlow = false) {
    const pGroup = new THREE.Group();

    // Mã màu chuẩn chỉ theo yêu cầu thiết kế của bro
    const headColor = isFlow ? 0x00ffff : 0x2C3E50;  // Bình thường: Xanh đen xám | Flow: Hào quang Cyan
    const torsoColor = 0x4682B4;                     // Thân trên: Xanh dương Denim (Blue Jeans)
    const beltColor = 0x111111;                      // Vạch ngang thắt lưng đen ở giữa
    const legsColor = 0x2E5B88;                      // Thân dưới/Chân: Xanh dương đồng bộ

    // A. PHẦN CHÂN (Legs - Khối đứng thon ở dưới cùng)
    const legsGeo = new THREE.BoxGeometry(0.7, 0.8, 0.4);
    const legsMat = new THREE.MeshBasicMaterial({ color: legsColor });
    const legs = new THREE.Mesh(legsGeo, legsMat);
    legs.position.y = 0.4; // Đẩy tâm lên để chân đứng chạm mặt đất Y=0
    pGroup.add(legs);

    // B. PHẦN THẮT LƯNG ĐEN (Belt - Vạch ngang chia đôi cơ thể)
    const beltGeo = new THREE.BoxGeometry(0.72, 0.15, 0.42); // Hơi nhô ra tí cho rõ vạch
    const beltMat = new THREE.MeshBasicMaterial({ color: beltColor });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.875; // Xếp ngay trên phần chân
    pGroup.add(belt);

    // C. PHẦN THÂN TRÊN (Torso - Thân hình đứng, thon dài, không tay)
    const torsoGeo = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    const torsoMat = new THREE.MeshBasicMaterial({ color: torsoColor });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.5; // Xếp ngay trên thắt lưng
    pGroup.add(torso);

    // D. PHẦN ĐẦU (Head - Khối hộp trên cùng)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshBasicMaterial({ color: headColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3; // Ngự trị trên đỉnh Torso
    pGroup.add(head);

    return pGroup;
}

// Khởi tạo cầu thủ của chính mình
let player = createVoxelPlayer(false);
scene.add(player);

const otherPlayers = {}; // Danh sách quản lý đối thủ kết nối mạng

// ==========================================
// 5. LOGIC DI CHUYỂN & DỮ LIỆU ĐỒNG BỘ
// ==========================================
const keys = { w: false, a: false, s: false, d: false, shift: false };
let isFlowActive = false;

document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;

    // Phím G - Thức tỉnh trạng thái thăng hoa Flow
    if (key === 'g') {
        isFlowActive = !isFlowActive;
        // Cập nhật lại màu đầu nhân vật ngay lập tức
        scene.remove(player);
        player = createVoxelPlayer(isFlowActive);
        scene.add(player);
        console.log(isFlowActive ? "🔥 FLOW AWAKENING: NUỐT CHỬNG SÂN ĐẤU! 🔥" : "Tắt Flow.");
    }
});

document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// Cơ chế sút bóng M1 (Chuột trái)
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Click chuột trái
        // Tính khoảng cách từ người đến bóng
        let dist = player.position.distanceTo(ball.position);
        if (dist < 2.0) { // Nếu bóng nằm trong tầm sút công phá
            // Tính hướng sút từ người ra bóng
            let dirX = ball.position.x - player.position.x;
            let dirZ = ball.position.z - player.position.z;
            let length = Math.sqrt(dirX * dirX + dirZ * dirZ);
            
            if (length > 0) {
                dirX /= length;
                dirZ /= length;
            }

            // Lực sút mặc định là 0.7, nếu đang bật Flow thì nhân đôi lực sút thành 1.4 (Sút sấm sét!)
            let shootPower = isFlowActive ? 1.4 : 0.7;
            ballVelocity.x = dirX * shootPower;
            ballVelocity.z = dirZ * shootPower;
            
            console.log("⚽ KAISER IMPACT!!! CÚ SÚT HỦY DIỆT!");
        }
    }
});

// MULTIPLAYER LISTENERS
socket.on('currentPlayers', (players) => {
    for (let id in players) {
        if (id === socket.id) continue;
        addOtherPlayer(id, players[id]);
    }
});
socket.on('newPlayer', (data) => { addOtherPlayer(data.playerId, data.playerInfo); });
function addOtherPlayer(id, info) {
    const mesh = createVoxelPlayer(info.isFlow);
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
    if (otherPlayers[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }
});

// ==========================================
// 6. VÒNG LẶP THỜI GIAN (Game Loop & Vật lý)
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    // Xử lý tốc độ di chuyển của nhân vật
    let speed = 0.14;
    if (keys.shift) speed = 0.22; // Sprint tăng tốc
    if (isFlowActive) speed = 0.32; // Flow bứt tốc xé gió

    let isMoving = false;
    if (keys.w) { player.position.z -= speed; isMoving = true; }
    if (keys.s) { player.position.z += speed; isMoving = true; }
    if (keys.a) { player.position.x -= speed; isMoving = true; }
    if (keys.d) { player.position.x += speed; isMoving = true; }

    // Giới hạn cầu thủ không chạy ra khỏi mặt sân xám trắng
    player.position.x = Math.max(-19.5, Math.min(19.5, player.position.x));
    player.position.z = Math.max(-34.5, Math.min(34.5, player.position.z));

    // --- XỬ LÝ VẬT LÝ QUẢ BÓNG (RÊ BÓNG VA CHẠM) ---
    let distToBall = player.position.distanceTo(ball.position);
    if (distToBall < 1.2) { // Khi chạm vào bóng (Rê bóng)
        let dirX = ball.position.x - player.position.x;
        let dirZ = ball.position.z - player.position.z;
        let len = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (len > 0) {
            // Đẩy nhẹ quả bóng đi trước mặt cầu thủ theo hướng di chuyển
            ball.position.x = player.position.x + (dirX / len) * 1.2;
            ball.position.z = player.position.z + (dirZ / len) * 1.2;
        }
    }

    // Cập nhật đà lăn tự do của bóng (khi được sút đi)
    ball.position.x += ballVelocity.x;
    ball.position.z += ballVelocity.z;

    // Lực ma sát sân cỏ làm bóng chậm dần theo thời gian
    ballVelocity.x *= 0.95;
    ballVelocity.z *= 0.95;

    // Giới hạn bóng không văng ra khỏi biên dọc/biên ngang của sân chính
    ball.position.x = Math.max(-19.5, Math.min(19.5, ball.position.x));
    ball.position.z = Math.max(-34.5, Math.min(34.5, ball.position.z));

    // --- KHÓA GÓC NHÌN CAMERA TRÊN CAO (Meta-Vision Isometric) ---
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 22; 
    camera.lookAt(player.position);

    // Báo cáo vị trí thời gian thực lên Server
    if (isMoving || keys.g) {
        socket.emit('playerMovement', {
            x: player.position.x,
            z: player.position.z,
            isFlow: isFlowActive
        });
    }

    renderer.render(scene, camera);
}
animate();

// Co giãn khung hình mượt mà khi phóng to thu nhỏ trình duyệt
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
