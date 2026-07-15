// Kéo các thư viện cần thiết về
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// Cấu hình Socket.io cho phép kết nối từ bên ngoài (CORS) để GitHub Pages gọi tới được
const io = socketIo(server, {
    cors: {
        origin: "*", // Cho phép tất cả các nguồn kết nối để test cho dễ
        methods: ["GET", "POST"]
    }
});

// Chỉ định thư mục chứa Frontend (chính là thư mục gốc của dự án)
app.use(express.static(path.join(__dirname, './')));

// Quản lý danh sách người chơi trực tuyến trên sân cỏ
let players = {};

io.on('connection', (socket) => {
    console.log(`⚽ Có tiền đạo mới gia nhập sân! ID: ${socket.id}`);

    // Tạo mới một "cục gạch" cho người chơi vừa kết nối
    players[socket.id] = {
        x: 0,
        z: 0,
        color: '#ff0000', // Đỏ nguyên bản
        isFlow: false
    };

    // Gửi danh sách người chơi hiện tại cho người mới vào
    socket.emit('currentPlayers', players);

    // Báo cho những người chơi khác biết có một đối thủ mới vừa vào sân
    socket.broadcast.emit('newPlayer', { playerId: socket.id, playerInfo: players[socket.id] });

    // Nghe ngóng khi có người di chuyển hoặc bật Flow
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].z = movementData.z;
            players[socket.id].color = movementData.color;
            players[socket.id].isFlow = movementData.isFlow;
            
            // Phát tán tọa độ mới này cho toàn bộ phòng đấu
            socket.broadcast.emit('playerMoved', { playerId: socket.id, playerInfo: players[socket.id] });
        }
    });

    // Khi có người thoát game hoặc rớt mạng
    socket.on('disconnect', () => {
        console.log(`❌ Tiền đạo ID ${socket.id} đã rời sân đấu.`);
        delete players[socket.id];
        // Báo cho cả phòng xóa cục gạch của thằng này đi
        io.emit('playerDisconnected', socket.id);
    });
});

// Render sẽ tự động cấp cổng (Port) thông qua biến môi trường process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🔥 Server Blue Lock Rivals đang bùng nổ tại port ${PORT} 🔥`);
});
