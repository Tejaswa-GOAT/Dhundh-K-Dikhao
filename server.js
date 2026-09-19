import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

const MIME = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json; charset=UTF-8',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg'
};

// ═══════════════════════════════════════════════════════
// HTTP STATIC FILE SERVER
// ═══════════════════════════════════════════════════════
const server = http.createServer((req, res) => {
    let reqUrl = decodeURIComponent(req.url.split('?')[0]);
    if (reqUrl === '/healthz' || reqUrl === '/ping') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('OK');
    }
    if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';

    let safePath = path.normalize(path.join(__dirname, reqUrl));
    if (!safePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Access denied');
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(safePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If it's a static file request (.js, .css, images, etc.), do NOT fallback to index.html
                if (ext && ext !== '.html') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    return res.end(`404 Not Found: ${reqUrl}`);
                }

                // SPA Fallback to index.html for navigation routes
                fs.readFile(path.join(__dirname, 'index.html'), (fallbackErr, indexHtml) => {
                    if (fallbackErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, {
                            'Content-Type': 'text/html; charset=UTF-8',
                            'Cache-Control': 'no-cache'
                        });
                        res.end(indexHtml);
                    }
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content);
        }
    });
});

// ═══════════════════════════════════════════════════════
// MULTIPLAYER ROOM & WEBSOCKET ENGINE
// ═══════════════════════════════════════════════════════
const wss = new WebSocketServer({ server });

const rooms = new Map(); // roomCode -> Room Object
let nextClientId = 1;

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
    } while (rooms.has(code));
    return code;
}

function broadcastToRoom(roomCode, msg, excludeWs = null) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
    for (const [id, player] of room.players) {
        if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(str);
        }
    }
}

function getRosterData(room) {
    const roster = [];
    for (const [id, player] of room.players) {
        roster.push({
            id: player.id,
            name: player.name,
            isHost: player.id === room.hostId,
            role: player.role,
            isReady: player.isReady
        });
    }
    return roster;
}

wss.on('connection', (ws) => {
    ws.id = `p_${nextClientId++}`;
    ws.roomCode = null;
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            handleClientMessage(ws, data);
        } catch (err) {
            console.error('[WS Error] Failed to parse message:', err);
        }
    });

    ws.on('close', () => {
        handleClientDisconnect(ws);
    });
});

