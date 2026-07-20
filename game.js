// ==========================================
// KÚC 1: KHỞI TẠO KẾT NỐI MẠNG (SOCKET.IO)
// ==========================================
const socket = io(); // Để trống để tự nhận link Render khi online
const otherPlayers = {}; // Danh sách quản lý các đối thủ trên sân

// ==========================================
// KHÚC 2: CÀI ĐẶT THẾ GIỚI 3D (THREE.JS)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070a); // Màu nền tối huyền bí

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Thêm ánh sáng cho sân bóng rực rỡ
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Tạo sân cỏ đá banh Blue Lock cơ bản
const fieldGeo = new THREE.PlaneGeometry(60, 40);
const fieldMat = new THREE.MeshBasicMaterial({ color: 0x1e5631, side: THREE.DoubleSide });
const field = new THREE.Mesh(fieldGeo, fieldMat);
field.rotation.x = -Math.PI / 2; // Nằm phẳng ra sàn
scene.add(field);

// ==========================================
// KHÚC 3: TẠO NHÂN VẬT PHE TA (ÁO XANH)
// ==========================================
const player = new THREE.Group();

// 1. Phần Thân (Mặc áo đấu Blue Lock màu xanh dương)
const bodyGeo = new THREE.BoxGeometry(1, 1.4, 0.6);
const bodyMat = new THREE.MeshBasicMaterial({ color: 0x0055ff }); 
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.position.y = 0.7;
player.add(bodyMesh);

// 2. Phần Đầu
const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
const headMat = new THREE.MeshBasicMaterial({ color: 0xffdbac });
const headMesh = new THREE.Mesh(headGeo, headMat);
headMesh.position.y = 1.6;
player.add(headMesh);

// 3. Phần Tóc (Đặt tên 'hair' để lát nữa đối thủ nhận diện clone)
const hairGeo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
const hairMat = new THREE.MeshBasicMaterial({ color: 0x222222 }); // Tóc đen mặc định của bro
const hairMesh = new THREE.Mesh(hairGeo, hairMat);
hairMesh.position.set(0, 1.9, 0);
hairMesh.name = "hair"; // <--- QUAN TRỌNG: Tên định danh để đổi tóc
player.add(hairMesh);

// Thả nhân vật của bro vào sân
scene.add(player);

// Đặt camera nhìn từ trên xuống sau lưng nhân vật
camera.position.set(0, 5, 8);
camera.lookAt(player.position);

// ==========================================
// KHÚC 4: HỆ THỐNG ĐIỀU KHIỂN BÀN PHÍM (W, A, S, D)
// ==========================================
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// ==========================================
// KHÚC 5: XỬ LÝ ĐỒNG BỘ MẠNG & THAY ĐỔI TÓC ĐỐI THỦ
// ==========================================

// Hàm vẽ đối thủ: Copy 100% cơ thể của bro nhưng lột xác kiểu tóc
function spawnOpponent(playerInfo) {
    // Lệnh thần thánh: Sao chép nguyên bản nhân vật 'player' của bro
    const opponentMesh = player.clone(); 

    // Duyệt qua các bộ phận để tìm cục tóc 'hair' đã đặt tên ở trên
    opponentMesh.traverse((child) => {
        if (child.name && child.name === "hair") {
            // ĐỔI KIỂU TÓC: Biến thành hình nón vuốt nhọn phong cách siêu tiền đạo Barou
            child.geometry = new THREE.ConeGeometry(0.3, 0.7, 4); 
            
            // ĐỔI MÀU TÓC: Đổi sang màu đỏ cam rực lửa để phân biệt địch - ta
            child.material = new THREE.MeshBasicMaterial({ color: 0xff3300 });
            
            // Căn chỉnh lại vị trí quả đầu vuốt nhọn cho chuẩn tỉ lệ
            child.position.set(0, 2.0, 0);
        }
    });

    // Đặt đối thủ vào vị trí tọa độ mà server gửi về
    opponentMesh.position.set(playerInfo.x, playerInfo.y, playerInfo.z);
    scene.add(opponentMesh);

    return opponentMesh;
}

// Lắng nghe Server: Khi vừa vào sân, vẽ toàn bộ những ai đang online
socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
        if (id !== socket.id && !otherPlayers[id]) {
            otherPlayers[id] = spawnOpponent(players[id]);
        }
    });
});

// Lắng nghe Server: Khi có người chơi mới bấm link nhảy vào trận
socket.on('newPlayer', (data) => {
    if (!otherPlayers[data.id]) {
        otherPlayers[data.id] = spawnOpponent(data.playerInfo);
    }
});

// Lắng nghe Server: Cập nhật vị trí mượt mà khi máy đối thủ di chuyển
socket.on('playerMoved', (data) => {
    if (otherPlayers[data.id]) {
        otherPlayers[data.id].position.set(data.position.x, data.position.y, data.position.z);
    }
});

// Lắng nghe Server: Xóa cầu thủ đối phương khỏi sân nếu họ thoát game
socket.on('playerDisconnected', (id) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});

// ==========================================
// KHÚC 6: VÒNG LẶP GAME (ANIMATE LOOP)
// ==========================================
const movespeed = 0.15; // Tốc độ chạy của cầu thủ

function animate() {
    requestAnimationFrame(animate);

    // Logic di chuyển nhân vật chính dựa trên nút bấm
    if (keys.w) player.position.z -= movespeed;
    if (keys.s) player.position.z += movespeed;
    if (keys.a) player.position.x -= movespeed;
    if (keys.d) player.position.x += movespeed;

    // Bắt Camera di chuyển mượt mà bám sát theo nhân vật phe ta
    camera.position.set(player.position.x, player.position.y + 5, player.position.z + 8);
    camera.lookAt(player.position);

    // 🔥 DÒNG QUAN TRỌNG NHẤT: Bắn tọa độ hiện tại của bro lên mạng liên tục để máy khác nhìn thấy
    if (player && player.position) {
        socket.emit('playerMovement', { 
            x: player.position.x, 
            y: player.position.y, 
            z: player.position.z 
        });
    }

    renderer.render(scene, camera);
}

// Bật vòng lặp chạy game
animate();

// Tự động co giãn màn hình tương thích cho cả máy tính lẫn điện thoại
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
