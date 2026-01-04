import { addUser, removeUser } from "../state/connection.js";

export const handleConnectionEvents = (io, socket) => {
    socket.on("join", (user) => {
        // --- CORREÇÃO CRÍTICA ---
        // Guardamos os dados diretamente no objeto do socket
        socket.data.userID = user.id;
        socket.data.userName = user.name;
        // ------------------------
        
        addUser(socket, user);
        console.log(`[Connection] User ${user.name} (ID: ${user.id}) joined.`);
    });

    socket.on("disconnect", () => {
        removeUser(socket.id);
    });
};