// ============================================================================
// PROJECT: BLUE LOCK RIVALS (ROBLOX LOBBY RECREATION) - V2 WITH TELEPORT TERMINALS
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    // --- 1. DATA KỸ NĂNG & NGOẠI HÌNH CỦA CÁC TIỀN ĐẠO (EGOISTS) ---
    const EGOISTS = {
        isagi: { name: "Yoichi Isagi", rarity: "RARE (45%)", skill: "Metavision & Direct Shoot", stats: { speed: 84, shoot: 89, dribble: 80 }, color: 0x2471A3, hair: 'isagi' },
        bachira: { name: "Meguru Bachira", rarity: "RARE (45%)", skill: "Monstrous Giga-Dribble", stats: { speed: 90, shoot: 81, dribble: 98 }, color: 0xF1C40F, hair: 'bachira' },
        chigiri: { name: "Hyoma Chigiri", rarity: "RARE (45%)", skill: "No-Dribble Speed Sprint", stats: { speed: 99, shoot: 85, dribble: 88 }, color: 0xCB4335, hair: 'chigiri' },
        nagi: { name: "Seishiro Nagi", rarity: "EPIC (10%)", skill: "Two-Stage Fake Volley", stats: { speed: 85, shoot: 95, dribble: 89 }, color: 0xEEEEEE, hair: 'nagi' },
        rin: { name: "Rin Itoshi", rarity: "EPIC (10%)", skill: "Puppeteer / Berserker Flow", stats: { speed: 91, shoot: 97, dribble: 92 }, color: 0x113F3F, hair: 'rin' },
        kaiser: { name: "Michael Kaiser", rarity: "LEGENDARY (1%)", skill: "Kaiser Impact (Super Speed Shot)", stats: { speed: 92, shoot: 99, dribble: 91 }, color: 0xD4AC0D, hair: 'kaiser' }
    };

    let currentEgoistKey = 'isagi'; // Nhân vật mặc định ban đầu
    let userEgoTokens = 500;        // Tiền dùng để xoay Spin gacha

    // --- 2. TẠO GIAO DIỆN PHẲNG (UI HUD) CHO SẢNH ĐỢI ROBLOX ---
    const lobbyUI = document.createElement('div');
    lobbyUI.id = 'roblox-ui';
    lobbyUI.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none; font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
        color: white; z-index: 100; overflow: hidden;
    `;
    lobbyUI.innerHTML = `
        <div style="position: absolute; top: 20px; left: 20px; background: rgba(10, 15, 30, 0.85); padding: 15px; border-radius: 10px; border-left: 5px solid #00ffff; width: 260px; pointer-events: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <div style="font-size: 11px; color: #8892b0; letter-spacing: 2px; font-weight: bold;">CURRENT EGOIST</div>
            <div id="ui-char-name" style="font-size: 24px; font-weight: 900; color: #00ffff; text-shadow: 0 0 8px rgba(0,255,255,0.5); margin: 3px 0;">YOICHI ISAGI</div>
            <div id="ui-char-skill" style="font-size: 11px; color: #ffaa00; margin-bottom: 8px;">SKILL: Metavision & Direct Shoot</div>
            <div style="font-size: 12px; color: #ccc;">
                SPEED: <span id="ui-spd" style="color: #00ffff; font-weight:bold;">84</span> | 
                SHOOT: <span id="ui-sht" style="color: #e74c3c; font-weight:bold;">89</span> | 
                DRIBBLE: <span id="ui-drb" style="color: #f1c40f; font-weight:bold;">80</span>
            </div>
            <div style="margin-top: 10px; font-size: 13px; font-weight: bold; color: #2ecc71;">
                EGO TOKENS: <span id="ui-tokens">500</span> 🪙
            </div>
        </div>

        <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 12px 18px; border-radius: 8px; font-size: 12px; line-height: 1.6; border: 1px solid rgba(0,255,255,0.2);">
            🎮 <b>ĐIỀU KHIỂN CHUẨN ROBLOX:</b><br>
            • Click chuột vào màn hình để khóa góc nhìn Camera (Shiftlock).<br>
            • <b>W, A, S, D:</b> Di chuyển nhân vật Lego.<br>
            • <b>Phím SPACE:</b> Nhảy lên cao.<br>
            • <b>Chạy đến bệ vàng "SPIN":</b> Để xoay đổi nhân vật/kỹ năng.<br>
            • <b>Chạy đến Trụ máy màu xanh (MATCH TERMINAL):</b> Để kích hoạt Teleport vào trận 5v5.<br>
            • Chạy lại gần quả bóng ở sân mini giữa sảnh để rê bóng/sút bóng.
        </div>

        <div id="spin-modal" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); transition: 0.3s ease-in-out; background: radial-gradient(circle, #1a2536 0%, #0a0f1d 100%); width: 450px; padding: 30px; border-radius: 15px; border: 3px solid #f1c40f; text-align: center; pointer-events: auto; box-shadow: 0 0 30px rgba(241,196,15,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <h2 style="color: #f1c40f; margin: 0 0 5px 0; font-size: 28px; text-shadow: 0 0 10px rgba(241,196,15,0.5);">STYLE & SPIN WEAPON</h2>
            <p style="color: #8892b0; font-size: 12px; margin-bottom: 20px;">CHỌN LỐI CHƠI VÀ THỨC TỈNH CÁI TÔI CỦA BẠN</p>
            
            <div id="spin-display" style="width: 100%; background: #000; border: 2px solid #2c3e50; padding: 25px 0; border-radius: 10px; margin-bottom: 20px; overflow: hidden;">
                <div id="spin-result-name" style="font-size: 30px; font-weight: bold; color: #fff; letter-spacing: 2px;">YOICHI ISAGI</div>
                <div id="spin-result-rarity" style="font-size: 12px; color: #3498db; margin-top: 5px;">RARE (45%)</div>
            </div>

            <button id="btn-spin-roll" style="background: linear-gradient(135deg, #f1c40f 0%, #d4ac0d 100%); border: none; padding: 12px 40px; font-size: 18px; font-weight: bold; color: #000; border-radius: 30px; cursor: pointer; transition: 0.2s; box-shadow: 0 5px 15px rgba(241,196,15,0.4);">
                SPIN (100 TOKENS)
            </button>
            
            <button id="btn-close-spin" style="background: none; border: none; color: #7f8c8d; font-size: 13px; margin-top: 15px; cursor: pointer; text-decoration: underline;">Đóng (X)</button>
        </div>

        <div id="teleport-overlay" style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: #00ffff; opacity: 0; transition: opacity 0.5s ease; pointer-events: none; z-index: 999; display: flex; align-items: center; justify-content: center;">
            <div style="color: black; font-family: Impact, sans-serif; font-size: 60px; letter-spacing: 5px; text-shadow: 0 0 20px white;">TELEPORTING TO 5VS5...</div>
        </div>
    `;
    document.body.appendChild(lobbyUI);

    // --- 3. SET UP MÔI TRƯỜNG THREE.JS (3D ROBLOX LOBBY HUB) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x05070a, 0.025);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Ánh sáng môi trường
    const ambientLight = new THREE.AmbientLight(0x222530);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Đèn LED neon trang trí sảnh
    const neonBlue = new THREE.PointLight(0x00ffff, 1.8, 30);
    neonBlue.position.set(-15, 5, 0);
    scene.add(neonBlue);

    const neonMagenta = new THREE.PointLight(0xff00ff, 1.8, 30);
    neonMagenta.position.set(15, 5, 0);
    scene.add(neonMagenta);

    // ============================================================================
    // 4. KIẾN TRÚC SẢNH CHỜ 3D: THÉP, KÍNH & THẢM CỎ MINI (ROBLOX STYLE)
    // ============================================================================

    // Sàn sảnh chờ lớn (Bê tông màu xám sẫm phản chiếu ánh sáng)
    const lobbyFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.3, metalness: 0.8 })
    );
    lobbyFloor.rotation.x = -Math.PI / 2;
    scene.add(lobbyFloor);

    // BỨC TƯỜNG KÍNH KHỔNG LỒ QUÂY BAO QUANH SẢNH (Glass & Metal frames)
    function createGlassWall(width, height, x, z, rotationY) {
        const wallGroup = new THREE.Group();
        
        // Tấm kính trong suốt màu xanh dương
        const glassGeo = new THREE.PlaneGeometry(width, height);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x00a8ff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            roughness: 0.1,
            metalness: 0.9
        });
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        glassMesh.position.y = height / 2;
        wallGroup.add(glassMesh);

        // Khung sắt đen bo viền kính
        const frameGeo = new THREE.BoxGeometry(width, 0.2, 0.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.8 });
        const bottomFrame = new THREE.Mesh(frameGeo, frameMat);
        bottomFrame.position.y = 0.1;
        const topFrame = new THREE.Mesh(frameGeo, frameMat);
        topFrame.position.y = height;
        wallGroup.add(bottomFrame, topFrame);

        wallGroup.position.set(x, 0, z);
        wallGroup.rotation.y = rotationY;
        scene.add(wallGroup);
    }
    // Tạo 4 bức tường kính bao quanh sảnh chờ rộng (50x50)
    createGlassWall(50, 10, 0, -25, 0);          // Tường sau
    createGlassWall(50, 10, 0, 25, Math.PI);      // Tường trước
    createGlassWall(50, 10, -25, 0, Math.PI / 2);  // Tường trái
    createGlassWall(50, 10, 25, 0, -Math.PI / 2); // Tường phải

    // SÂN TẬP MINI TRONG SẢNH CHỜ (Practice Pitch in the center)
    const pitchWidth = 22, pitchHeight = 34;
    const grassGeo = new THREE.PlaneGeometry(pitchWidth, pitchHeight);
    const grassMat = new THREE.MeshStandardMaterial({ 
        map: createGrassTexture(), 
        roughness: 0.8 
    });
    const practicePitch = new THREE.Mesh(grassGeo, grassMat);
    practicePitch.rotation.x = -Math.PI / 2;
    practicePitch.position.set(0, 0.01, 0); // Hơi nổi lên trên sàn bê tông
    scene.add(practicePitch);

    // Vẽ vạch cỏ sọc dưa đậm nhạt
    function createGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 512;
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < 16; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#114F24' : '#166534';
            ctx.fillRect(0, i * 32, 256, 32);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 504);
        return new THREE.CanvasTexture(canvas);
    }

    // KHUNG THÀNH MINI Ở SÂN TẬP (Goalpost)
    function createMiniGoal(x, z, rot) {
        const goalGroup = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
        const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), metalMat); leftPost.position.set(-2.5, 1.25, 0);
        const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), metalMat); rightPost.position.set(2.5, 1.25, 0);
        const crossbar = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.15, 0.15), metalMat); crossbar.position.set(0, 2.5, 0);
        goalGroup.add(leftPost, rightPost, crossbar);
        goalGroup.position.set(x, 0, z);
        goalGroup.rotation.y = rot;
        scene.add(goalGroup);
    }
    createMiniGoal(0, -16.5, 0);
    createMiniGoal(0, 16.5, Math.PI);

    // BIỂN HIỆU NEON CHỮ KHỔNG LỒ TREO TRONG SẢNH (Floating Neon Billboard)
    const billboard = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 3),
        new THREE.MeshBasicMaterial({ map: createBillboardTexture("BLUE LOCK"), transparent: true, side: THREE.DoubleSide })
    );
    billboard.position.set(0, 8, -24.5);
    scene.add(billboard);

    function createBillboardTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,512,128);
        ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 55px Arial Black';
        ctx.textAlign = 'center'; ctx.fillText(text, 256, 85);
        return new THREE.CanvasTexture(canvas);
    }

    // ============================================================================
    // 5. CÁC BỆ SÁNG & TRỤ MÁY TRÒ CHƠI TƯƠNG TÁC (ROBLOX STYLE)
    // ============================================================================

    // VÒNG TRÒN XOAY KỸ NĂNG "SPIN STYLE"
    function createInteractivePad(name, x, z, colorHex) {
        const padGroup = new THREE.Group();
        
        // Vòng tròn bệ sáng dưới đất
        const circleGeo = new THREE.RingGeometry(1.8, 2, 32);
        const circleMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = Math.PI/2;
        padGroup.add(circle);

        // Đĩa ánh sáng mờ phát ra bên trên bệ
        const cylinderGeo = new THREE.CylinderGeometry(1.8, 1.8, 2, 32, 1, true);
        const cylinderMat = new THREE.MeshBasicMaterial({
            color: colorHex,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const glowBeam = new THREE.Mesh(cylinderGeo, cylinderMat);
        glowBeam.position.y = 1;
        padGroup.add(glowBeam);

        padGroup.position.set(x, 0.05, z);
        scene.add(padGroup);
        return { group: padGroup, name: name, x: x, z: z };
    }
    const spinPad = createInteractivePad("SPIN", -15, -15, 0xf1c40f); // Bệ vàng xoay kỹ năng

    // TRỤ MÁY CHƠI GAME DỊCH CHUYỂN MATCHMAKING (Teleport Terminals)
    function createGameTerminal(x, z, rotY) {
        const terminalGroup = new THREE.Group();

        // Thân máy bằng sắt đen (Arcade Cabinet base)
        const baseGeo = new THREE.BoxGeometry(1.2, 2.2, 0.8);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.2 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 1.1;
        terminalGroup.add(base);

        // Màn hình Game phát sáng xanh lá/cyan neon
        const screenGeo = new THREE.PlaneGeometry(0.9, 0.7);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 1.6, 0.41);
        terminalGroup.add(screen);

        // Chữ phát sáng trên màn hình "5VS5 MATCH"
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 256; textCanvas.height = 128;
        const tCtx = textCanvas.getContext('2d');
        tCtx.fillStyle = '#111625'; tCtx.fillRect(0,0,256,128);
        tCtx.fillStyle = '#00ffff'; tCtx.font = 'bold 36px Arial';
        tCtx.textAlign = 'center'; tCtx.fillText("JOIN 5v5", 128, 55);
        tCtx.font = '18px Arial'; tCtx.fillText("[TELEPORT]", 128, 95);
        
        const screenTextMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(textCanvas) });
        const screenText = new THREE.Mesh(screenGeo, screenTextMat);
        screenText.position.set(0, 1.6, 0.42);
        terminalGroup.add(screenText);

        // Ánh sáng tỏa ra từ màn hình máy game
        const light = new THREE.PointLight(0x00ffff, 1.2, 4);
        light.position.set(0, 1.6, 1);
        terminalGroup.add(light);

        terminalGroup.position.set(x, 0, z);
        terminalGroup.rotation.y = rotY;
        scene.add(terminalGroup);
        return { group: terminalGroup, x: x, z: z };
    }
    // Đặt máy Arcade Teleport ở rìa sân bóng mini bên phải
    const teleportTerminal = createGameTerminal(15, -15, -Math.PI / 4);

    // ============================================================================
    // 6. BẢNG XẾP HẠNG (LEADERBOARD) & BẢNG NHIỆM VỤ (DAILY QUESTS) TRONG LOBBY
    // ============================================================================

    // 6.1. BẢNG XẾP HẠNG HOLOGRAM LƠ LỬNG
    function createLeaderboard() {
        const boardGeo = new THREE.PlaneGeometry(6, 4);
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 340;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
        ctx.fillRect(0, 0, 512, 340);
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 334);

        // Header
        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 32px Montserrat, Arial';
        ctx.textAlign = 'center'; ctx.fillText("🏆 EGO LEADERBOARD 🏆", 256, 45);

        // Danh sách Top Players
        const players = [
            "1. Michael Kaiser - 9,999 EGO",
            "2. Rin Itoshi - 8,450 EGO",
            "3. Yoichi Isagi - 7,210 EGO",
            "4. Seishiro Nagi - 6,800 EGO",
            "5. Meguru Bachira - 5,900 EGO"
        ];
        ctx.textAlign = 'left';
        ctx.font = '22px Arial';
        players.forEach((p, index) => {
            ctx.fillStyle = (index === 0) ? '#d4ac0d' : (index === 1 ? '#a22b21' : '#ffffff');
            ctx.fillText(p, 50, 100 + index * 42);
        });

        const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(boardGeo, mat);
        mesh.position.set(-18, 4, 15);
        mesh.rotation.y = Math.PI / 4;
        scene.add(mesh);
    }
    createLeaderboard();

    // 6.2. BẢNG NHIỆM VỤ DAILY QUEST BOARD
    function createQuestBoard() {
        const boardGeo = new THREE.PlaneGeometry(6, 4);
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 340;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
        ctx.fillRect(0, 0, 512, 340);
        ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 334);

        // Header
        ctx.fillStyle = '#ffaa00'; ctx.font = 'bold 32px Montserrat, Arial';
        ctx.textAlign = 'center'; ctx.fillText("🔥 DAILY QUESTS 🔥", 256, 45);

        // List Quests
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText("⚽ Sút vào lưới mini gôn (Thưởng +50 Tokens)", 40, 110);
        ctx.fillText("🌀 Roll 1 Egoist mới trong Gacha SPIN", 40, 170);
        ctx.fillText("⚡ Chạy đến Game Terminal để đấu 5v5", 40, 230);

        const mat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(boardGeo, mat);
        mesh.position.set(18, 4, 15);
        mesh.rotation.y = -Math.PI / 4;
        scene.add(mesh);
    }
    createQuestBoard();


    // ============================================================================
    // 7. TẠO MODEL NHÂN VẬT LEGO LEGO CHUẨN TỶ LỆ VÀ QUẢ BÓNG VẬT LÝ
    // ============================================================================

    function createLegoCharacter(egoistKey) {
        const pGroup = new THREE.Group();
        const data = EGOISTS[egoistKey];

        const skinColor = 0xFAD7A1;
        const pantsColor = 0x111111;
        let jerseyColor = data.color;

        // Thân LEGO (Torso)
        const torso = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.2, 0.45),
            new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.4 })
        );
        torso.position.y = 1.4;
        pGroup.add(torso);

        // Chân LEGO Trái & Phải (Legs)
        const legGeo = new THREE.BoxGeometry(0.33, 0.8, 0.38);
        const legMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.5 });
        
        const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.2, 0.4, 0); pGroup.add(legL);
        const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(0.2, 0.4, 0); pGroup.add(legR);

        // Tay LEGO Trái & Phải (Arms)
        const armGeo = new THREE.BoxGeometry(0.24, 0.9, 0.24);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        
        const armL = new THREE.Mesh(armGeo, armMat); armL.position.set(-0.55, 1.35, 0); pGroup.add(armL);
        const armR = new THREE.Mesh(armGeo, armMat); armR.position.set(0.55, 1.35, 0); pGroup.add(armR);

        // Bàn tay LEGO (Hands)
        const handGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const handMat = new THREE.MeshStandardMaterial({ color: skinColor });
        const handL = new THREE.Mesh(handGeo, handMat); handL.position.set(-0.55, 0.825, 0); pGroup.add(handL);
        const handR = new THREE.Mesh(handGeo, handMat); handR.position.set(0.55, 0.825, 0); pGroup.add(handR);

        // Đầu LEGO Cylinder (Head)
        const headNode = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.28, 0.55, 16),
            new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 })
        );
        headNode.position.y = 2.2;
        pGroup.add(headNode);

        // Chốt LEGO Stud trên đầu
        const stud = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 })
        );
        stud.position.y = 0.335;
        headNode.add(stud);

        // Mắt phát sáng rực lửa phong cách Blue Lock
        const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // Mắt Cyan neon
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.1, 0.05, 0.27); headNode.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.1, 0.05, 0.27); headNode.add(eyeR);

        // TẠO KIỂU TÓC LEGO VOXEL ĐẶC TRƯNG
        const hairGroup = new THREE.Group();
        const hairMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

        if (data.hair === 'isagi') {
            hairMat.color.setHex(0x1a252c);
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.25, 0.64), hairMat); cap.position.y = 0.25;
            const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.2), hairMat); fringe.position.set(0, 0.1, 0.28);
            hairGroup.add(cap, fringe);
        } else if (data.hair === 'bachira') {
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.2, 0.66), new THREE.MeshBasicMaterial({ color: 0x111111 })); cap.position.y = 0.28;
            const layerYellow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), new THREE.MeshBasicMaterial({ color: 0xF1C40F })); layerYellow.position.y = 0.15;
            hairGroup.add(cap, layerYellow);
        } else if (data.hair === 'chigiri') {
            hairMat.color.setHex(0x922B21);
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.2, 0.64), hairMat); cap.position.y = 0.25;
            const longBack = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.65, 0.2), hairMat); longBack.position.set(0, -0.1, -0.25);
            hairGroup.add(cap, longBack);
        } else if (data.hair === 'nagi') {
            hairMat.color.setHex(0xEEEEEE);
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.7), hairMat); cap.position.y = 0.28;
            hairGroup.add(cap);
        } else if (data.hair === 'rin') {
            hairMat.color.setHex(0x112B2B);
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.25, 0.64), hairMat); cap.position.y = 0.25;
            const peak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), hairMat); peak.position.set(0, 0.1, 0.3);
            hairGroup.add(cap, peak);
        } else if (data.hair === 'kaiser') {
            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.25, 0.66), new THREE.MeshBasicMaterial({ color: 0xF5B041 })); cap.position.y = 0.25;
            const blueTips = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), new THREE.MeshBasicMaterial({ color: 0x3498DB })); blueTips.position.set(0, -0.15, -0.25);
            hairGroup.add(cap, blueTips);
        }

        headNode.add(hairGroup);
        return pGroup;
    }

    // Khởi tạo Người chơi
    let player = createLegoCharacter(currentEgoistKey);
    player.position.set(0, 0, 8); // Xuất phát trước sân cỏ mini
    scene.add(player);

    // Khởi tạo Quả bóng đá ở trung tâm sân mini
    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
    );
    ball.position.set(0, 0.5, 0);
    scene.add(ball);

    // ============================================================================
    // 8. VẬT LÝ DI CHUYỂN, VA CHẠM VÀ RÊ SÚT BÓNG (GAMEPLAY LOOP)
    // ============================================================================

    let yaw = 0, pitch = 0.5;
    let ballVelocity = { x: 0, z: 0 };
    let playerVelocityY = 0;
    let isGrounded = true;
    const keys = { w: false, a: false, s: false, d: false, ' ': false };

    // Bắt sự kiện bàn phím di chuyển
    window.addEventListener('keydown', (e) => {
        let key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
        let key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = false;
    });

    // Khoá con trỏ chuột (Shiftlock)
    renderer.domElement.addEventListener('click', () => {
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * 0.0025;
            pitch -= e.movementY * 0.0025;
            pitch = Math.max(0.1, Math.min(Math.PI / 2.3, pitch));
        }
    });

    // Sút bóng khi click chuột trái (M1)
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
            let dist = player.position.distanceTo(ball.position);
            if (dist < 1.8) { // Đủ tầm chân sút
                const shootPower = 1.3;
                const lookDirX = -Math.sin(player.rotation.y);
                const lookDirZ = -Math.cos(player.rotation.y);
                ballVelocity.x = lookDirX * shootPower;
                ballVelocity.z = lookDirZ * shootPower;
                triggerGoalEffect("💥 EGO SHOT!");
            }
        }
    });

    // ============================================================================
    // 9. HỆ THỐNG SPIN GACHA XOAY SKILL (ROBLOX STYLE MÀN HÌNH CHỜ)
    // ============================================================================
    let isSpinning = false;
    const spinModal = document.getElementById('spin-modal');
    const spinResultName = document.getElementById('spin-result-name');
    const spinResultRarity = document.getElementById('spin-result-rarity');
    const btnSpinRoll = document.getElementById('btn-spin-roll');
    const btnCloseSpin = document.getElementById('btn-close-spin');

    // Nút tắt popup Spin
    btnCloseSpin.onclick = () => {
        spinModal.style.transform = 'translate(-50%, -50%) scale(0)';
        document.exitPointerLock();
    };

    // Hàm thực hiện Roll gacha
    btnSpinRoll.onclick = () => {
        if (isSpinning) return;
        if (userEgoTokens < 100) {
            alert("Bạn không đủ EGO TOKENS! Sút bóng vào gôn để kiếm thêm.");
            return;
        }

        isSpinning = true;
        userEgoTokens -= 100;
        document.getElementById('ui-tokens').innerText = userEgoTokens;

        const egoistKeys = Object.keys(EGOISTS);
        let counter = 0;
        
        // Hiệu ứng chạy chữ giật gân
        const interval = setInterval(() => {
            const tempKey = egoistKeys[Math.floor(Math.random() * egoistKeys.length)];
            spinResultName.innerText = EGOISTS[tempKey].name.toUpperCase();
            spinResultRarity.innerText = EGOISTS[tempKey].rarity;
            counter++;
            if (counter > 15) {
                clearInterval(interval);
                finalizeSpin();
            }
        }, 100);
    };

    function finalizeSpin() {
        // Tỉ lệ trúng: Thử vận may chuẩn gacha
        const rollChance = Math.random() * 100;
        let selectedKey = 'isagi';

        if (rollChance < 1) { selectedKey = 'kaiser'; }       // 1% Legendary
        else if (rollChance < 11) { selectedKey = 'rin'; }     // 10% Epic
        else if (rollChance < 21) { selectedKey = 'nagi'; }    // 10% Epic
        else if (rollChance < 50) { selectedKey = 'chigiri'; } // Rare
        else if (rollChance < 75) { selectedKey = 'bachira'; } // Rare
        else { selectedKey = 'isagi'; }                       // Rare

        const finalChar = EGOISTS[selectedKey];
        spinResultName.innerText = finalChar.name.toUpperCase();
        spinResultRarity.innerText = finalChar.rarity;

        // Đổi màu rarity cho chất Roblox
        if (finalChar.rarity.includes("LEGENDARY")) spinResultRarity.style.color = "#d4ac0d";
        else if (finalChar.rarity.includes("EPIC")) spinResultRarity.style.color = "#a22b21";
        else spinResultRarity.style.color = "#3498db";

        // Cập nhật Ngoại hình & Chỉ số Nhân vật 3D trên màn hình ngay lập tức!
        currentEgoistKey = selectedKey;
        const oldPos = player.position.clone();
        scene.remove(player);
        player = createLegoCharacter(selectedKey);
        player.position.copy(oldPos);
        scene.add(player);

        // Cập nhật HUD bên trái
        document.getElementById('ui-char-name').innerText = finalChar.name.toUpperCase();
        document.getElementById('ui-char-skill').innerText = "SKILL: " + finalChar.skill;
        document.getElementById('ui-spd').innerText = finalChar.stats.speed;
        document.getElementById('ui-sht').innerText = finalChar.stats.shoot;
        document.getElementById('ui-drb').innerText = finalChar.stats.dribble;

        isSpinning = false;
    }

    // ============================================================================
    // 10. ANIMATION & VẬT LÝ GAME LOOP CHÍNH (XỬ LÝ TELEPORT CHẠM TRỤ)
    // ============================================================================

    let isTeleporting = false;

    function animate() {
        requestAnimationFrame(animate);

        // Nếu đang trong hoạt cảnh dịch chuyển, tạm khóa di chuyển của nhân vật
        if (isTeleporting) {
            renderer.render(scene, camera);
            return;
        }

        // --- A. VẬT LÝ & ĐIỀU KHIỂN NHÂN VẬT ---
        let speed = 0.16;
        const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);

        let moveX = 0, moveZ = 0;
        if (keys.w) { moveX += forwardX; moveZ += forwardZ; }
        if (keys.s) { moveX -= forwardX; moveZ -= forwardZ; }
        if (keys.a) { moveX -= rightX; moveZ -= rightZ; }
        if (keys.d) { moveX += rightX; moveZ += rightZ; }

        let length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (length > 0) {
            player.position.x += (moveX / length) * speed;
            player.position.z += (moveZ / length) * speed;
            player.rotation.y = yaw;
        }

        // Nhảy lên cao (Spacebar) có trọng lực
        if (keys[' '] && isGrounded) {
            playerVelocityY = 0.22;
            isGrounded = false;
        }
        if (!isGrounded) {
            player.position.y += playerVelocityY;
            playerVelocityY -= 0.012; // Gia tốc trọng lực rớt xuống
            if (player.position.y <= 0) {
                player.position.y = 0;
                playerVelocityY = 0;
                isGrounded = true;
            }
        }

        // Khóa giới hạn sảnh chờ (Giữ chân trong sảnh 48x48)
        player.position.x = Math.max(-23.8, Math.min(23.8, player.position.x));
        player.position.z = Math.max(-23.8, Math.min(23.8, player.position.z));

        // --- B. VẬT LÝ VÀ CHẠM & ĐẨY BÓNG ---
        let distToBall = player.position.distanceTo(ball.position);
        if (distToBall < 1.3) {
            const lookDirX = -Math.sin(player.rotation.y);
            const lookDirZ = -Math.cos(player.rotation.y);
            ball.position.x = player.position.x + lookDirX * 1.3;
            ball.position.z = player.position.z + lookDirZ * 1.3;
        }

        // Di chuyển quả bóng bằng vận tốc đẩy sút
        ball.position.x += ballVelocity.x;
        ball.position.z += ballVelocity.z;
        ballVelocity.x *= 0.95; // Ma sát sàn làm chậm bóng
        ballVelocity.z *= 0.95;

        // Va chạm tường sảnh của quả bóng
        if (Math.abs(ball.position.x) > 23.8) { ballVelocity.x *= -0.8; ball.position.x = Math.sign(ball.position.x) * 23.8; }
        if (Math.abs(ball.position.z) > 23.8) { ballVelocity.z *= -0.8; ball.position.z = Math.sign(ball.position.z) * 23.8; }

        // --- C. KIỂM TRA SÚT VÀO GÔN Ở SÂN MINI ĐỂ KIẾM TOKENS ---
        if (ball.position.z <= -16.2 && Math.abs(ball.position.x) < 2.5) {
            triggerGoalEffect("⚽ GOAL! +50 TOKENS");
            userEgoTokens += 50;
            document.getElementById('ui-tokens').innerText = userEgoTokens;
            resetBall();
        }
        if (ball.position.z >= 16.2 && Math.abs(ball.position.x) < 2.5) {
            triggerGoalEffect("⚽ GOAL! +50 TOKENS");
            userEgoTokens += 50;
            document.getElementById('ui-tokens').innerText = userEgoTokens;
            resetBall();
        }

        // --- D. KIỂM TRA VA CHẠM CÁC KHU VỰC TƯƠNG TÁC ---
        
        // 1. Chạm bệ vàng SPIN STYLE
        let distToSpin = player.position.distanceTo(new THREE.Vector3(spinPad.x, 0, spinPad.z));
        if (distToSpin < 2.0) {
            if (spinModal.style.transform !== 'translate(-50%, -50%) scale(1)') {
                spinModal.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        }

        // 2. Chạm TRỤ GAME TERMINAL để Teleport
        let distToTerminal = player.position.distanceTo(new THREE.Vector3(teleportTerminal.x, 0, teleportTerminal.z));
        if (distToTerminal < 1.8 && !isTeleporting) {
            triggerTeleportSequence();
        }

        // --- E. CAMERA ĐI THEO SAU NHÂN VẬT (Shiftlock Camera) ---
        const cameraDistance = 10;
        let camX = player.position.x + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
        let camY = player.position.y + cameraDistance * Math.sin(pitch) + 1.2;
        let camZ = player.position.z + cameraDistance * Math.cos(yaw) * Math.cos(pitch);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)));

        renderer.render(scene, camera);
    }
    animate();

    // HÀM XỬ LÝ QUY TRÌNH TELEPORT DỊCH CHUYỂN
    function triggerTeleportSequence() {
        isTeleporting = true;
        document.exitPointerLock(); // Nhả chuột khóa góc nhìn

        const overlay = document.getElementById('teleport-overlay');
        overlay.style.opacity = '1'; // Sáng rực màn hình màu Cyan

        setTimeout(() => {
            // Thực hiện dịch chuyển vị trí nhân vật về trung tâm sân đấu mini
            player.position.set(0, 0, 0);
            resetBall();

            // Sút quả bóng một lực tượng trưng
            ballVelocity.x = (Math.random() - 0.5) * 1.5;
            ballVelocity.z = -1.5;

            // Nháy sáng lấp lánh và tắt màn hình phủ
            setTimeout(() => {
                overlay.style.opacity = '0';
                isTeleporting = false;
                triggerGoalEffect("⚡ ARRIVED AT MATCH!");
            }, 1000);

        }, 1500);
    }

    function resetBall() {
        ball.position.set(0, 0.5, 0);
        ballVelocity = { x: 0, z: 0 };
    }

    // Hiển thị hiệu ứng chữ bay bổng trên sảnh khi sút vào hoặc kích hoạt event
    function triggerGoalEffect(text) {
        const effect = document.createElement('div');
        effect.style.cssText = 'position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); padding: 15px 30px; background: rgba(0,0,0,0.8); color: #00ffff; border: 2px solid #00ffff; font-size: 35px; font-family: Impact; text-shadow: 0 0 10px #00ffff; border-radius: 8px; z-index: 500; animation: fadeUp 1.5s forwards; pointer-events: none;';
        effect.innerText = text;
        document.body.appendChild(effect);
        setTimeout(() => document.body.removeChild(effect), 1500);
    }

    // CSS Animation cho chữ hiệu ứng bay lên
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes fadeUp {
            0% { transform: translate(-50%, -50%) translateY(0) scale(0.8); opacity: 0; }
            15% { transform: translate(-50%, -50%) translateY(-10px) scale(1.1); opacity: 1; }
            85% { transform: translate(-50%, -50%) translateY(-30px) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) translateY(-50px) scale(0.9); opacity: 0; }
        }
    `;
    document.head.appendChild(styleSheet);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});
