// ==========================================
// 1. KẾT NỐI MẠNG LƯỚI MULTIPLAYER (Socket.io)
// ==========================================
// 🔴 CHÚ Ý: Đừng quên thay link Render của bro vào đây để chơi được multiplayer!
const socket = io('https://bluelock-rivals-3d.onrender.com/'); 

// Tự động cập nhật bảng hướng dẫn UI ngoài màn hình cho xịn sò
const uiDiv = document.getElementById('ui');
if (uiDiv) {
    uiDiv.innerHTML = `
        <b>[CƠ CHẾ ĐIỀU KHIỂN CHUYÊN NGHIỆP]</b><br>
        • <b>Click vào màn hình</b> để khóa chuột xoay 360°<br>
        • Di chuột để xoay hướng nhìn (Shiftlock)<br>
        • W A S D: Chạy theo hướng camera<br>
        • Shift: Nước rút (Sprint)<br>
        • G: Thức tỉnh (Flow - Tốc độ & Lực sút bá đạo)<br>
        • Click Chuột Trái (M1): Sút bóng theo hướng nhìn<br>
        • Nhấn phím <b>ESC</b> để mở khóa chuột
    `;
}

// ==========================================
// 2. SETUP VŨ TRỤ 3D
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ==========================================
// 3. ĐIỀU KHIỂN CHUỘT 360 ĐỘ (Pointer Lock)
// ==========================================
let yaw = 0;   // Góc xoay trái/phải (ngang)
let pitch = 0.5; // Góc xoay lên/xuống (dọc)

// Khi click vào màn hình -> Khóa con trỏ chuột
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// Lắng nghe di chuyển chuột khi đã khóa
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        yaw -= event.movementX * 0.0025;   // Điều chỉnh độ nhạy xoay ngang
        pitch -= event.movementY * 0.0025; // Điều chỉnh độ nhạy xoay dọc
        
        // Giới hạn góc nhìn dọc (không cho camera lật ngược hoặc sát đất quá)
        pitch = Math.max(0.15, Math.min(Math.PI / 2.2, pitch));
    }
});

// ==========================================
// 4. XÂY DỰNG MÔI TRƯỜNG & KHUNG THÀNH
// ==========================================
// Nền đất xanh lá đậm ở xa
const bgGeo = new THREE.PlaneGeometry(500, 500);
const bgMat = new THREE.MeshBasicMaterial({ color: 0x145A32, side: THREE.DoubleSide });
const bgField = new THREE.Mesh(bgGeo, bgMat);
bgField.rotation.x = Math.PI / 2;
bgField.position.y = -0.1;
scene.add(bgField);

// Mặt sân thi đấu chính (Màu trắng xám)
const pitchGeo = new THREE.PlaneGeometry(40, 70);
const pitchMat = new THREE.MeshBasicMaterial({ color: 0xD6DBDF, side: THREE.DoubleSide });
const pitch = new THREE.Mesh(pitchGeo, pitchMat);
pitch.rotation.x = Math.PI / 2;
scene.add(pitch);

