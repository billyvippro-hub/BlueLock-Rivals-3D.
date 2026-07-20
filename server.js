const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- HỆ THỐNG MATCHMAKING ĐỒNG BỘ ĐỐI THỦ ---
const players = {}; 

io.on('connection', (socket) => {
    console.log('🔥 Cầu thủ mới kết nối:', socket.id);
    
    // Tọa độ khởi tạo của người chơi mới
    players[socket.id] = { x: 0, y: 0, z: 0 };
    
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    socket.on('playerMovement', (movementData) => {
        players[socket.id] = movementData;
        socket.broadcast.emit('playerMoved', { id: socket.id, position: movementData });
    });

    socket.on('disconnect', () => {
        console.log('❌ Cầu thủ thoát:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại port: ${PORT}`);
});
