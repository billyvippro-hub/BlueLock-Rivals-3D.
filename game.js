// 1. SETUP VŨ TRỤ 3D (Scene, Camera, Renderer)
const scene = new THREE.Scene(); 
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. LÀM CÁI SÂN CỎ
const fieldGeometry = new THREE.PlaneGeometry(50, 50);
const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x2e8b57, side: THREE.DoubleSide });
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = Math.PI / 2;
scene.add(field);

// 3. TẠO "TIỀN ĐẠO CỤC GẠCH"
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Mặc định áo đỏ
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;
scene.add(player);

camera.position.set(0, 5, 10);
camera.lookAt(player.position);

// 4. BỘ NHỚ DI CHUYỂN & KỸ NĂNG (Thêm Shift và G)
const keys = { w: false, a: false, s: false, d: false, shift: false };
let isFlowActive = false; // Biến ghi nhớ xem có đang bật hack Flow không

// Nghe lóng xem đang bấm phím gì xuống
document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    
    // Nếu bấm Shift (event.key của Shift là 'Shift', toLowerCase thành 'shift')
    if (keys.hasOwnProperty(key)) keys[key] = true;

    // Kích hoạt trạng thái Flow (Bấm G để Bật/Tắt)
    if (key === 'g') {
        isFlowActive = !isFlowActive; // Đảo ngược trạng thái: Đang tắt thì bật, đang bật thì tắt
        
        if (isFlowActive) {
            // Đổi màu cục gạch thành Xanh Dạ Quang (Hào quang Isagi)
            player.material.color.setHex(0x00ffff);
            console.log("🔥 ĐÃ THỨC TỈNH FLOW: CÁI TÔI BÙNG NỔ! 🔥");
        } else {
            // Tắt Flow thì về lại màu đỏ cùi bắp
            player.material.color.setHex(0xff0000);
            console.log("Nhả Flow: Về lại làm người bình thường...");
        }
    }
});

// Nghe lóng xem vừa nhả phím gì ra
document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// 5. VÒNG LẶP THỜI GIAN (Game Loop)
function animate() {
    requestAnimationFrame(animate);

    // Tính toán tốc độ: 
    // Mặc định đi bộ = 0.1
    // Giữ Shift (Chạy Sprint) = 0.2
    // Bật Flow = 0.3 (Nhanh như điện)
    let speed = 0.1; 
    if (keys.shift) speed = 0.2; 
    if (isFlowActive) speed = 0.3; // Chạy đè lên cả Shift nếu đang có Flow

    // Logic di chuyển
    if (keys.w) player.position.z -= speed; 
    if (keys.s) player.position.z += speed; 
    if (keys.a) player.position.x -= speed; 
    if (keys.d) player.position.x += speed; 

    // Bắt camera chạy theo đuôi cục gạch (Meta-Vision cơ bản)
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10; 
    camera.lookAt(player.position);

    renderer.render(scene, camera); 
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
