// 1. SETUP VŨ TRỤ 3D (Scene, Camera, Renderer)
const scene = new THREE.Scene(); 
// Camera như con mắt của người chơi. Góc nhìn 75 độ, tỷ lệ màn hình, khoảng cách nhìn gần/xa
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias để chống răng cưa cho mượt

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Quăng cái màn hình 3D lên web

// 2. LÀM CÁI SÂN CỎ THẬT XỊN (Màu xanh lá)
const fieldGeometry = new THREE.PlaneGeometry(50, 50); // Sân rộng 50x50
const fieldMaterial = new THREE.MeshBasicMaterial({ color: 0x2e8b57, side: THREE.DoubleSide });
const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.rotation.x = Math.PI / 2; // Lật ngang cái sân ra cho nó nằm trên mặt đất
scene.add(field);

// 3. TẠO "TIỀN ĐẠO CỤC GẠCH" (Nhân vật của tụi mình)
// Sau này mình sẽ thay cục gạch này bằng model R15 hoặc Anime siêu ngầu
const playerGeometry = new THREE.BoxGeometry(1, 2, 1); // Rộng 1, Cao 2, Dày 1
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Cho mặc áo đỏ cho máu
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; // Nâng nó lên tí để không bị lún xuống mặt cỏ
scene.add(player);

// Đặt camera hơi chếch lên trên và lùi ra sau để nhìn thấy thằng Tiền đạo
camera.position.set(0, 5, 10);
camera.lookAt(player.position); // Luôn nhìn chằm chằm vào cục gạch

// 4. BỘ NHỚ DI CHUYỂN (Ghi nhận ông đang bấm nút gì)
const keys = { w: false, a: false, s: false, d: false };

// Nghe lóng xem ní đang bấm phím gì xuống
document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

// Nghe lóng xem ní vừa nhả phím gì ra
document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// 5. VÒNG LẶP THỜI GIAN (Game Loop - Chạy liên tục để update khung hình)
function animate() {
    requestAnimationFrame(animate);

    // Tốc độ chạy của cục gạch (Tạm gọi là chưa bật Flow nha)
    const speed = 0.1;

    // Logic di chuyển: Bấm phím nào thì trừ/cộng tọa độ phím đó
    if (keys.w) player.position.z -= speed; // Đi tới
    if (keys.s) player.position.z += speed; // Đi lùi
    if (keys.a) player.position.x -= speed; // Sang trái
    if (keys.d) player.position.x += speed; // Sang phải

    // Bắt camera chạy theo đuôi cục gạch (Góc nhìn thứ 3)
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10; // Giữ khoảng cách lùi 10 bước

    renderer.render(scene, camera); // Bấm máy chụp hình!
}

// Gọi hàm animate lần đầu để kích hoạt vũ trụ
animate();

// Xử lý khi ní lỡ tay kéo giãn cửa sổ trình duyệt thì game không bị méo
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
