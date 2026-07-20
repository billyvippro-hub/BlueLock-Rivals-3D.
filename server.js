const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path'); // THÊM DÒNG NÀY ĐỂ XỬ LÝ ĐƯỜNG DẪN

// 1. Chỉ định thư mục public một cách rõ ràng tuyệt đối
app.use(express.static(path.join(__dirname, 'public')));

// 2. Ép server trả về file index.html khi có người truy cập vào link
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// 3. RẤT QUAN TRỌNG: Render bắt buộc phải dùng process.env.PORT
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`🚀 Server Game đang chạy tại port: ${PORT}`);
});