function handleClientMessage(ws, data) {
    const type = data.type;

    // 1. CREATE ROOM
    if (type === 'CREATE_ROOM') {
        const code = generateRoomCode();
        const playerName = (data.playerName || 'Player 1').trim().slice(0, 16);

        const room = {
            code,
            hostId: ws.id,
            state: 'LOBBY', // 'LOBBY' | 'HIDE' | 'SEEK' | 'RESULT'
            players: new Map(),
            countdown: null,
            phaseTimer: 0
        };

        const player = {
            id: ws.id,
            name: playerName,
            ws,
            isReady: true,
            role: 'hider',
            pos: { x: 0, y: 0.45, z: 7.0 },
            rot: 0,
            morph: null,
            isFrozen: false,
            isTagged: false
        };

        room.players.set(ws.id, player);
        rooms.set(code, room);
        ws.roomCode = code;

        ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode: code,
            playerId: ws.id,
            players: getRosterData(room)
        }));
        console.log(`[Room ${code}] Created by ${playerName} (${ws.id})`);
        return;
    }

    // 2. JOIN ROOM
    if (type === 'JOIN_ROOM') {
        const targetCode = String(data.roomCode || '').toUpperCase().trim();
        const playerName = (data.playerName || 'Player 2').trim().slice(0, 16);

        const room = rooms.get(targetCode);
        if (!room) {
            ws.send(JSON.stringify({
                type: 'JOIN_ERROR',
                message: `Room "${targetCode}" not found! Check the 4-letter code.`
            }));
            return;
        }

        if (room.state !== 'LOBBY') {
            ws.send(JSON.stringify({
                type: 'JOIN_ERROR',
                message: `Match in room "${targetCode}" is already in progress!`
            }));
            return;
        }

        if (room.players.size >= 8) {
            ws.send(JSON.stringify({
                type: 'JOIN_ERROR',
                message: `Room "${targetCode}" is full (maximum 8 players)!`
            }));
            return;
        }

        // Add player to room
        const player = {
            id: ws.id,
            name: playerName,
            ws,
            isReady: true,
            role: 'hider',
            pos: { x: 0, y: 0.45, z: 7.0 },
            rot: 0,
            morph: null,
            isFrozen: false,
            isTagged: false
        };

        room.players.set(ws.id, player);
        ws.roomCode = targetCode;

        // Notify joiner
        ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: targetCode,
            playerId: ws.id,
            players: getRosterData(room)
        }));

        // Notify all room members of updated roster
        broadcastToRoom(targetCode, {
            type: 'ROOM_UPDATE',
            roomCode: targetCode,
            players: getRosterData(room),
            message: `${playerName} joined the room!`
        });

        console.log(`[Room ${targetCode}] ${playerName} joined (${ws.id}). Total players: ${room.players.size}`);
        return;
    }

    // Must be in a room for subsequent game messages
    const roomCode = ws.roomCode;
    const room = roomCode ? rooms.get(roomCode) : null;
    if (!room) return;

    // 3. START GAME (Host starts or trigger party match)
    if (type === 'START_GAME') {
        if (room.hostId !== ws.id && !data.force) {
            return; // Only host can start
        }

        // Role assignment:
        // 1 player is chosen as Seeker (Bala), others are Hiders (Mushika)
        const playerIds = Array.from(room.players.keys());
        const seekerIdx = Math.floor(Math.random() * playerIds.length);
        const seekerId = playerIds[seekerIdx];

        room.state = 'HIDE';
        const HIDE_TIME = 45.0;
        const SEEK_TIME = 60.0;

        for (const [id, p] of room.players) {
            p.role = (id === seekerId) ? 'seeker' : 'hider';
            p.isTagged = false;
            p.morph = null;
            p.isFrozen = false;
        }

        broadcastToRoom(roomCode, {
            type: 'GAME_START',
            seekerId,
            hideDuration: HIDE_TIME,
            seekDuration: SEEK_TIME,
            players: getRosterData(room)
        });

        console.log(`[Room ${roomCode}] Match started! Seeker: ${seekerId}, Players: ${playerIds.length}`);
        return;
    }

    // 4. PLAYER MOVEMENT & TRANSFORM SYNC
    if (type === 'MOVE') {
        const player = room.players.get(ws.id);
        if (player) {
            player.pos = data.pos;
            player.rot = data.rot;
            player.morph = data.morph;
            player.isFrozen = !!data.isFrozen;
            player.isOrientationLocked = !!data.isOrientationLocked;

            // Broadcast to other players in the room
            broadcastToRoom(roomCode, {
                type: 'PLAYER_MOVE',
                id: ws.id,
                pos: data.pos,
                rot: data.rot,
                morph: data.morph,
                isFrozen: player.isFrozen,
                isOrientationLocked: player.isOrientationLocked
            }, ws);
        }
        return;
    }

    // 5. TAG ACCUSATION / CONFIRMATION
    if (type === 'TAG_CONFIRMED') {
        const targetId = data.targetId;
        const targetPlayer = room.players.get(targetId);

        if (targetPlayer && !targetPlayer.isTagged) {
            targetPlayer.isTagged = true;

            // Calculate remaining active hiders
            let remainingHiders = 0;
            for (const [id, p] of room.players) {
                if (p.role === 'hider' && !p.isTagged) {
                    remainingHiders++;
                }
            }

            broadcastToRoom(roomCode, {
                type: 'PLAYER_TAGGED',
                targetId,
                targetName: targetPlayer.name,
                remainingHiders,
                message: `🎉 ${targetPlayer.name} was discovered and tagged!`
            });

            console.log(`[Room ${roomCode}] ${targetPlayer.name} tagged! Remaining hiders: ${remainingHiders}`);

            // If no more hiders, Seeker wins!
            if (remainingHiders === 0) {
                room.state = 'RESULT';
                broadcastToRoom(roomCode, {
                    type: 'GAME_OVER',
                    winner: 'seeker',
                    message: 'Bala Found All Disguised Mushikas! Seeker Wins!'
                });
            }
        }
        return;
    }

    // 6. PHASE TRANSITIONS (e.g., Hide timer ends -> Aarti -> Seek phase)
    if (type === 'PHASE_CHANGE') {
        room.state = data.phase;
        broadcastToRoom(roomCode, {
            type: 'PHASE_CHANGE',
            phase: data.phase,
            timer: data.timer
        }, ws);
        return;
    }

    // 7. TIME EXPIRED (Hiders Win)
    if (type === 'TIME_EXPIRED') {
        if (room.state !== 'RESULT') {
            room.state = 'RESULT';
            broadcastToRoom(roomCode, {
                type: 'GAME_OVER',
                winner: 'hider',
                message: 'Time Expired! The Disguised Mushikas Remained Undetected!'
            });
        }
        return;
    }

    // 8. TAUNT EVENT SYNC
    if (type === 'TAUNT') {
        broadcastToRoom(roomCode, {
            type: 'TAUNT',
            id: ws.id,
            pos: data.pos,
            massClass: data.massClass || 'micro'
        }, ws);
        return;
    }

    // 9. REMATCH / PLAY AGAIN
    if (type === 'REMATCH') {
        // Reset player states and start fresh match
        for (const [id, p] of room.players) {
            p.isTagged = false;
            p.morph = null;
            p.isFrozen = false;
        }
        // Swap or randomize seeker
        const playerIds = Array.from(room.players.keys());
        const prevSeekerId = playerIds.find(id => room.players.get(id).role === 'seeker');
        const remaining = playerIds.filter(id => id !== prevSeekerId);
        const newSeekerId = (remaining.length > 0) ? remaining[0] : prevSeekerId;

        room.state = 'HIDE';
        for (const [id, p] of room.players) {
            p.role = (id === newSeekerId) ? 'seeker' : 'hider';
        }

        broadcastToRoom(roomCode, {
            type: 'GAME_START',
            seekerId: newSeekerId,
            hideDuration: 45.0,
            seekDuration: 60.0,
            players: getRosterData(room)
        });
        return;
    }

    // 10. LEAVE ROOM
    if (type === 'LEAVE_ROOM') {
        handleClientDisconnect(ws);
        return;
    }
}

