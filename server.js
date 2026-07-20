const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Báo cho server biết thư mục 'public' là nơi chứa game
app.use(express.static(__dirname + '/public'));

const players = {}; // Danh sách người chơi

io.on('connection', (socket) => {
    console.log('🔥 Một người chơi vừa kết nối! ID:', socket.id);
    
    // Tạo data cho người chơi mới
    players[socket.id] = { x: 0, y: 0, z: 0 };
    
    // Gửi danh sách người chơi hiện tại cho người mới vào
    socket.emit('currentPlayers', players);
    
    // Báo cho các máy khác biết có người mới vào
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    // Khi người chơi di chuyển, cập nhật và báo cho máy khác
    socket.on('playerMovement', (movementData) => {
        players[socket.id] = movementData;
        socket.broadcast.emit('playerMoved', { id: socket.id, position: movementData });
    });

    // Khi có người thoát game
    socket.on('disconnect', () => {
        console.log('❌ Người chơi đã thoát! ID:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Chạy server ở cổng 3000
http.listen(3000, () => {
    console.log('🚀 Server Game đang chạy tại: http://localhost:3000');
});