// Khung thành 3D vuông vức
function createGoal(x, z, rotation) {
    const goalGroup = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
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
createGoal(0, -32, 0);
createGoal(0, 32, Math.PI);

// Quả bóng dạng Voxel
const ballGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(0, 0.3, 0);
scene.add(ball);

let ballVelocity = { x: 0, z: 0 };

// ==========================================
// 5. HÀM KHỞI TẠO NHÂN VẬT VOXEL PHÂN CẤP CHUẨN TỶ LỆ
// ==========================================
function createVoxelPlayer(isFlow = false) {
    const pGroup = new THREE.Group();

    // Hệ màu sắc đồng bộ theo bản vẽ thiết kế
    const headColor = isFlow ? 0x00ffff : 0x2C3E50;  // Bình thường: Xanh xám | Flow: Hào quang Cyan rực rỡ
    const torsoColor = 0x4682B4;                     // Thân trên: Xanh denim
    const beltColor = 0x111111;                      // Thắt lưng đen phân vùng cơ thể
    const legsColor = 0x2E5B88;                      // Chân: Xanh dương đậm đà

    // A. PHẦN CHÂN
    const legsGeo = new THREE.BoxGeometry(0.7, 0.8, 0.4);
    const legsMat = new THREE.MeshBasicMaterial({ color: legsColor });
    const legs = new THREE.Mesh(legsGeo, legsMat);
    legs.position.y = 0.4;
    pGroup.add(legs);

    // B. PHẦN THẮT LƯNG ĐEN
    const beltGeo = new THREE.BoxGeometry(0.72, 0.15, 0.42);
    const beltMat = new THREE.MeshBasicMaterial({ color: beltColor });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.875;
    pGroup.add(belt);

    // C. PHẦN THÂN TRÊN (Torso thon dài đứng thẳng)
    const torsoGeo = new THREE.BoxGeometry(0.7, 1.1, 0.4);
    const torsoMat = new THREE.MeshBasicMaterial({ color: torsoColor });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.5;
    pGroup.add(torso);

    // D. PHẦN ĐẦU (Nằm trên cùng)
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshBasicMaterial({ color: headColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.3;
    pGroup.add(head);

    return pGroup;
}

// Tạo cầu thủ của bạn
let player = createVoxelPlayer(false);
scene.add(player);

const otherPlayers = {}; // Danh sách chứa đối thủ kết nối mạng

// ==========================================
// 6. LOGIC DI CHUYỂN & SÚT BÓNG (TƯƠNG THÍCH XOAY 360)
// ==========================================
const keys = { w: false, a: false, s: false, d: false, shift: false };
let isFlowActive = false;

document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;

    // Bật/tắt trạng thái thức tỉnh Flow (Phím G)
    if (key === 'g') {
        isFlowActive = !isFlowActive;
        scene.remove(player);
        // Lưu lại vị trí hiện tại của player trước khi thay đổi trạng thái mô hình
        const oldPos = player.position.clone();
        const oldRot = player.rotation.y;
        player = createVoxelPlayer(isFlowActive);
        player.position.copy(oldPos);
        player.rotation.y = oldRot;
        scene.add(player);
        console.log(isFlowActive ? "🔥 FLOW AWAKENING ĐÃ KÍCH HOẠT! 🔥" : "Tắt Flow.");
    }
});

document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// Sút bóng chuẩn xác theo hướng nhìn của người chơi (M1 - Chuột trái)
document.addEventListener('mousedown', (event) => {
    if (event.button === 0 && document.pointerLockElement === renderer.domElement) {
        let dist = player.position.distanceTo(ball.position);
        if (dist < 1.8) { // Khoảng cách bóng đủ gần chân
            // Hướng sút chính là hướng người chơi đang đối diện (tính từ góc xoay Y)
            const shootDirX = -Math.sin(player.rotation.y);
            const shootDirZ = -Math.cos(player.rotation.y);

            // Bật Flow sút mạnh gấp đôi!
            let shootPower = isFlowActive ? 1.6 : 0.85;
            ballVelocity.x = shootDirX * shootPower;
            ballVelocity.z = shootDirZ * shootPower;
            
            console.log("⚽ KAISER IMPACT!!! SÚT TUNG LƯỚI ĐỐI PHƯƠNG!");
        }
    }
});

// MULTIPLAYER SYNC (Đồng bộ góc xoay Y của người chơi lên server)
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
        if (data.playerInfo.rotY !== undefined) {
            otherPlayers[data.playerId].rotation.y = data.playerInfo.rotY; // Đồng bộ hướng quay của đối thủ
        }
    }
});
socket.on('playerDisconnected', (id) => {
    if (otherPlayers[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }
});

// ==========================================
// 7. GAME LOOP & VẬT LÝ DI CHUYỂN THEO CAMERA
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    // Xử lý tốc độ chạy
    let speed = 0.14;
    if (keys.shift) speed = 0.22; // Sprint tăng tốc dũng mãnh
    if (isFlowActive) speed = 0.32; // Flow bứt tốc xé gió thần sầu

    // Tính toán Vector hướng di chuyển dựa trên Camera góc xoay Y (yaw)
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    let moveX = 0;
    let moveZ = 0;

    if (keys.w) { moveX += forwardX; moveZ += forwardZ; }
    if (keys.s) { moveX -= forwardX; moveZ -= forwardZ; }
    if (keys.a) { moveX -= rightX; moveZ -= rightZ; }
    if (keys.d) { moveX += rightX; moveZ += rightZ; }

    let isMoving = (keys.w || keys.s || keys.a || keys.d);

    if (isMoving) {
        // Chuẩn hóa vector di chuyển để chạy chéo không bị nhanh hơn chạy thẳng
        let length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        moveX = (moveX / length) * speed;
        moveZ = (moveZ / length) * speed;

        player.position.x += moveX;
        player.position.z += moveZ;

        // Làm nhân vật tự động quay mặt về hướng camera đang nhìn
        player.rotation.y = yaw;
    }

    // Giới hạn cầu thủ không chạy ra ngoài biên sân xám
    player.position.x = Math.max(-19.5, Math.min(19.5, player.position.x));
    player.position.z = Math.max(-34.5, Math.min(34.5, player.position.z));

    // --- VẬT LÝ RÊ BÓNG (Đẩy bóng đi trước mặt cầu thủ theo góc nhìn) ---
    let distToBall = player.position.distanceTo(ball.position);
    if (distToBall < 1.2) {
        const lookDirX = -Math.sin(player.rotation.y);
        const lookDirZ = -Math.cos(player.rotation.y);
        
        // Đẩy quả bóng đi trước mặt nhân vật theo đúng hướng mặt đang quay
        ball.position.x = player.position.x + lookDirX * 1.2;
        ball.position.z = player.position.z + lookDirZ * 1.2;
    }

    // Cập nhật gia tốc bóng khi được sút đi
    ball.position.x += ballVelocity.x;
    ball.position.z += ballVelocity.z;

    // Lực ma sát của mặt sân làm bóng lăn chậm dần
    ballVelocity.x *= 0.95;
    ballVelocity.z *= 0.95;

    // Khóa bóng không cho bay ra khỏi vạch biên sân
    ball.position.x = Math.max(-19.5, Math.min(19.5, ball.position.x));
    ball.position.z = Math.max(-34.5, Math.min(34.5, ball.position.z));

    // --- CẬP NHẬT CAMERA XOAY 360° QUANH NGƯỜI CHƠI ---
    const cameraDistance = 15; // Khoảng cách lý tưởng từ camera tới cầu thủ
    camera.position.x = player.position.x + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
    camera.position.y = player.position.y + cameraDistance * Math.sin(pitch);
    camera.position.z = player.position.z + cameraDistance * Math.cos(yaw) * Math.cos(pitch);
    camera.lookAt(player.position);

    // Gửi tọa độ và góc quay Y (hướng nhìn) lên Render Server để đồng bộ
    if (isMoving || keys.g) {
        socket.emit('playerMovement', {
            x: player.position.x,
            z: player.position.z,
            isFlow: isFlowActive,
            rotY: player.rotation.y
        });
    }

    renderer.render(scene, camera);
}
animate();

// Co giãn khung hình mượt mà
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
