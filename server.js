const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Phục vụ các file tĩnh (game.js, hình ảnh...) ngay tại thư mục gốc
app.use(express.static(__dirname));

// Trả về file index.html khi có người truy cập vào link Render
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- QUẢN LÝ MATCHMAKING VÀ ĐỒNG BỘ 2 MÁY ---
const players = {}; 

io.on('connection', (socket) => {
    console.log('🔥 Một cầu thủ vừa vào sân! ID:', socket.id);
    
    // Khởi tạo tọa độ mặc định cho người chơi mới
    players[socket.id] = { x: 0, y: 0, z: 0 };
    
    // Gửi danh sách các người chơi hiện tại cho máy mới vào
    socket.emit('currentPlayers', players);
    
    // Báo cho các máy khác biết có người mới vào sân
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    // Khi một máy di chuyển, cập nhật tọa độ và gửi cho máy còn lại
    socket.on('playerMovement', (movementData) => {
        players[socket.id] = movementData;
        socket.broadcast.emit('playerMoved', { id: socket.id, position: movementData });
    });

    // Khi có người thoát game hoặc mất mạng
    socket.on('disconnect', () => {
        console.log('❌ Một cầu thủ đã rời sân! ID:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Cấu hình cổng chạy tự động tương thích với Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server Blue Lock đang chạy tại port: ${PORT}`);
});
