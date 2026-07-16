// ==========================================
// ĐẠI DỰ ÁN BLUE LOCK RIVALS 3D - BẢN HOÀN THIỆN LEGO & LOBBY
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    // 1. TẠO GIAO DIỆN LOBBY (SẢNH CHỜ CHỌN NHÂN VẬT)
    const lobbyDiv = document.createElement('div');
    lobbyDiv.id = 'lobby';
    lobbyDiv.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
        background: linear-gradient(135deg, #1B4F72, #000000);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: 'Arial', sans-serif; z-index: 1000;
    `;
    lobbyDiv.innerHTML = `
        <h1 style="font-size: 40px; text-shadow: 2px 2px 5px #00ffff; color: #00ffff;">BLUE LOCK RIVALS</h1>
        <p style="margin-bottom: 30px; font-size: 18px;">Chọn Egoist của bạn để bước vào Lam Ngục</p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <button class="ego-btn" onclick="startGame('isagi')">Yoichi Isagi</button>
            <button class="ego-btn" onclick="startGame('bachira')">Meguru Bachira</button>
            <button class="ego-btn" onclick="startGame('nagi')">Seishiro Nagi</button>
            <button class="ego-btn" onclick="startGame('rin')">Rin Itoshi</button>
            <button class="ego-btn" onclick="startGame('chigiri')">Hyoma Chigiri</button>
            <button class="ego-btn" onclick="startGame('barou')">Shoei Barou</button>
            <button class="ego-btn" onclick="startGame('kaiser')" style="border-color: gold; color: gold;">Michael Kaiser</button>
        </div>
        <style>
            .ego-btn {
                padding: 15px 20px; font-size: 16px; font-weight: bold; background: #2C3E50;
                color: white; border: 2px solid #3498DB; border-radius: 8px; cursor: pointer;
                transition: 0.3s;
            }
            .ego-btn:hover { background: #3498DB; transform: scale(1.1); box-shadow: 0 0 15px #3498DB; }
        </style>
    `;
    document.body.appendChild(lobbyDiv);

    // Biến toàn cục
    let scene, camera, renderer, socket, player, ball;
    let otherPlayers = {};
    let myStyle = 'isagi';
    let isFlowActive = false;
    let yaw = 0, pitch = 0.5;
    let ballVelocity = { x: 0, z: 0 };
    const keys = { w: false, a: false, s: false, d: false, shift: false };
    
    // Đưa hàm startGame ra ngoài window để button HTML gọi được
    window.startGame = function(selectedStyle) {
        myStyle = selectedStyle;
        document.body.removeChild(lobbyDiv); // Xóa Lobby đi
        initGame(); // Khởi động môi trường 3D
    };

    // ==========================================
    // 2. KHỞI TẠO MÔI TRƯỜNG GAME VÀ MULTIPLAYER
    // ==========================================
    function initGame() {
        // --- MULTIPLAYER SETUP ---
        if (typeof io !== 'undefined') {
            socket = io('https://bluelock-rivals-3d.onrender.com/'); // 🔴 NHỚ THAY LINK RENDER VÀO ĐÂY!
        } else {
            socket = { on: () => {}, emit: () => {} }; // Chế độ chơi đơn (Offline) an toàn
        }

        // --- THREE.JS SETUP ---
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Bảng UI hướng dẫn
        const uiDiv = document.createElement('div');
        uiDiv.id = 'ui';
        uiDiv.style.cssText = 'position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.6); padding: 10px; font-family: monospace; border-radius: 5px; z-index: 10;';
        uiDiv.innerHTML = `
            <b>[ĐIỀU KHIỂN: ${myStyle.toUpperCase()}]</b><br>
            • Click màn hình: Khóa xoay chuột<br>
            • W A S D: Di chuyển | Shift: Sprint<br>
            • G: Flow Awakening | M1: Sút bóng
        `;
        document.body.appendChild(uiDiv);

        // --- MÔI TRƯỜNG & SÂN BÓNG ---
        const bgField = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ color: 0x145A32, side: THREE.DoubleSide }));
        bgField.rotation.x = Math.PI / 2; bgField.position.y = -0.1; scene.add(bgField);

        const pitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 70), new THREE.MeshBasicMaterial({ color: 0xD6DBDF, side: THREE.DoubleSide }));
        pitchMesh.rotation.x = Math.PI / 2; scene.add(pitchMesh);

        function createGoal(x, z, rot) {
            const grp = new THREE.Group();
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const lp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.2), mat); lp.position.set(-4, 1.75, 0);
            const rp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 0.2), mat); rp.position.set(4, 1.75, 0);
            const tb = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 0.2), mat); tb.position.set(0, 3.5, 0);
            grp.add(lp, rp, tb); grp.position.set(x, 0, z); grp.rotation.y = rot; scene.add(grp);
        }
        createGoal(0, -32, 0); createGoal(0, 32, Math.PI);

        ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        ball.position.set(0, 0.5, 0); scene.add(ball);

        // --- TẠO NHÂN VẬT CHÍNH ---
        player = createLegoPlayer(myStyle, isFlowActive);
        scene.add(player);

        // --- ĐĂNG KÝ SỰ KIỆN CHUỘT & BÀN PHÍM ---
        renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === renderer.domElement) {
                yaw -= e.movementX * 0.0025; pitch -= e.movementY * 0.0025;
                pitch = Math.max(0.15, Math.min(Math.PI / 2.2, pitch));
            }
        });

        document.addEventListener('keydown', (e) => {
            let key = e.key.toLowerCase();
            if (keys.hasOwnProperty(key)) keys[key] = true;
            if (key === 'g') {
                isFlowActive = !isFlowActive;
                const oldPos = player.position.clone();
                const oldRot = player.rotation.y;
                scene.remove(player);
                player = createLegoPlayer(myStyle, isFlowActive);
                player.position.copy(oldPos); player.rotation.y = oldRot;
                scene.add(player);
            }
        });
        document.addEventListener('keyup', (e) => {
            let key = e.key.toLowerCase(); if (keys.hasOwnProperty(key)) keys[key] = false;
        });
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
                if (player.position.distanceTo(ball.position) < 1.8) { 
                    let pwr = isFlowActive ? 1.6 : 0.85;
                    ballVelocity.x = -Math.sin(player.rotation.y) * pwr;
                    ballVelocity.z = -Math.cos(player.rotation.y) * pwr;
                }
            }
        });

        // --- SOCKET SYNC ---
        socket.emit('newPlayer', { style: myStyle }); // Gửi style cho server biết
        socket.on('currentPlayers', (players) => {
            for (let id in players) {
                if (socket.id && id === socket.id) continue;
                addOtherPlayer(id, players[id]);
            }
        });
        socket.on('newPlayer', (data) => { addOtherPlayer(data.playerId, data.playerInfo); });
        socket.on('playerMoved', (data) => {
            if (otherPlayers[data.playerId]) {
                otherPlayers[data.playerId].position.set(data.playerInfo.x || 0, 0, data.playerInfo.z || 0);
                if (data.playerInfo.rotY !== undefined) otherPlayers[data.playerId].rotation.y = data.playerInfo.rotY;
            }
        });
        socket.on('playerDisconnected', (id) => {
            if (otherPlayers[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }
        });

        // Khởi động Game Loop
        animate();
    }

    function addOtherPlayer(id, info) {
        if (otherPlayers[id]) scene.remove(otherPlayers[id]);
        const mesh = createLegoPlayer(info.style || 'isagi', info.isFlow); // Render đúng style đối thủ
        mesh.position.set(info.x || 0, 0, info.z || 0);
        scene.add(mesh);
        otherPlayers[id] = mesh;
    }

    // ==========================================
    // 3. HỆ THỐNG XÂY DỰNG CƠ THỂ LEGO & TÓC NHÂN VẬT
    // ==========================================
    function createLegoPlayer(styleName, isFlow) {
        const pGroup = new THREE.Group();
        const skinColor = 0xFAD7A1;
        const jerseyBlue = 0x3498DB;
        const shortDarkBlue = 0x1B4F72;
        const innerBlack = 0x111111;
        
        // 1 khối Thân (Chữ nhật đứng)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), new THREE.MeshBasicMaterial({ color: jerseyBlue }));
        torso.position.y = 1.4; pGroup.add(torso);

        // 2 khối Chân (Vuông vức, chiều rộng = sâu)
        const legGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
        const legMat = new THREE.MeshBasicMaterial({ color: shortDarkBlue });
        const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.2, 0.6, 0); pGroup.add(legL);
        const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(0.2, 0.6, 0); pGroup.add(legR);

        // 2 khối Tay (Vuông vức, tay ép sát thân)
        const armGeo = new THREE.BoxGeometry(0.3, 1.1, 0.3);
        const armMat = new THREE.MeshBasicMaterial({ color: innerBlack }); // Mặc áo bó đen bên trong
        const armL = new THREE.Mesh(armGeo, armMat); armL.position.set(-0.55, 1.4, 0); pGroup.add(armL);
        const armR = new THREE.Mesh(armGeo, armMat); armR.position.set(0.55, 1.4, 0); pGroup.add(armR);

        // Đầu (Hình trụ nhỏ như Lego)
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 16), new THREE.MeshBasicMaterial({ color: skinColor }));
        head.position.y = 2.275; pGroup.add(head);

        // --- ĐỘI TÓC CHO TỪNG NHÂN VẬT ---
        const hairGroup = new THREE.Group();
        let hairMat = new THREE.MeshBasicMaterial({ color: isFlow ? 0x00ffff : 0x222222 }); // Mặc định đen
        
        switch(styleName) {
            case 'isagi': // Tóc xanh đen xéo
                hairMat.color.setHex(isFlow ? 0x00ffff : 0x1A252C);
                const isagiHair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.25, 0.65), hairMat);
                isagiHair.position.y = 0.3; hairGroup.add(isagiHair);
                break;
            case 'bachira': // Tóc Undercut vàng đen (Blocky)
                const bTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), new THREE.MeshBasicMaterial({ color: isFlow? 0x00ffff : 0x111111 }));
                const bBot = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.75), new THREE.MeshBasicMaterial({ color: isFlow? 0x00ffff : 0xF1C40F })); // Vàng
                bTop.position.y = 0.3; bBot.position.y = 0.15; hairGroup.add(bTop, bBot);
                break;
            case 'nagi': // Tóc trắng xù
                hairMat.color.setHex(isFlow ? 0x00ffff : 0xEEEEEE);
                const nagiHair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 0.75), hairMat);
                nagiHair.position.y = 0.35; nagiHair.rotation.y = Math.PI / 4; hairGroup.add(nagiHair);
                break;
            case 'rin': // Xanh đen vuốt nhọn (Gắn nón chóp)
                hairMat.color.setHex(isFlow ? 0x00ffff : 0x113333);
                const rinHair = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.5, 4), hairMat);
                rinHair.position.y = 0.4; hairGroup.add(rinHair);
                break;
            case 'barou': // Đen vuốt ngược
                hairMat.color.setHex(isFlow ? 0xff0000 : 0x111111); // Flow Barou màu đỏ
                const barouHair = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), hairMat);
                barouHair.position.set(0, 0.45, -0.1); barouHair.rotation.x = -0.2; hairGroup.add(barouHair);
                break;
            case 'chigiri': // Tóc đỏ dài
                hairMat.color.setHex(isFlow ? 0xffaaaa : 0xCB4335);
                const cTop = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.65), hairMat); cTop.position.y = 0.3;
                const cBraid = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), hairMat); cBraid.position.set(0.2, -0.1, -0.2); // Tóc tết sau
                hairGroup.add(cTop, cBraid);
                break;
            case 'kaiser': // Kaiser Limited Style (Vàng + vệt xanh)
                torso.material.color.setHex(0xFFD700); // Áo vàng giới hạn
                hairMat.color.setHex(isFlow ? 0xff00ff : 0xF1C40F);
                const kTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), hairMat); kTop.position.y = 0.3;
                const kTail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.15), new THREE.MeshBasicMaterial({ color: 0x3498DB })); // Đuôi xanh
                kTail.position.set(0, -0.1, -0.3); hairGroup.add(kTop, kTail);
                break;
        }
        head.add(hairGroup); // Gắn cụm tóc vào cái đầu trụ
        return pGroup;
    }

    // ==========================================
    // 4. GAME LOOP & VẬT LÝ
    // ==========================================
    function animate() {
        requestAnimationFrame(animate);

        let speed = keys.shift ? 0.22 : 0.14; 
        if (isFlowActive) speed = 0.32; 

        const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);

        let moveX = 0, moveZ = 0;
        if (keys.w) { moveX += forwardX; moveZ += forwardZ; }
        if (keys.s) { moveX -= forwardX; moveZ -= forwardZ; }
        if (keys.a) { moveX -= rightX; moveZ -= rightZ; }
        if (keys.d) { moveX += rightX; moveZ += rightZ; }

        let length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        let isMoving = false;

        if (length > 0 && !isNaN(length)) {
            player.position.x += (moveX / length) * speed;
            player.position.z += (moveZ / length) * speed;
            player.rotation.y = yaw; 
            isMoving = true;
        }

        player.position.x = Math.max(-19.5, Math.min(19.5, player.position.x));
        player.position.z = Math.max(-34.5, Math.min(34.5, player.position.z));

        // Rê bóng
        if (player.position.distanceTo(ball.position) < 1.2) {
            ball.position.x = player.position.x + -Math.sin(player.rotation.y) * 1.2;
            ball.position.z = player.position.z + -Math.cos(player.rotation.y) * 1.2;
        }

        ball.position.x += ballVelocity.x; ball.position.z += ballVelocity.z;
        ballVelocity.x *= 0.95; ballVelocity.z *= 0.95;
        ball.position.x = Math.max(-19.5, Math.min(19.5, ball.position.x));
        ball.position.z = Math.max(-34.5, Math.min(34.5, ball.position.z));

        // Camera Update
        let camX = player.position.x + 15 * Math.sin(yaw) * Math.cos(pitch);
        let camY = player.position.y + 15 * Math.sin(pitch);
        let camZ = player.position.z + 15 * Math.cos(yaw) * Math.cos(pitch);
        if (!isNaN(camX)) camera.position.set(camX, camY, camZ);
        camera.lookAt(player.position);

        if (typeof io !== 'undefined' && (isMoving || keys.g)) {
            socket.emit('playerMovement', { x: player.position.x, z: player.position.z, isFlow: isFlowActive, rotY: player.rotation.y, style: myStyle });
        }
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        if(camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
});
