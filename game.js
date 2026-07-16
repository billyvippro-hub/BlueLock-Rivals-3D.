// Đảm bảo game chỉ chạy KHI VÀ CHỈ KHI trình duyệt đã dựng xong giao diện (Tránh lỗi document.body bị null)
window.addEventListener('DOMContentLoaded', () => {
    console.log("🎮 Game đang khởi tạo hệ thống...");

    // ==========================================
    // 1. KẾT NỐI MULTIPLAYER (CƠ CHẾ TỰ ĐỘNG CHẠY OFFLINE NẾU LỖI)
    // ==========================================
    let socket;
    if (typeof io !== 'undefined') {
        // 🔴 CHÚ Ý: Khi nào server Render hoạt động, hãy thay link thật của bro vào đây!
        socket = io('https://bluelock-rivals-3d.onrender.com/'); 
        console.log("🔌 Đã kết nối thư viện Socket.io mạng lưới.");
    } else {
        console.warn("⚠️ Không tìm thấy Socket.io hoặc lỗi link! Game tự động chuyển sang chế độ CHƠI ĐƠN (Offline) bảo mật.");
        // Tạo một object ảo (Mock) để các hàm socket phía dưới không bị lỗi crash game
        socket = {
            on: function(event, callback) { console.log(`[Offline Mode] Đang chặn sự kiện: ${event}`); },
            emit: function(event, data) { }
        };
    }

    // Cập nhật bảng hướng dẫn UI ngoài màn hình cho xịn sò
    const uiDiv = document.getElementById('ui');
    if (uiDiv) {
        uiDiv.innerHTML = `
            <b>[CƠ CHẾ ĐIỀU KHIỂN CHUYÊN NGHIỆP - FIXED]</b><br>
            • <b>Click vào màn hình</b> để khóa chuột xoay 360° (Shiftlock)<br>
            • Di chuột tự do để xoay camera xung quanh nhân vật<br>
            • W A S D: Chạy theo đúng hướng camera đang nhìn<br>
            • Shift: Nước rút tốc độ (Sprint)<br>
            • G: Thức tỉnh (Flow - Đầu phát sáng Cyan + Tăng max chỉ số)<br>
            • Click Chuột Trái (M1): Sút bóng mạnh mẽ theo hướng nhìn<br>
            • Nhấn phím <b>ESC</b> để mở khóa con trỏ chuột
        `;
    }

    // ==========================================
    // 2. SETUP VŨ TRỤ 3D & CANVAS
    // ==========================================
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Kiểm tra an toàn trước khi chèn màn hình game vào body
    if (document.body) {
        document.body.appendChild(renderer.domElement);
    } else {
        console.error("❌ Chí mạng: Không tìm thấy thẻ <body> của trang web!");
        return;
    }

    // ==========================================
    // 3. ĐIỀU KHIỂN CHUỘT 360 ĐỘ (Pointer Lock)
    // ==========================================
    let yaw = 0;     // Góc xoay ngang
    let pitch = 0.5; // Góc xoay dọc mặc định vừa tầm mắt

    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= event.movementX * 0.0025;   // Tốc độ nhạy xoay chuột trái/phải
            pitch -= event.movementY * 0.0025; // Tốc độ nhạy xoay chuột lên/xuống
            
            // Giới hạn góc nhìn dọc (không cho camera cắm xuống đất hoặc ngửa quá đà)
            pitch = Math.max(0.15, Math.min(Math.PI / 2.2, pitch));
        }
    });

    // ==========================================
    // 4. MÔI TRƯỜNG CỎ NỀN & SÂN ĐẤU XÁM TRẮNG
    // ==========================================
    // Nền đất xanh lá cây đậm ở xa đường chân trời
    const bgGeo = new THREE.PlaneGeometry(500, 500);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x145A32, side: THREE.DoubleSide });
    const bgField = new THREE.Mesh(bgGeo, bgMat);
    bgField.rotation.x = Math.PI / 2;
    bgField.position.y = -0.1; // Nằm hơi thấp hơn sân chính
    scene.add(bgField);

    // Mặt sân thi đấu chính (Màu trắng xám flat-shading cổ điển)
    const pitchGeo = new THREE.PlaneGeometry(40, 70);
    const pitchMat = new THREE.MeshBasicMaterial({ color: 0xD6DBDF, side: THREE.DoubleSide });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = Math.PI / 2;
    scene.add(pitchMesh);

    // Dựng 2 khung thành vuông vức màu trắng ở 2 đầu sân
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

    // Quả bóng dạng Voxel khối vuông đồng bộ phong cách
    const ballGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 0.3, 0);
    scene.add(ball);

    let ballVelocity = { x: 0, z: 0 };

    // ==========================================
    // 5. HÀM KHỞI TẠO NHÂN VẬT VOXEL PHÂN CẤP TỶ LỆ CHUẨN ĐẸP
    // ==========================================
    function createVoxelPlayer(isFlow = false) {
        const pGroup = new THREE.Group();

        // Palette màu chuẩn chỉ theo yêu cầu thiết kế của bro
        const headColor = isFlow ? 0x00ffff : 0x2C3E50;  // Bình thường: Xanh đen xám | Flow: Hào quang xanh rực rỡ
        const torsoColor = 0x4682B4;                     // Thân trên: Xanh dương Denim (Blue Jeans)
        const beltColor = 0x111111;                      // Vạch ngang thắt lưng đen ở giữa
        const legsColor = 0x2E5B88;                      // Thân dưới/Chân: Xanh dương đồng bộ

        // Chân (Legs)
        const legsGeo = new THREE.BoxGeometry(0.7, 0.8, 0.4);
        const legsMat = new THREE.MeshBasicMaterial({ color: legsColor });
        const legs = new THREE.Mesh(legsGeo, legsMat);
        legs.position.y = 0.4;
        pGroup.add(legs);

        // Thắt lưng đen (Belt)
        const beltGeo = new THREE.BoxGeometry(0.72, 0.15, 0.42); 
        const beltMat = new THREE.MeshBasicMaterial({ color: beltColor });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.y = 0.875;
        pGroup.add(belt);

        // Thân trên thon dài (Torso)
        const torsoGeo = new THREE.BoxGeometry(0.7, 1.1, 0.4);
        const torsoMat = new THREE.MeshBasicMaterial({ color: torsoColor });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 1.5;
        pGroup.add(torso);

        // Đầu (Head)
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshBasicMaterial({ color: headColor });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.3;
        pGroup.add(head);

        return pGroup;
    }

    let player = createVoxelPlayer(false);
    scene.add(player);

    const otherPlayers = {}; 

    // ==========================================
    // 6. HỆ THỐNG DI CHUYỂN BÀN PHÍM & SÚT BÓNG M1
    // ==========================================
    const keys = { w: false, a: false, s: false, d: false, shift: false };
    let isFlowActive = false;

    document.addEventListener('keydown', (event) => {
        let key = event.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = true;

        if (key === 'g') {
            isFlowActive = !isFlowActive;
            const oldPos = player.position.clone();
            const oldRot = player.rotation.y;
            scene.remove(player);
            player = createVoxelPlayer(isFlowActive);
            player.position.copy(oldPos);
            player.rotation.y = oldRot;
            scene.add(player);
        }
    });

    document.addEventListener('keyup', (event) => {
        let key = event.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = false;
    });

    // Sút bóng theo hướng camera nhìn bằng chuột trái M1
    document.addEventListener('mousedown', (event) => {
        if (event.button === 0 && document.pointerLockElement === renderer.domElement) {
            let dist = player.position.distanceTo(ball.position);
            if (dist < 1.8) { 
                const shootDirX = -Math.sin(player.rotation.y);
                const shootDirZ = -Math.cos(player.rotation.y);

                let shootPower = isFlowActive ? 1.6 : 0.85;
                ballVelocity.x = shootDirX * shootPower;
                ballVelocity.z = shootDirZ * shootPower;
            }
        }
    });

    // MULTIPLAYER LISTENERS (AN TOÀN TUYỆT ĐỐI)
    socket.on('currentPlayers', (players) => {
        for (let id in players) {
            if (socket.id && id === socket.id) continue;
            addOtherPlayer(id, players[id]);
        }
    });
    socket.on('newPlayer', (data) => { addOtherPlayer(data.playerId, data.playerInfo); });
    
    function addOtherPlayer(id, info) {
        if (otherPlayers[id]) scene.remove(otherPlayers[id]);
        const mesh = createVoxelPlayer(info.isFlow);
        mesh.position.set(info.x || 0, 0, info.z || 0);
        scene.add(mesh);
        otherPlayers[id] = mesh;
    }
    
    socket.on('playerMoved', (data) => {
        if (otherPlayers[data.playerId]) {
            otherPlayers[data.playerId].position.x = data.playerInfo.x || 0;
            otherPlayers[data.playerId].position.z = data.playerInfo.z || 0;
            if (data.playerInfo.rotY !== undefined) {
                otherPlayers[data.playerId].rotation.y = data.playerInfo.rotY;
            }
        }
    });
    
    socket.on('playerDisconnected', (id) => {
        if (otherPlayers[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }
    });

    // ==========================================
    // 7. VÒNG LẶP THỜI GIAN (GAME LOOP & VẬT LÝ AN TOÀN)
    // ==========================================
    function animate() {
        requestAnimationFrame(animate);

        let speed = 0.14;
        if (keys.shift) speed = 0.22; 
        if (isFlowActive) speed = 0.32; 

        // Tính toán Vector di chuyển chuẩn theo góc nhìn Camera xoay Y (yaw)
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

        let length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        let isMoving = false;

        // KHÓA BẢO VỆ CHỐNG CHIA CHO 0 (NaN CRASH)
        if (length > 0 && !isNaN(length)) {
            moveX = (moveX / length) * speed;
            moveZ = (moveZ / length) * speed;

            player.position.x += moveX;
            player.position.z += moveZ;

            player.rotation.y = yaw; 
            isMoving = true;
        }

        // Khóa cầu thủ trong biên sân xám
        player.position.x = Math.max(-19.5, Math.min(19.5, player.position.x));
        player.position.z = Math.max(-34.5, Math.min(34.5, player.position.z));

        // VẬT LÝ RÊ BÓNG 360 ĐỘ (Đẩy nhẹ bóng đi trước mặt)
        let distToBall = player.position.distanceTo(ball.position);
        if (distToBall < 1.2) {
            const lookDirX = -Math.sin(player.rotation.y);
            const lookDirZ = -Math.cos(player.rotation.y);
            ball.position.x = player.position.x + lookDirX * 1.2;
            ball.position.z = player.position.z + lookDirZ * 1.2;
        }

        // Cập nhật gia tốc bóng khi được sút đi
        ball.position.x += ballVelocity.x;
        ball.position.z += ballVelocity.z;
        ballVelocity.x *= 0.95;
        ballVelocity.z *= 0.95;

        // Khóa bóng trong biên sân xám
        ball.position.x = Math.max(-19.5, Math.min(19.5, ball.position.x));
        ball.position.z = Math.max(-34.5, Math.min(34.5, ball.position.z));

        // TÍNH TOÁN VỊ TRÍ CAMERA XOAY 360 QUANH CẦU THỦ
        const cameraDistance = 15; 
        let camX = player.position.x + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
        let camY = player.position.y + cameraDistance * Math.sin(pitch);
        let camZ = player.position.z + cameraDistance * Math.cos(yaw) * Math.cos(pitch);

        // Bộ lọc chặn dữ liệu lỗi trước khi gán cho Camera
        if (!isNaN(camX) && !isNaN(camY) && !isNaN(camZ)) {
            camera.position.set(camX, camY, camZ);
        }
        camera.lookAt(player.position);

        // Chỉ đồng bộ lên server nếu có thư viện socket và nhân vật thực sự di chuyển
        if (typeof io !== 'undefined' && (isMoving || keys.g)) {
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

    // Co giãn màn hình mượt mà khi thay đổi kích thước trình duyệt
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
