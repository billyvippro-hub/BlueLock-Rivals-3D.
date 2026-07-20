const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// 1. Phục vụ các file tĩnh (như game.js) ngay tại thư mục gốc
app.use(express.static(__dirname));

// 2. Trả về file index.html nằm ngay ở ngoài cùng khi có người vào link
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- GIỮ NGUYÊN TÍNH NĂNG MẠNG CŨ CỦA BRO ---
const players = {}; 

io.on('connection', (socket) => {
    console.log('🔥 Một người chơi vừa kết nối! ID:', socket.id);
    
    players[socket.id] = { x: 0, y: 0, z: 0 };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    socket.on('playerMovement', (movementData) => {
        players[socket.id] = movementData;
        socket.broadcast.emit('playerMoved', { id: socket.id, position: movementData });
    });

    socket.on('disconnect', () => {
        console.log('❌ Người chơi đã thoát! ID:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// 3. Cổng chạy cho Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server Game đang chạy tại port: ${PORT}`);
});
