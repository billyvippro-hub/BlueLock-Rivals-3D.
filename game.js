// KẾT NỐI SERVER
const socket = io('https://bluelock-rivals-3d.onrender.com/'); // ĐỪNG QUÊN THAY LINK RENDER VÀO ĐÂY

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- HÀM TẠO CẦU THỦ (Body R3 - Nhìn đỡ ngáo hơn) ---
function createPlayerBody(color) {
    const group = new THREE.Group();
    // Thân
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), new THREE.MeshBasicMaterial({ color: color }));
    group.add(body);
    // Đầu
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ color: 0xffcc99 }));
    head.position.y = 0.8;
    group.add(head);
    return group;
}

// --- DỰNG KHUNG THÀNH ---
function createGoal(x, z, rotation) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // Cột dọc 2 bên
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), material);
    leftPost.position.set(-2, 1.5, 0);
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), material);
    rightPost.position.set(2, 1.5, 0);
    // Xà ngang
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 0.2), material);
    topBar.position.set(0, 3, 0);
    group.add(leftPost, rightPost, topBar);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
}

createGoal(0, -25, 0); // Khung thành 1
createGoal(0, 25, 0);  // Khung thành 2

// Khởi tạo cầu thủ mình
const player = createPlayerBody(0x0000ff);
scene.add(player);

// ... (Giữ nguyên các logic kết nối socket và vòng lặp animate như cũ) ...
// NHƯNG CHỖ HÀM addOtherPlayer thì đổi thành:
function addOtherPlayer(id, info) {
    const mesh = createPlayerBody(info.color.replace('#', '0x'));
    mesh.position.set(info.x, 0, info.z);
    scene.add(mesh);
    otherPlayers[id] = mesh;
}
