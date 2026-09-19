// Automated Test for Multiplayer Server & Room Joining
import { WebSocket } from 'ws';

const PORT = 8080;
const URL = `ws://localhost:${PORT}`;

console.log('Testing Multiplayer WebSocket Server at', URL);

async function runTest() {
    // 1. Host connects and creates room
    const hostWs = new WebSocket(URL);

    let roomCode = null;
    let hostId = null;
    let guestId = null;
    let currentSeekerId = null;

    await new Promise((resolve, reject) => {
        hostWs.on('open', () => {
            console.log('✓ Host connected to WebSocket');
            hostWs.send(JSON.stringify({ type: 'CREATE_ROOM', playerName: 'GaneshaHost' }));
        });

        hostWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'ROOM_CREATED') {
                console.log('✓ Room successfully created! Code:', data.roomCode, 'PlayerId:', data.playerId);
                roomCode = data.roomCode;
                hostId = data.playerId;
                resolve();
            }
        });

        hostWs.on('error', reject);
        setTimeout(() => reject(new Error('Host creation timeout')), 4000);
    });

    if (!roomCode) throw new Error('No room code generated');

    // 2. Guest connects and joins the room with the code
    const guestWs = new WebSocket(URL);
    let guestJoined = false;
    let hostSawGuest = false;

    await new Promise((resolve, reject) => {
        guestWs.on('open', () => {
            console.log('✓ Guest connected, joining room:', roomCode);
            guestWs.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, playerName: 'MushikaGuest' }));
        });

        guestWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'ROOM_JOINED') {
                console.log('✓ Guest received ROOM_JOINED with', data.players.length, 'players in room');
                guestId = data.playerId;
                guestJoined = true;
                if (hostSawGuest) resolve();
            }
        });

        hostWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'ROOM_UPDATE') {
                console.log('✓ Host received ROOM_UPDATE! Player list:', data.players.map(p => p.name));
                hostSawGuest = true;
                if (guestJoined) resolve();
            }
        });

        guestWs.on('error', reject);
        setTimeout(() => reject(new Error('Guest join timeout')), 4000);
    });

    // 3. Host starts game
    await new Promise((resolve, reject) => {
        let hostSawStart = false;
        let guestSawStart = false;

        const checkBoth = () => {
            if (hostSawStart && guestSawStart) {
                console.log('✓ Both players received GAME_START simultaneously!');
                resolve();
            }
        };

        hostWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'GAME_START') {
                console.log('✓ Host got GAME_START. Seeker is:', data.seekerId, 'Hide duration:', data.hideDuration);
                if (data.hideDuration !== 45.0) {
                    reject(new Error(`Expected hideDuration 45.0s, got ${data.hideDuration}`));
                    return;
                }
                currentSeekerId = data.seekerId;
                hostSawStart = true;
                checkBoth();
            }
        });

        guestWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'GAME_START') {
                console.log('✓ Guest got GAME_START. Seeker is:', data.seekerId, 'Hide duration:', data.hideDuration);
                if (data.hideDuration !== 45.0) {
                    reject(new Error(`Expected hideDuration 45.0s, got ${data.hideDuration}`));
                    return;
                }
                guestSawStart = true;
                checkBoth();
            }
        });

        console.log('✓ Host sending START_GAME...');
        hostWs.send(JSON.stringify({ type: 'START_GAME' }));
        setTimeout(() => reject(new Error('Game start timeout')), 4000);
    });

    // 4. Movement sync test
    await new Promise((resolve, reject) => {
        guestWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'PLAYER_MOVE' && data.id === hostId) {
                console.log('✓ Guest received host movement position:', data.pos, 'morph:', data.morph);
                resolve();
            }
        });

        hostWs.send(JSON.stringify({
            type: 'MOVE',
            pos: { x: 1.25, y: 0.5, z: 4.8 },
            rot: 1.57,
            morph: 'modak',
            isFrozen: false
        }));

        setTimeout(() => reject(new Error('Movement sync timeout')), 4000);
    });

    // 5. Taunt sync test
    await new Promise((resolve, reject) => {
        guestWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'TAUNT' && data.id === hostId) {
                console.log('✓ Guest received TAUNT sound from host at:', data.pos);
                resolve();
            }
        });

        hostWs.send(JSON.stringify({
            type: 'TAUNT',
            pos: { x: 0, y: 0.5, z: 2.0 },
            massClass: 'light'
        }));

        setTimeout(() => reject(new Error('Taunt sync timeout')), 4000);
    });

    // 6. Phase change broadcast test
    await new Promise((resolve, reject) => {
        guestWs.on('message', (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'PHASE_CHANGE' && data.phase === 'SEEK') {
                console.log('✓ Guest synchronized to phase SEEK with timer:', data.timer);
                resolve();
            }
        });

        hostWs.send(JSON.stringify({
            type: 'PHASE_CHANGE',
            phase: 'SEEK',
            timer: 60.0
        }));

        setTimeout(() => reject(new Error('Phase change timeout')), 4000);
    });

    // 7. Tag Accusation & Game Over
    await new Promise((resolve, reject) => {
        let tagReceived = false;
        let gameOverReceived = false;

        const checkBoth = () => {
            if (tagReceived && gameOverReceived) {
                console.log('✓ Tag confirmation and Game Over verified!');
                resolve();
            }
        };

        const onMsg = (raw) => {
            const data = JSON.parse(raw.toString());
            if (data.type === 'PLAYER_TAGGED') {
                console.log('✓ Received PLAYER_TAGGED:', data.targetName, 'Remaining:', data.remainingHiders);
                tagReceived = true;
                checkBoth();
            }
            if (data.type === 'GAME_OVER') {
                console.log('✓ Received GAME_OVER! Winner:', data.winner);
                gameOverReceived = true;
                checkBoth();
            }
        };

        hostWs.on('message', onMsg);
        guestWs.on('message', onMsg);

        // Seeker tags the hider
        const seekerWs = (currentSeekerId === hostId) ? hostWs : guestWs;
        const targetHiderId = (currentSeekerId === hostId) ? guestId : hostId;
        console.log(`✓ Seeker (${currentSeekerId}) tagging Hider (${targetHiderId})...`);
        seekerWs.send(JSON.stringify({
            type: 'TAG_CONFIRMED',
            targetId: targetHiderId
        }));

        setTimeout(() => reject(new Error('Tag confirmation timeout')), 4000);
    });

    console.log('\n🎉 ALL MULTIPLAYER TESTS PASSED 100%! CLOSING CONNECTIONS.');
    hostWs.close();
    guestWs.close();
    process.exit(0);
}

runTest().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
