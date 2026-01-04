import { Server } from "socket.io";
import { createServer } from "http";
import { handleConnectionEvents } from './events/connection.js';
import { handleGameEvents } from './events/game.js';

export const server = { io: null };

export const serverStart = (port) => {
    const httpServer = createServer();
    
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Permite conexão do Vue (localhost:5173)
            methods: ["GET", "POST"]
        }
    });

    server.io = io;

    io.on("connection", (socket) => {
        handleConnectionEvents(io, socket);
        handleGameEvents(io, socket);
    });

    httpServer.listen(port);
};