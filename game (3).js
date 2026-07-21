// ============================================================================
// PROJECT: BLUE LOCK RIVALS (V4 - REAL-TIME MULTI-TAB MATCHMAKING & PLAYERS)
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

    let currentEgoistKey = 'isagi'; // Nhân vật mặc định
    let userEgoTokens = 500;        // Tiền Gacha

    // --- 2. THIẾT LẬP MẠNG MULTIPLAYER KHÔNG CẦN SERVER (BROADCASTCHANNEL) ---
    const bc = new BroadcastChannel('bluelock_ego_net');
    const myId = 'player_' + Math.random().toString(36).substr(2, 9);
    let onlineOpponentId = null; // ID của tab đối thủ (nếu có)
    let matchmakingTimeout = null;

    // --- 3. TẠO GIAO DIỆN PHẲNG (UI HUD) CHO SẢNH ĐỢI ROBLOX ---
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

        <div id="scoreboard-ui" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(10, 15, 30, 0.95); border: 2px solid #00ffff; border-radius: 8px; padding: 10px 25px; pointer-events: auto; display: none; text-align: center; box-shadow: 0 4px 20px rgba(0,255,255,0.3); min-width: 250px;">
            <div style="font-size: 10px; color: #8892b0; letter-spacing: 2px; font-weight: bold;">EGO 1VS1 MATCH</div>
            <div style="font-size: 28px; font-weight: 900; letter-spacing: 3px; margin: 2px 0;">
                <span id="score-player" style="color: #00ffff;">0</span> 
                <span style="color: white; font-size: 18px; margin: 0 8px;">VS</span> 
                <span id="score-rival" style="color: #e74c3c;">0</span>
            </div>
            <div id="scoreboard-rival-name" style="font-size: 11px; color: #ffaa00; font-weight: bold; text-transform: uppercase;">OPPONENT: RIN ITOSHI</div>
        </div>

        <div style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 12px 18px; border-radius: 8px; font-size: 12px; line-height: 1.6; border: 1px solid rgba(0,255,255,0.2);">
            🎮 <b>ĐIỀU KHIỂN MULTIPLAYER:</b><br>
            • Mở <b>2 Tab trình duyệt song song</b> để tự bắt trận đấu với nhau!<br>
            • <b>W, A, S, D:</b> Di chuyển nhân vật Lego.<br>
            • <b>Phím SPACE:</b> Nhảy lên cao.<br>
            • <b>Bệ vàng "SPIN":</b> Để xoay đổi nhân vật/kỹ năng.<br>
            • <b>Trụ xanh (MATCH TERMINAL):</b> Chạm vào để bắt đầu tìm trận!<br>
            • Click chuột trái (M1) khi đứng sát bóng để SÚT cực mạnh!
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

        <div id="teleport-overlay" style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(5, 10, 20, 0.95); opacity: 0; transition: opacity 0.5s ease; pointer-events: none; z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Montserrat', Arial, sans-serif;">
            <div id="match-status-title" style="color: #00ffff; font-family: Impact, sans-serif; font-size: 50px; letter-spacing: 5px; text-shadow: 0 0 20px #00ffff; margin-bottom: 20px;">MATCHMAKING...</div>
            <div id="match-status-sub" style="color: white; font-size: 20px; font-weight: bold; margin-bottom: 30px;">CONNECTING TO SERVER LOBBY...</div>
            <div id="match-loading-bar" style="width: 320px; height: 12px; background: #111; border: 2px solid #00ffff; border-radius: 6px; overflow: hidden; position: relative;">
                <div id="match-loading-progress" style="width: 0%; height: 100%; background: #00ffff; transition: width 0.1s linear;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(lobbyUI);

    // --- 4. SET UP MÔI TRƯỜNG THREE.JS (3D ROBLOX LOBBY HUB) ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x05070a, 0.025);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x222530);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const neonBlue = new THREE.PointLight(0x00ffff, 1.8, 30);
    neonBlue.position.set(-15, 5, 0);
    scene.add(neonBlue);

    const neonMagenta = new THREE.PointLight(0xff00ff, 1.8, 30);
    neonMagenta.position.set(15, 5, 0);
    scene.add(neonMagenta);

    // --- 5. KIẾN TRÚC SẢNH CHỜ 3D ---
    const lobbyFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.3, metalness: 0.8 })
    );
    lobbyFloor.rotation.x = -Math.PI / 2;
    scene.add(lobbyFloor);

    function createGlassWall(width, height, x, z, rotationY) {
        const wallGroup = new THREE.Group();
        const glassMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            new THREE.MeshStandardMaterial({ color: 0x00a8ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide, roughness: 0.1, metalness: 0.9 })
        );
        glassMesh.position.y = height / 2;
        wallGroup.add(glassMesh);

        const frameGeo = new THREE.BoxGeometry(width, 0.2, 0.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x222, roughness: 0.8 });
        const bottomFrame = new THREE.Mesh(frameGeo, frameMat); bottomFrame.position.y = 0.1;
        const topFrame = new THREE.Mesh(frameGeo, frameMat); topFrame.position.y = height;
        wallGroup.add(bottomFrame, topFrame);

        wallGroup.position.set(x, 0, z);
        wallGroup.rotation.y = rotationY;
        scene.add(wallGroup);
    }
    createGlassWall(50, 10, 0, -25, 0);
    createGlassWall(50, 10, 0, 25, Math.PI);
    createGlassWall(50, 10, -25, 0, Math.PI / 2);
    createGlassWall(50, 10, 25, 0, -Math.PI / 2);

    const pitchWidth = 22, pitchHeight = 34;
    const grassGeo = new THREE.PlaneGeometry(pitchWidth, pitchHeight);
    const grassMat = new THREE.MeshStandardMaterial({ map: createGrassTexture(), roughness: 0.8 });
    const practicePitch = new THREE.Mesh(grassGeo, grassMat);
    practicePitch.rotation.x = -Math.PI / 2;
    practicePitch.position.set(0, 0.01, 0);
    scene.add(practicePitch);

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

    // --- 6. CÁC BỆ SÁNG & TRỤ MÁY TRÒ CHƠI TƯƠNG TÁC ---
    function createInteractivePad(name, x, z, colorHex) {
        const padGroup = new THREE.Group();
        const circleGeo = new THREE.RingGeometry(1.8, 2, 32);
        const circleMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = Math.PI/2;
        padGroup.add(circle);

        const cylinderGeo = new THREE.CylinderGeometry(1.8, 1.8, 2, 32, 1, true);
        const cylinderMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const glowBeam = new THREE.Mesh(cylinderGeo, cylinderMat);
        glowBeam.position.y = 1;
        padGroup.add(glowBeam);

        padGroup.position.set(x, 0.05, z);
        scene.add(padGroup);
        return { group: padGroup, name: name, x: x, z: z };
    }
    const spinPad = createInteractivePad("SPIN", -15, -15, 0xf1c40f);

    function createGameTerminal(x, z, rotY) {
        const terminalGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.9, roughness: 0.2 }));
        base.position.y = 1.1;
        terminalGroup.add(base);

        const screenGeo = new THREE.PlaneGeometry(0.9, 0.7);
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 256; textCanvas.height = 128;
        const tCtx = textCanvas.getContext('2d');
        tCtx.fillStyle = '#111625'; tCtx.fillRect(0,0,256,128);
        tCtx.fillStyle = '#00ffff'; tCtx.font = 'bold 30px Arial';
        tCtx.textAlign = 'center'; tCtx.fillText("1VS1 ONLINE", 128, 55);
        tCtx.font = '16px Arial'; tCtx.fillText("[TOUCH TO MATCH]", 128, 95);
        
        const screenText = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(textCanvas) }));
        screenText.position.set(0, 1.6, 0.42);
        terminalGroup.add(screenText);

        const light = new THREE.PointLight(0x00ffff, 1.2, 4);
        light.position.set(0, 1.6, 1);
        terminalGroup.add(light);

        terminalGroup.position.set(x, 0, z);
        terminalGroup.rotation.y = rotY;
        scene.add(terminalGroup);
        return { group: terminalGroup, x: x, z: z };
    }
    const teleportTerminal = createGameTerminal(15, -15, -Math.PI / 4);

    // Bảng xếp hạng & Nhiệm vụ
    function createLeaderboard() {
        const boardGeo = new THREE.PlaneGeometry(6, 4);
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 340;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(10, 15, 30, 0.95)'; ctx.fillRect(0, 0, 512, 340);
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 506, 334);
        ctx.fillStyle = '#00ffff'; ctx.font = 'bold 32px Montserrat, Arial'; ctx.textAlign = 'center'; ctx.fillText("🏆 EGO LEADERBOARD 🏆", 256, 45);

        const players = ["1. Michael Kaiser - 9,999 EGO", "2. Rin Itoshi - 8,450 EGO", "3. Yoichi Isagi - 7,210 EGO", "4. Seishiro Nagi - 6,800 EGO", "5. Meguru Bachira - 5,900 EGO"];
        ctx.textAlign = 'left'; ctx.font = '22px Arial';
        players.forEach((p, index) => {
            ctx.fillStyle = (index === 0) ? '#d4ac0d' : (index === 1 ? '#a22b21' : '#ffffff');
            ctx.fillText(p, 50, 100 + index * 42);
        });
        const mesh = new THREE.Mesh(boardGeo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide }));
        mesh.position.set(-18, 4, 15); mesh.rotation.y = Math.PI / 4;
        scene.add(mesh);
    }
    createLeaderboard();

    // --- 7. TẠO MODEL NHÂN VẬT LEGO LEGO CHUẨN TỶ LỆ VÀ FLOATING NAME TAGS ---
    function createLegoCharacter(egoistKey) {
        const pGroup = new THREE.Group();
        const data = EGOISTS[egoistKey];

        const skinColor = 0xFAD7A1;
        const pantsColor = 0x111111;
        let jerseyColor = data.color;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.45), new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.4 }));
        torso.position.y = 1.4; pGroup.add(torso);

        const legGeo = new THREE.BoxGeometry(0.33, 0.8, 0.38);
        const legMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.5 });
        const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.2, 0.4, 0); pGroup.add(legL);
        const legR = new THREE.Mesh(legGeo, legMat); legR.position.set(0.2, 0.4, 0); pGroup.add(legR);

        const armGeo = new THREE.BoxGeometry(0.24, 0.9, 0.24);
        const armMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const armL = new THREE.Mesh(armGeo, armMat); armL.position.set(-0.55, 1.35, 0); pGroup.add(armL);
        const armR = new THREE.Mesh(armGeo, armMat); armR.position.set(0.55, 1.35, 0); pGroup.add(armR);

        const handGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
        const handMat = new THREE.MeshStandardMaterial({ color: skinColor });
        const handL = new THREE.Mesh(handGeo, handMat); handL.position.set(-0.55, 0.825, 0); pGroup.add(handL);
        const handR = new THREE.Mesh(handGeo, handMat); handR.position.set(0.55, 0.825, 0); pGroup.add(handR);

        const headNode = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.55, 16), new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 }));
        headNode.position.y = 2.2; pGroup.add(headNode);

        const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16), new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 }));
        stud.position.y = 0.335; headNode.add(stud);

        const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.1, 0.05, 0.27); headNode.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.1, 0.05, 0.27); headNode.add(eyeR);

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
        pGroup.userData = { legL, legR, armL, armR, legSwing: 0 };
        return pGroup;
    }

    function createNameTag(text, colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)'; ctx.fillRect(0, 0, 256, 64);
        ctx.strokeStyle = colorHex; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 252, 60);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Montserrat, Arial'; ctx.textAlign = 'center'; ctx.fillText(text, 128, 40);

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sprite.scale.set(2.4, 0.6, 1);
        sprite.position.y = 3.1;
        return sprite;
    }

    // Khởi tạo Player của mình
    let player = createLegoCharacter(currentEgoistKey);
    player.position.set(0, 0, 8);
    scene.add(player);

    // Khởi tạo Đối thủ (Có thể là Bot AI hoặc Tab đối thủ khác)
    let opponent = null;
    let opponentKey = 'rin';

    function spawnOpponent(key, isOnline) {
        if (opponent) {
            scene.remove(opponent);
        }
        opponentKey = key;
        opponent = createLegoCharacter(key);
        
        // Đổi màu tag tên (Người thật: Màu xanh Neon, Bot AI: Màu đỏ)
        const tagText = isOnline ? `PLAYER: ${EGOISTS[key].name.toUpperCase()}` : `BOT: ${EGOISTS[key].name.toUpperCase()}`;
        const tagColor = isOnline ? '#00ff88' : '#ff3333';
        
        const tag = createNameTag(tagText, tagColor);
        opponent.add(tag);
        opponent.position.set(0, 0, -8);
        scene.add(opponent);
    }

    const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 })
    );
    ball.position.set(0, 0.5, 0);
    scene.add(ball);

    // --- 8. VẬT LÝ, VA CHẠM VÀ ĐIỀU KHIỂN CHUẨN ROBLOX ---
    let yaw = 0, pitch = 0.5;
    let ballVelocity = { x: 0, z: 0 };
    let playerVelocityY = 0;
    let isGrounded = true;
    const keys = { w: false, a: false, s: false, d: false, ' ': false };

    window.addEventListener('keydown', (e) => {
        let key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
        let key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = false;
    });

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

    // Lắng nghe lệnh Sút bóng (Click chuột trái M1)
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
            let dist = player.position.distanceTo(ball.position);
            if (dist < 1.8) {
                const shootPower = 1.4;
                const lookDirX = -Math.sin(player.rotation.y);
                const lookDirZ = -Math.cos(player.rotation.y);
                ballVelocity.x = lookDirX * shootPower;
                ballVelocity.z = lookDirZ * shootPower;
                triggerGoalEffect("💥 EGO SHOT!");

                // Đồng bộ cú sút bóng sang Tab đối thủ kia
                if (isMatchActive && onlineOpponentId) {
                    bc.postMessage({
                        type: 'ball_kick',
                        senderId: myId,
                        px: ball.position.x,
                        pz: ball.position.z,
                        vx: ballVelocity.x,
                        vz: ballVelocity.z
                    });
                }
            }
        }
    });

    // --- 9. XỬ LÝ AI ĐỐI THỦ (Khi chơi Single-player Offline với Bot) ---
    function updateOpponentAI() {
        if (!opponent || !isMatchActive || onlineOpponentId) return;

        let dirToBallX = ball.position.x - opponent.position.x;
        let dirToBallZ = ball.position.z - opponent.position.z;
        let distToBall = Math.sqrt(dirToBallX * dirToBallX + dirToBallZ * dirToBallZ);

        let speedStat = EGOISTS[opponentKey].stats.speed;
        let botSpeed = 0.06 + (speedStat / 100) * 0.08;

        if (distToBall > 1.2) {
            opponent.position.x += (dirToBallX / distToBall) * botSpeed;
            opponent.position.z += (dirToBallZ / distToBall) * botSpeed;
            opponent.rotation.y = Math.atan2(dirToBallX, dirToBallZ) + Math.PI;

            opponent.userData.legSwing += 0.18;
            opponent.userData.legL.rotation.x = Math.sin(opponent.userData.legSwing) * 0.6;
            opponent.userData.legR.rotation.x = -Math.sin(opponent.userData.legSwing) * 0.6;
        } else {
            let goalTargetX = 0;
            let goalTargetZ = 16.5;
            let shootDirX = goalTargetX - ball.position.x;
            let shootDirZ = goalTargetZ - ball.position.z;
            let shootLen = Math.sqrt(shootDirX * shootDirX + shootDirZ * shootDirZ);

            let shootStat = EGOISTS[opponentKey].stats.shoot;
            let shootPower = 0.8 + (shootStat / 100) * 0.7;

            ballVelocity.x = (shootDirX / shootLen) * shootPower;
            ballVelocity.z = (shootDirZ / shootLen) * shootPower;

            triggerGoalEffect(`💥 ${EGOISTS[opponentKey].name.toUpperCase()} SHOT!`);
        }

        opponent.position.x = Math.max(-23.8, Math.min(23.8, opponent.position.x));
        opponent.position.z = Math.max(-23.8, Math.min(23.8, opponent.position.z));
    }

    // --- 10. HỆ THỐNG GIAO TIẾP VÀ TRUYỀN DỮ LIỆU GIỮA CÁC TAB (MULTI-TAB MATCH) ---
    bc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        // A. Nhận tín hiệu tìm trận từ tab kia
        if (data.type === 'match_search' && data.senderId !== myId) {
            if (!isMatchActive && !isTeleporting) {
                // Chấp nhận ghép trận và gửi ngược tín hiệu đồng ý
                bc.postMessage({
                    type: 'match_accept',
                    senderId: myId,
                    receiverId: data.senderId,
                    charKey: currentEgoistKey
                });
                startOnlineMatch(data.senderId, data.charKey);
            }
        }

        // B. Nhận tín hiệu đồng ý ghép trận
        if (data.type === 'match_accept' && data.receiverId === myId) {
            startOnlineMatch(data.senderId, data.charKey);
        }

        // C. Đồng bộ di chuyển của đối thủ online (Xoay góc đối xứng 180 độ)
        if (data.type === 'player_move' && data.senderId === onlineOpponentId) {
            if (opponent) {
                opponent.position.set(-data.x, data.y, -data.z);
                opponent.rotation.y = data.rotY + Math.PI;

                opponent.userData.legSwing = data.legSwing;
                opponent.userData.legL.rotation.x = Math.sin(data.legSwing) * 0.6;
                opponent.userData.legR.rotation.x = -Math.sin(data.legSwing) * 0.6;
            }
        }

        // D. Đồng bộ cú sút và di chuyển quả bóng từ tab kia
        if (data.type === 'ball_kick' && data.senderId === onlineOpponentId) {
            ball.position.set(-data.px, 0.5, -data.pz);
            ballVelocity.x = -data.vx;
            ballVelocity.z = -data.vz;
        }

        // E. Đồng bộ tỉ số trận đấu
        if (data.type === 'score_update' && data.senderId === onlineOpponentId) {
            playerScore = data.rivalScore;
            rivalScore = data.playerScore;
            document.getElementById('score-player').innerText = playerScore;
            document.getElementById('score-rival').innerText = rivalScore;
        }

        // F. Xử lý khi đối thủ thoát đột ngột (Tắt tab kia)
        if (data.type === 'opponent_leave' && data.senderId === onlineOpponentId) {
            triggerGoalEffect("❌ OPPONENT DISCONNECTED!");
            isMatchActive = false;
            onlineOpponentId = null;
            document.getElementById('scoreboard-ui').style.display = 'none';
            if (opponent) {
                scene.remove(opponent);
                opponent = null;
            }
        }
    };

    // --- 11. ĐIỀU HƯỚNG QUY TRÌNH MATCHMAKING ---
    let isTeleporting = false;
    let isMatchActive = false;
    let playerScore = 0;
    let rivalScore = 0;

    function triggerMatchmaking() {
        isTeleporting = true;
        document.exitPointerLock();

        const overlay = document.getElementById('teleport-overlay');
        const progress = document.getElementById('match-loading-progress');
        const statusTitle = document.getElementById('match-status-title');
        const statusSub = document.getElementById('match-status-sub');
        const scoreboard = document.getElementById('scoreboard-ui');

        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        progress.style.width = '0%';
        statusTitle.innerText = "MATCHMAKING...";
        statusSub.innerText = "SEARCHING FOR AN ONLINE TAB CLIENT [1/2]...";

        // Phát sóng tín hiệu tìm kiếm ra mạng Broadcast
        bc.postMessage({
            type: 'match_search',
            senderId: myId,
            charKey: currentEgoistKey
        });

        let percent = 0;
        const progressInterval = setInterval(() => {
            if (!isTeleporting) {
                clearInterval(progressInterval);
                return;
            }
            percent += 2.5;
            progress.style.width = `${Math.min(percent, 95)}%`;
        }, 100);

        // FALLBACK: Sau 4 giây nếu không thấy tab nào khác phản hồi -> Chuyển sang đấu với BOT AI!
        matchmakingTimeout = setTimeout(() => {
            clearInterval(progressInterval);
            progress.style.width = '100%';
            statusTitle.innerText = "NO ONLINE TABS DETECTED";
            statusSub.innerText = "SPAWNING LOCAL EGO BOT AI...";
            statusTitle.style.color = '#ffaa00';

            setTimeout(() => {
                onlineOpponentId = null; 
                isMatchActive = true;
                isTeleporting = false;

                const pool = Object.keys(EGOISTS).filter(k => k !== currentEgoistKey);
                const chosenRivalKey = pool[Math.floor(Math.random() * pool.length)];
                
                spawnOpponent(chosenRivalKey, false); // false = Bot AI

                player.position.set(0, 0, 8);
                resetBall();

                playerScore = 0;
                rivalScore = 0;
                document.getElementById('score-player').innerText = "0";
                document.getElementById('score-rival').innerText = "0";
                document.getElementById('scoreboard-rival-name').innerText = "OPPONENT: " + EGOISTS[chosenRivalKey].name.toUpperCase() + " (BOT AI)";
                scoreboard.style.display = 'block';

                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';

                triggerGoalEffect("⚔️ 1VS1 VS BOT START!");
            }, 1200);
        }, 4000);
    }

    function startOnlineMatch(oppId, oppCharKey) {
        if (isMatchActive) return;
        clearTimeout(matchmakingTimeout);
        isTeleporting = true;

        const overlay = document.getElementById('teleport-overlay');
        const progress = document.getElementById('match-loading-progress');
        const statusTitle = document.getElementById('match-status-title');
        const statusSub = document.getElementById('match-status-sub');
        const scoreboard = document.getElementById('scoreboard-ui');

        overlay.style.opacity = '1';
        progress.style.width = '100%';
        statusTitle.innerText = "ONLINE RIVAL FOUND!";
        statusTitle.style.color = '#00ff88';
        statusSub.innerText = `CONNECTING TO EGO CLIENT ID: ${oppId.toUpperCase()}...`;

        setTimeout(() => {
            onlineOpponentId = oppId;
            isMatchActive = true;
            isTeleporting = false;

            spawnOpponent(oppCharKey, true); // true = Online Player

            player.position.set(0, 0, 8);
            resetBall();

            playerScore = 0;
            rivalScore = 0;
            document.getElementById('score-player').innerText = "0";
            document.getElementById('score-rival').innerText = "0";
            document.getElementById('scoreboard-rival-name').innerText = "RIVAL: " + EGOISTS[oppCharKey].name.toUpperCase() + " (REAL PLAYER)";
            scoreboard.style.display = 'block';

            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';

            triggerGoalEffect("⚽ REAL-TIME MATCH START!");
        }, 1500);
    }

    // Báo thoát trận khi đóng/load lại Tab
    window.addEventListener('beforeunload', () => {
        if (onlineOpponentId) {
            bc.postMessage({ type: 'opponent_leave', senderId: myId });
        }
    });

    // --- 12. HỆ THỐNG SPIN GACHA ---
    let isSpinning = false;
    const spinModal = document.getElementById('spin-modal');
    const spinResultName = document.getElementById('spin-result-name');
    const spinResultRarity = document.getElementById('spin-result-rarity');
    const btnSpinRoll = document.getElementById('btn-spin-roll');
    const btnCloseSpin = document.getElementById('btn-close-spin');

    btnCloseSpin.onclick = () => {
        spinModal.style.transform = 'translate(-50%, -50%) scale(0)';
        document.exitPointerLock();
    };

    btnSpinRoll.onclick = () => {
        if (isSpinning) return;
        if (userEgoTokens < 100) {
            alert("Không đủ EGO TOKENS! Sút tung lưới đối phương để kiếm thêm!");
            return;
        }

        isSpinning = true;
        userEgoTokens -= 100;
        document.getElementById('ui-tokens').innerText = userEgoTokens;

        const egoistKeys = Object.keys(EGOISTS);
        let counter = 0;
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
        const rollChance = Math.random() * 100;
        let selectedKey = 'isagi';

        if (rollChance < 1) { selectedKey = 'kaiser'; }
        else if (rollChance < 11) { selectedKey = 'rin'; }
        else if (rollChance < 21) { selectedKey = 'nagi'; }
        else if (rollChance < 50) { selectedKey = 'chigiri'; }
        else if (rollChance < 75) { selectedKey = 'bachira'; }
        else { selectedKey = 'isagi'; }

        const finalChar = EGOISTS[selectedKey];
        spinResultName.innerText = finalChar.name.toUpperCase();
        spinResultRarity.innerText = finalChar.rarity;

        if (finalChar.rarity.includes("LEGENDARY")) spinResultRarity.style.color = "#d4ac0d";
        else if (finalChar.rarity.includes("EPIC")) spinResultRarity.style.color = "#a22b21";
        else spinResultRarity.style.color = "#3498db";

        currentEgoistKey = selectedKey;
        const oldPos = player.position.clone();
        scene.remove(player);
        player = createLegoCharacter(selectedKey);
        player.position.copy(oldPos);
        scene.add(player);

        document.getElementById('ui-char-name').innerText = finalChar.name.toUpperCase();
        document.getElementById('ui-char-skill').innerText = "SKILL: " + finalChar.skill;
        document.getElementById('ui-spd').innerText = finalChar.stats.speed;
        document.getElementById('ui-sht').innerText = finalChar.stats.shoot;
        document.getElementById('ui-drb').innerText = finalChar.stats.dribble;

        isSpinning = false;
    }

    // --- 13. MAIN GAMEPLAY LOOP (REAL-TIME ENGINE) ---
    function animate() {
        requestAnimationFrame(animate);

        if (isTeleporting) {
            renderer.render(scene, camera);
            return;
        }

        // A. Di chuyển người chơi
        let speed = 0.16;
        const forwardX = -Math.sin(yaw), forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);

        let moveX = 0, moveZ = 0;
        if (keys.w) { moveX += forwardX; moveZ += forwardZ; }
        if (keys.s) { moveX -= forwardX; moveZ -= forwardZ; }
        if (keys.a) { moveX -= rightX; moveZ -= rightZ; }
        if (keys.d) { moveX += rightX; moveZ += rightZ; }

        let length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        let isPlayerMoving = length > 0;

        if (isPlayerMoving) {
            player.position.x += (moveX / length) * speed;
            player.position.z += (moveZ / length) * speed;
            player.rotation.y = yaw;

            player.userData.legSwing += 0.18;
            player.userData.legL.rotation.x = Math.sin(player.userData.legSwing) * 0.6;
            player.userData.legR.rotation.x = -Math.sin(player.userData.legSwing) * 0.6;
        } else {
            player.userData.legL.rotation.x = 0;
            player.userData.legR.rotation.x = 0;
        }

        if (keys[' '] && isGrounded) {
            playerVelocityY = 0.22;
            isGrounded = false;
        }
        if (!isGrounded) {
            player.position.y += playerVelocityY;
            playerVelocityY -= 0.012;
            if (player.position.y <= 0) {
                player.position.y = 0;
                playerVelocityY = 0;
                isGrounded = true;
            }
        }

        player.position.x = Math.max(-23.8, Math.min(23.8, player.position.x));
        player.position.z = Math.max(-23.8, Math.min(23.8, player.position.z));

        // B. Truyền tọa độ di chuyển của mình sang tab kia
        if (isMatchActive && onlineOpponentId) {
            bc.postMessage({
                type: 'player_move',
                senderId: myId,
                x: player.position.x,
                y: player.position.y,
                z: player.position.z,
                rotY: player.rotation.y,
                legSwing: player.userData.legSwing
            });
        }

        // C. Va chạm và rê bóng
        let distToBall = player.position.distanceTo(ball.position);
        if (distToBall < 1.3) {
            const lookDirX = -Math.sin(player.rotation.y);
            const lookDirZ = -Math.cos(player.rotation.y);
            ball.position.x = player.position.x + lookDirX * 1.3;
            ball.position.z = player.position.z + lookDirZ * 1.3;

            // Truyền tọa độ quả bóng khi đang rê dắt
            if (isMatchActive && onlineOpponentId) {
                bc.postMessage({
                    type: 'ball_kick',
                    senderId: myId,
                    px: ball.position.x,
                    pz: ball.position.z,
                    vx: 0,
                    vz: 0
                });
            }
        }

        ball.position.x += ballVelocity.x;
        ball.position.z += ballVelocity.z;
        ballVelocity.x *= 0.95;
        ballVelocity.z *= 0.95;

        if (Math.abs(ball.position.x) > 23.8) { ballVelocity.x *= -0.8; ball.position.x = Math.sign(ball.position.x) * 23.8; }
        if (Math.abs(ball.position.z) > 23.8) { ballVelocity.z *= -0.8; ball.position.z = Math.sign(ball.position.z) * 23.8; }

        // D. Kích hoạt AI nếu là đấu Bot
        if (isMatchActive && !onlineOpponentId) {
            updateOpponentAI();
        }

        // E. Hệ thống tính bàn thắng
        // 1. Sút vào gôn đối thủ (Z <= -16.2)
        if (ball.position.z <= -16.2 && Math.abs(ball.position.x) < 2.5) {
            playerScore++;
            document.getElementById('score-player').innerText = playerScore;
            
            triggerGoalEffect("⚽ YOU GOAL! +100 TOKENS");
            userEgoTokens += 100;
            document.getElementById('ui-tokens').innerText = userEgoTokens;

            if (isMatchActive && onlineOpponentId) {
                bc.postMessage({
                    type: 'score_update',
                    senderId: myId,
                    playerScore: playerScore,
                    rivalScore: rivalScore
                });
            }
            resetRound();
        }

        // 2. Để lọt lưới nhà (Z >= 16.2)
        if (ball.position.z >= 16.2 && Math.abs(ball.position.x) < 2.5) {
            rivalScore++;
            document.getElementById('score-rival').innerText = rivalScore;

            triggerGoalEffect("💀 RIVAL SCORED!");
            resetRound();
        }

        // F. Kiểm tra chạm bệ tương tác
        let distToSpin = player.position.distanceTo(new THREE.Vector3(spinPad.x, 0, spinPad.z));
        if (distToSpin < 2.0) {
            if (spinModal.style.transform !== 'translate(-50%, -50%) scale(1)') {
                spinModal.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        }

        let distToTerminal = player.position.distanceTo(new THREE.Vector3(teleportTerminal.x, 0, teleportTerminal.z));
        if (distToTerminal < 1.8 && !isTeleporting) {
            triggerMatchmaking();
        }

        // G. Camera theo dõi (Roblox Shiftlock style)
        const cameraDistance = 10;
        let camX = player.position.x + cameraDistance * Math.sin(yaw) * Math.cos(pitch);
        let camY = player.position.y + cameraDistance * Math.sin(pitch) + 1.2;
        let camZ = player.position.z + cameraDistance * Math.cos(yaw) * Math.cos(pitch);

        camera.position.set(camX, camY, camZ);
        camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)));

        renderer.render(scene, camera);
    }
    animate();

    function resetBall() {
        ball.position.set(0, 0.5, 0);
        ballVelocity = { x: 0, z: 0 };
    }

    function resetRound() {
        resetBall();
        player.position.set(0, 0, 8);
        if (opponent) {
            opponent.position.set(0, 0, -8);
        }
    }

    function triggerGoalEffect(text) {
        const effect = document.createElement('div');
        effect.style.cssText = 'position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); padding: 15px 30px; background: rgba(0,0,0,0.85); color: #00ffff; border: 2px solid #00ffff; font-size: 32px; font-family: Impact; text-shadow: 0 0 10px #00ffff; border-radius: 8px; z-index: 500; animation: fadeUp 1.5s forwards; pointer-events: none;';
        effect.innerText = text;
        document.body.appendChild(effect);
        setTimeout(() => document.body.removeChild(effect), 1500);
    }

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
