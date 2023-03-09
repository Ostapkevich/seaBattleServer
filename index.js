"use strict";
exports.__esModule = true;
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var httpServer = (0, http_1.createServer)();
var originHost;
if (process.env.PORT) {
    originHost = 'https://seabattle.herokuapp.com';
}
else {
    originHost = "http://localhost:4200";
}
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: originHost,
        methods: ["GET", "POST"]
    }
});
var users = {};
function updatePlayerStatus(id, status) {
    for (var key in users) {
        if (key === id) {
            if (status === false) {
                users[id] = users[id].replace('🟢', '🔵');
            }
            else {
                users[id] = users[id].replace('🔵', '🟢');
            }
        }
    }
}
io.on("connection", function (socket) {
    socket.on("createNewUser", function (name, callback) {
        var _a, _b;
        try {
            callback({ status: "ok" }, users);
            Object.assign(users, (_a = {}, _a[socket.id] = name + '🟢', _a));
            socket.broadcast.emit('addNewUser', (_b = {}, _b[socket.id] = name + '🟢', _b));
        }
        catch (error) {
            callback({ status: error.message });
        }
    });
    socket.on('inviteToPlay', function (idTo, callback) {
        try {
            if (users[idTo].lastIndexOf('🔵') > 0) {
                callback({ status: "\u0418\u0433\u0440\u043E\u043A ".concat(users[idTo], " \u0443\u0436\u0435 \u0438\u0433\u0440\u0430\u0435\u0442!") });
            }
            else {
                callback({ status: 'ok' });
            }
            io.to(idTo).emit('inviteToPlay', socket.id);
        }
        catch (error) {
            callback({ status: error.message });
        }
    });
    socket.on('invitationResponse', function (idFrom, confirmStatus, callback) {
        try {
            callback({ status: "ok" });
            io.to(idFrom).emit('invitationResponse', socket.id, confirmStatus);
            if (confirmStatus === '1') {
                updatePlayerStatus(idFrom, false);
                updatePlayerStatus(socket.id, false);
                io.emit('statusTwoPlayersBusy', idFrom, socket.id);
            }
        }
        catch (error) {
            callback({ status: error.message });
        }
    });
    socket.emit('addExistingUsers', users);
    socket.on('mePlayMarkFalse', function () {
        updatePlayerStatus(socket.id, true);
        socket.broadcast.emit('mePlayMarkFalse', socket.id);
    });
    socket.on('messageToServer', function (idTo, between, usrMessage, idMessage, callback) {
        try {
            callback({ status: 'ok' });
            io.to(idTo).emit('messageToUser', socket.id, between, usrMessage, idMessage);
        }
        catch (error) {
            callback({ status: error.message });
        }
    });
    socket.on('gotAnswer', function (idFrom, between, usrMessage, idMessage, callback) {
        try {
            callback({ status: "ok" });
            io.to(idFrom).emit('gotAnswer', between, usrMessage, idMessage);
        }
        catch (error) {
            callback({ status: error.message });
        }
    });
    socket.on("disconnect", function () {
        for (var key in users) {
            if (key === socket.id) {
                delete users[key];
                io.emit('quitUser', socket.id);
                return;
            }
        }
    });
    socket.on('shot', function (idTo, coord, callback) {
        try {
            io.to(idTo).timeout(20000).emit('shot', coord, function (err, response) {
                try {
                    if (err) {
                        callback({ errorMessage: 'Проблемы с интернет соединением у противника! ' + err.message });
                    }
                    else {
                        callback(response[0]);
                    }
                }
                catch (error) {
                    callback({ foundCoord: false, gameContinue: false, errorMessage: error.message });
                }
            });
        }
        catch (error) {
            callback({ foundCoord: false, gameContinue: false, errorMessage: error.message });
        }
    });
});
var PORT = process.env.PORT || 3000;
httpServer.listen(PORT, function () { console.log('Server is running!'); });