function handleClientDisconnect(ws) {
    const roomCode = ws.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const leavingPlayer = room.players.get(ws.id);
    const leavingName = leavingPlayer ? leavingPlayer.name : 'A player';

    room.players.delete(ws.id);
    ws.roomCode = null;

    console.log(`[Room ${roomCode}] ${leavingName} disconnected. Left: ${room.players.size}`);

    // If room is empty, clean up
    if (room.players.size === 0) {
        rooms.delete(roomCode);
        console.log(`[Room ${roomCode}] Room empty and cleaned up.`);
        return;
    }

    // If host left, appoint new host
    if (room.hostId === ws.id) {
        const nextHost = room.players.keys().next().value;
        room.hostId = nextHost;
    }

    // Notify remaining players
    broadcastToRoom(roomCode, {
        type: 'PLAYER_LEFT',
        id: ws.id,
        name: leavingName,
        players: getRosterData(room),
        message: `${leavingName} left the room.`
    });
}

// Keepalive Heartbeat Interval (30s)
const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(heartbeat);
});

server.listen(PORT, () => {
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`🪔 Mushika Mandap Multiplayer Server Live!`);
    console.log(`🎮 Port: http://localhost:${PORT}`);
    console.log(`🌐 Ready for local play & cloud deployment`);
    console.log(`═══════════════════════════════════════════════════`);
});
