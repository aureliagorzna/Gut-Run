const audioButton = document.getElementById("audioToggle");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 640;

canvas.style.touchAction = "none";

const clickTag = window.clickTag || 'https://example.com/landing';

// <----------------------- SETTINGS -----------------------> //

const DEBUG = false;
let currentView = "game"; // game | win | fail
let hasGameStarted = false;
let isGameRunning = false
let isAudioMuted = false;
const gameSpeed = 0.3; // how fast gameplay image is moving
const playerFallSpeed = 3; // how fast the player is falling
const playerJumpSpeed = 4; // how fast player moves during a jump
const playerJumpDistance = 15
const timeoutAfterJump = 300; // how long player doesn't fall after a jump
const startDelay = 1000
const failScreenDelay = 1200

let playerPos = 300; // starting Y pos
const minPlayerPos = 580;
const maxPlayerPos = 200;
const gameplayLimit = 0.3; // 1 means full width of gameplay texture is used
let isJumpHeld = false;
let isFallingDisabled = false;

// <----------------------- LOAD ASSETS -----------------------> //

const assetSources = {
    background: "./assets/bg.jpg",
    gesture: "./assets/gesture.png",
    bgTexture: "./assets/01_game/bg_texture.png",
    logo: "./assets/logo.png",
    tut: "./assets/01_game/tut.png",
    border: "./assets/border.png",
    gameplay: "./assets/01_game/gameplay.png",
    player: "./assets/01_game/player.png",
    bac1: "./assets/01_game/bac1.png",
    bac2: "./assets/01_game/bac2.png",
    bac3: "./assets/01_game/bac3.png",
    bac4: "./assets/01_game/bac4.png",
    bac5: "./assets/01_game/bac5.png",
    bac6: "./assets/01_game/bac6.png",
    txt1: "./assets/01_game/txt1.png",
    txt2: "./assets/01_game/txt2.png",
    txt3: "./assets/01_game/txt3.png",
    txt4: "./assets/01_game/txt4.png",
    txt5: "./assets/01_game/txt5.png",
    txt6: "./assets/01_game/txt6.png",
    txt7: "./assets/01_game/txt7.png",
    txt8: "./assets/01_game/txt8.png",
    txt9: "./assets/01_game/txt9.png",

    win: {
        bubble: "./assets/02_endcard/win/bubble.png",
        cta: "./assets/02_endcard/win/cta.png",
        happy: "./assets/02_endcard/win/happy.png",
        hl: "./assets/02_endcard/win/hl.png",
        konfetti: "./assets/02_endcard/win/konfetti.png",
    },
    fail: {
        bac1: "./assets/02_endcard/fail/bac1.png",
        bac2: "./assets/02_endcard/fail/bac2.png",
        bac3: "./assets/02_endcard/fail/bac3.png",
        bac4: "./assets/02_endcard/fail/bac4.png",
        bac5: "./assets/02_endcard/fail/bac5.png",
        bubble: "./assets/02_endcard/fail/bubble.png",
        cta: "./assets/02_endcard/fail/cta.png",
        hl: "./assets/02_endcard/fail/hl.png",
        replay: "./assets/02_endcard/fail/replay.png",
        sad: "./assets/02_endcard/fail/sad.png",
    },
    music: {
        background: "./assets/music/background_music/Funny Game Loop.mp3",
        crash: "./assets/music/crash/Cartoon Crash Boing.mp3",
        fail: "./assets/music/endcard_fail/Fail.mp3",
        win: "./assets/music/endcard_win/Celebrative Happy Woohoo Cheer 2.mp3",
        applause: "./assets/music/endcard_win/applause.mp3",
    }
};

const assets = {};
let loadedCount = 0;
let totalAssets = 0;

function loadAssets(onComplete) {
    function load(source, target) {
        for (let key in source) {
            if (typeof source[key] === "object") {
                target[key] = {};
                load(source[key], target[key]);
                continue;
            }

            totalAssets++;

            const extension = source[key].split(".").pop().toLowerCase();
            const asset = extension === "mp3" ? new Audio() : new Image();

            if (asset instanceof Audio) {
                asset.addEventListener("canplaythrough", () => {
                    loadedCount++;

                    if (loadedCount === totalAssets) {
                        onComplete();
                    }
                }, { once: true });
            } else {
                asset.onload = () => {
                    loadedCount++;

                    if (loadedCount === totalAssets) {
                        onComplete();
                    }
                };
            }

            asset.onerror = () => {
                console.error(`Failed to load asset: ${source[key]}`);
            };

            target[key] = asset;
            asset.src = source[key];
        }
    }

    load(assetSources, assets);
}

loadAssets(() => {
    generateTunnelMap();
    generateObstacles();
    gameplayLength = -assets.gameplay.width / 2 + canvas.width
    startGame();
});

// <----------------------- LISTEN FOR CLICK -----------------------> //

canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    if (!hasGameStarted && currentView === "game") {
        hasGameStarted = true;
        showReady()
        
        setTimeout(() => {
            resumeGame()
        }, startDelay)

        return;
    }

    if (currentView === "win") {
        useWinCta(event)

        return
    }

    if (currentView === "fail") {
        useFailCta(event)
        useFailReplay(event)

        return
    }

    if (isGameRunning) {
        playerPosBeforeJump = playerPos

        isJumpHeld = true;
    }
});

window.addEventListener("pointerup", () => {
    if (!isJumpHeld || currentView !== "game") return;

    isJumpHeld = false;

    disableFallingShortTime();
});

window.addEventListener("pointercancel", () => {
    if (!isJumpHeld || currentView !== "game") return;

    isJumpHeld = false;

    disableFallingShortTime();
});

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        for (const name of currentAudio) {
            const audio = assets.music[name];

            if (!audio.ended) pauseAudio(name)
        }

        if (hasGameStarted) {
            isGameRunning = !isGameRunning
        }
    } else {
        for (const name of currentAudio) {
            const audio = assets.music[name];
            
            if (!audio.ended) playAudio(name)
        }

        if (hasGameStarted) {
            isGameRunning = !isGameRunning
        }
    }
})

audioButton.addEventListener("pointerdown", event => {
    event.stopPropagation();
});

audioButton.addEventListener("click", toggleAudio);

function useWinCta(event) {
    const rect = canvas.getBoundingClientRect();

    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);

    const cta = assets.win.cta;

    const ctaX = 30;
    const ctaY = 560;
    const ctaWidth = cta.width / 2;
    const ctaHeight = cta.height / 2;

    if (
        mouseX >= ctaX &&
        mouseX <= ctaX + ctaWidth &&
        mouseY >= ctaY &&
        mouseY <= ctaY + ctaHeight
    ) {
        window.open(clickTag, "_blank")
    }
}

function useFailCta(event) {
    const rect = canvas.getBoundingClientRect();

    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);

    const cta = assets.fail.cta;

    const ctaX = 30;
    const ctaY = 480;
    const ctaWidth = cta.width / 2;
    const ctaHeight = cta.height / 2;

    if (
        mouseX >= ctaX &&
        mouseX <= ctaX + ctaWidth &&
        mouseY >= ctaY &&
        mouseY <= ctaY + ctaHeight
    ) {
        window.open(clickTag, "_blank")
    }
}

function useFailReplay(event) {
    const rect = canvas.getBoundingClientRect();

    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);

    const cta = assets.fail.replay;

    const ctaX = 30;
    const ctaY = 540;
    const ctaWidth = cta.width / 2;
    const ctaHeight = cta.height / 2;

    if (
        mouseX >= ctaX &&
        mouseX <= ctaX + ctaWidth &&
        mouseY >= ctaY &&
        mouseY <= ctaY + ctaHeight
    ) {
        switchView("game")
    }
}

// <----------------------- DRAW ASSETS -----------------------> //

let endcardAnimationStart = 0;
const endcardAnimationDuration = 1100;

const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return 1 + c3 * Math.pow(t - 1, 3)
        + c1 * Math.pow(t - 1, 2);
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function getAnimationProgress(delay, duration = 450) {
    const elapsed = performance.now() - endcardAnimationStart - delay;
    return Math.max(0, Math.min(elapsed / duration, 1));
}

function drawAnimatedAsset(img, x, y, progress, options = {}) {
    if (!img || progress <= 0) return;

    const {
        scale = 1,
        rotation = 0,
        offsetY = 0,
        alpha = 1,
        easing = easeOutBack
    } = options;

    const eased = easing(progress);

    const width = img.width / 2 * scale * eased;
    const height = img.height / 2 * scale * eased;

    ctx.save();

    ctx.globalAlpha = alpha * Math.min(progress * 3, 1);
    ctx.translate(x + img.width / 4, y + img.height / 4 + offsetY * (1 - eased));
    ctx.rotate(rotation * (1 - eased));
    ctx.drawImage(img, -width / 2, -height / 2, width, height);

    ctx.restore();
}

function drawAsset(img, x, y, offsetX = 0, offsetY = 0) {
    if (!img) return;
    ctx.drawImage(img, x, y, img.width / 2 + offsetX, img.height / 2 + offsetY);
}

function drawImages() {
    ctx.drawImage(assets.background, 0, 0);
    drawAsset(assets.logo, 0, 0);

    if (currentView === "game") {
        drawGame();
    } else if (currentView === "win") {
        drawWin()
    } else if (currentView === "fail") {
        drawFail()
    }

    requestAnimationFrame(drawImages);
}

function drawGame() {
    drawAsset(assets.tut, 0, 0);
    drawAsset(assets.bgTexture, 0, 80);
    drawAsset(assets.gameplay, gameplayPos, 100, 0, -120);
    drawAsset(assets.border, 0, 0);

    drawObstacles();
    drawAsset(assets.player, 60, playerPos);

    if (!hasGameStarted) {
        const gestureX = canvas.width / 2 - 30;
        const gestureY = 450;

        drawAsset(assets.gesture, gestureX, gestureY);
    }

    if (DEBUG) {
        drawHitboxes();
    }
}

const drawEndcardButton = (img, x, y, progress) => {
    if (!img || progress <= 0) return;

    const offsetY = 40 * (1 - easeOutCubic(progress));

    ctx.save();
    ctx.globalAlpha = Math.min(progress * 3, 1);

    ctx.drawImage(
        img,
        x,
        y + offsetY,
        img.width / 2,
        img.height / 2
    );

    ctx.restore();
};

function drawWin() {
    const bubble = getAnimationProgress(0, 500);
    const happy = getAnimationProgress(150, 450);
    const konfetti = getAnimationProgress(300, 650);
    const hl = getAnimationProgress(450, 450);
    const cta = getAnimationProgress(650, 450);

    // Bubble
    if (bubble > 0) {
        const scale = 0.85 + 0.15 * easeOutBack(bubble);

        ctx.save();
        ctx.globalAlpha = Math.min(bubble * 3, 1);
        ctx.translate(180, 320);
        ctx.scale(scale, scale);
        ctx.translate(-180, -320);
        drawAsset(assets.win.bubble, 0, 0);
        ctx.restore();
    }

    // Character
    if (happy > 0) {
        const scale = 0.6 + 0.4 * easeOutBack(happy);

        ctx.save();
        ctx.globalAlpha = Math.min(happy * 3, 1);
        ctx.translate(180, 320);
        ctx.scale(scale, scale);
        ctx.translate(-180, -320);
        drawAsset(assets.win.happy, 0, 0);
        ctx.restore();
    }

    // Confetti
    if (konfetti > 0) {
        const scale = 0.35 + 0.65 * easeOutBack(konfetti);

        ctx.save();
        ctx.globalAlpha = Math.min(konfetti * 3, 1);
        ctx.translate(180, 320);
        ctx.scale(scale, scale);
        ctx.translate(-180, -320);
        drawAsset(assets.win.konfetti, 0, 0);
        ctx.restore();
    }

    // Headline
    if (hl > 0) {
        const scale = 0.8 + 0.2 * easeOutBack(hl);

        ctx.save();
        ctx.globalAlpha = Math.min(hl * 3, 1);
        ctx.translate(180, 320);
        ctx.scale(scale, scale);
        ctx.translate(-180, -320);
        drawAsset(assets.win.hl, 0, 0);
        ctx.restore();
    }

    // CTA
    drawEndcardButton(assets.win.cta, 30, 560, cta);
}

function drawFail() {
    const bubble = getAnimationProgress(0);
    const sad = getAnimationProgress(150);
    const hl = getAnimationProgress(250);

    const bac1 = getAnimationProgress(300);
    const bac2 = getAnimationProgress(350);
    const bac3 = getAnimationProgress(400);
    const bac4 = getAnimationProgress(450);
    const bac5 = getAnimationProgress(500);

    const cta = getAnimationProgress(600);
    const replay = getAnimationProgress(750);

    drawAnimatedAsset(assets.fail.bubble, 0, 0, bubble, {
        offsetY: -100
    });

    drawAnimatedAsset(assets.fail.sad, 0, 0, sad, {
        scale: 0.8
    });

    drawAnimatedAsset(assets.fail.hl, 0, 0, hl, {
        offsetY: 50
    });

    drawAnimatedAsset(assets.fail.bac1, 0, 0, bac1, {
        rotation: -0.3
    });

    drawAnimatedAsset(assets.fail.bac2, 0, 0, bac2, {
        rotation: 0.3
    });

    drawAnimatedAsset(assets.fail.bac3, 0, 0, bac3, {
        rotation: -0.2
    });

    drawAnimatedAsset(assets.fail.bac4, 0, 0, bac4, {
        rotation: 0.2
    });

    drawAnimatedAsset(assets.fail.bac5, 0, 0, bac5, {
        rotation: -0.3
    });

    drawEndcardButton(assets.fail.cta, 30, 480, cta);
    drawEndcardButton(assets.fail.replay, 30, 540, replay);
}

function drawObstacles() {
    const scaleY = (assets.gameplay.height / 2 - 120) / assets.gameplay.height;
    const currentTime = performance.now();

    obstacles.forEach((obstacle) => {
        const sprite = obstacle.sprite;
        const obstacleScale = obstacle.scale || 0.5;

        const screenX = gameplayPos + obstacle.x;
        const screenY = 100 + obstacle.y * scaleY;

        let visualScale = obstacleScale;

        if (obstacle.isBacteria) {
            // Start the animation when the bacteria enters the screen
            const halfWidth = sprite.width * obstacleScale / 2;
            const halfHeight = sprite.height * obstacleScale / 2;

            const isVisible =
                screenX + halfWidth > 0 &&
                screenX - halfWidth < canvas.width &&
                screenY + halfHeight > 0 &&
                screenY - halfHeight < canvas.height;

            if (!isVisible && obstacle.animationStart === undefined) {
                // Wait until the bacteria becomes visible
                visualScale = 0;
            } else {
                if (obstacle.animationStart === undefined) {
                    obstacle.animationStart = currentTime;
                }

                const progress = Math.min(
                    (currentTime - obstacle.animationStart) / 450,
                    1
                );

                // Pop into view
                const popScale = easeOutBack(progress);

                // Gentle continuous pulsing after appearing
                const pulse = 1 + Math.sin(currentTime * 0.004 + obstacle.x) * 0.04;

                visualScale = obstacleScale * popScale * pulse;
            }
        }

        const obstacleWidth = sprite.width * visualScale;
        const obstacleHeight = sprite.height * visualScale;

        ctx.save();
        ctx.translate(screenX, screenY);

        ctx.drawImage(
            sprite,
            -obstacleWidth / 2,
            -obstacleHeight / 2,
            obstacleWidth,
            obstacleHeight
        );

        ctx.restore();
    });
}

function drawHitboxes() {
    if (!hasGameStarted) return;

    const playerX = 60 + assets.player.width / 4;
    const playerY = playerPos + assets.player.height / 4;
    const playerRadius = 5;

    const scaleY = (assets.gameplay.height / 2 - 120) / assets.gameplay.height;

    const hitboxScale = 0.6; // lower number = smaller hitboxes

    ctx.save();

    obstacles.forEach((obstacle) => {
        const sprite = obstacle.sprite;
        const scale = obstacle.scale ?? 0.5;

        const obstacleX = gameplayPos + obstacle.x;
        const obstacleY = 100 + obstacle.y * scaleY;

        const width = sprite.width * scale * hitboxScale;
        const height = sprite.height * scale * hitboxScale;

        const rotation = obstacle.rotation ?? 0;

        ctx.translate(obstacleX, obstacleY);
        ctx.rotate(rotation);

        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;

        ctx.strokeRect(-width / 2, -height / 2, width, height);

        // Reset transform for the next obstacle
        ctx.restore();
        ctx.save();
    });

    // Player hitbox
    ctx.beginPath();
    ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function showReady() {
    const startTime = performance.now();

    function animate(currentTime) {
        const progress = Math.min((currentTime - startTime) / startDelay, 1);

        const scale = 1 + progress * 2;
        const opacity = 0.7 * (1 - progress);

        ctx.save();

        ctx.globalAlpha = opacity;
        ctx.font = `bold ${32 * scale}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";

        ctx.fillText("READY", canvas.width / 2, canvas.height / 2);

        ctx.restore();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// <----------------------- COLLISION -----------------------> //

let collisionCanvas;
let collisionCtx;

const gameplayOffsetY = 100;

function generateTunnelMap() {
    collisionCanvas = document.createElement("canvas");

    collisionCanvas.width = canvas.width;
    collisionCanvas.height = canvas.height;

    collisionCtx = collisionCanvas.getContext("2d");
}

function updateCollisionMask() {
    collisionCtx.clearRect(0, 0, collisionCanvas.width, collisionCanvas.height);

    // Use EXACTLY the same dimensions and positioning
    // as the gameplay image in drawImages()
    collisionCtx.drawImage(assets.gameplay, gameplayPos, gameplayOffsetY, assets.gameplay.width / 2, assets.gameplay.height / 2 - 120);
}

function checkCollision() {
    updateCollisionMask();

    const playerVisualWidth = assets.player.width / 2;
    const playerVisualHeight = assets.player.height / 2;

    // Collision marker at the center of the player
    const centerX = 60 + playerVisualWidth / 2;
    const centerY = playerPos + playerVisualHeight / 2;

    const radius = 5;

    // Check the circle's bounding box
    if (centerX - radius < 0 || centerX + radius >= canvas.width || centerY - radius < 0 || centerY + radius >= canvas.height) {
        return true;
    }

    const imageData = collisionCtx.getImageData(Math.floor(centerX - radius), Math.floor(centerY - radius), radius * 2 + 1, radius * 2 + 1);

    const pixels = imageData.data;

    // Check only pixels inside the circle
    for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
            if (x * x + y * y > radius * radius) continue;

            const index = ((y + radius) * (radius * 2 + 1) + (x + radius)) * 4;

            // Any transparent pixel means collision
            if (pixels[index + 3] <= 128) {
                return true;
            }
        }
    }

    return false;
}

function checkObstacleCollision() {
    // Player collision marker
    const playerX = 60 + assets.player.width / 4;
    const playerY = playerPos + assets.player.height / 4;
    const playerRadius = 5;

    // Same transformations as obstacle rendering
    const scaleY = (assets.gameplay.height / 2 - 120) / assets.gameplay.height;

    // Smaller hitboxes = more forgiving collisions
    const hitboxScale = 0.6;

    for (const obstacle of obstacles) {
        const sprite = obstacle.sprite;
        const scale = obstacle.scale ?? 0.5;

        const obstacleX = gameplayPos + obstacle.x;
        const obstacleY = 100 + obstacle.y * scaleY;

        const width = sprite.width * scale * hitboxScale;
        const height = sprite.height * scale * hitboxScale;

        // Move player position into obstacle's rotated coordinate system
        const dx = playerX - obstacleX;
        const dy = playerY - obstacleY;

        const rotation = obstacle.rotation ?? 0;

        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;

        // Closest point on the smaller obstacle hitbox
        const closestX = Math.max(-width / 2, Math.min(localX, width / 2));

        const closestY = Math.max(-height / 2, Math.min(localY, height / 2));

        const distanceX = localX - closestX;
        const distanceY = localY - closestY;

        if (distanceX * distanceX + distanceY * distanceY <= playerRadius * playerRadius) {
            return true;
        }
    }

    return false;
}

// <----------------------- OBSTACLES -----------------------> //

let obstacles = [];

function generateObstacles() {
    const bacteriaSprites = [];

    for (let i = 1; i <= 6; i++) {
        bacteriaSprites.push(assets[`bac${i}`]);
    }

    const positionedBacterias = [
        { x: 125, y: 700, sprite: bacteriaSprites[5], scale: 0.4, isBacteria: true },
        { x: 275, y: 900, sprite: bacteriaSprites[1], scale: 0.5, isBacteria: true },
        { x: 425, y: 835, sprite: bacteriaSprites[0], scale: 0.3, isBacteria: true },
        { x: 600, y: 1130, sprite: bacteriaSprites[2], scale: 0.3, isBacteria: true },
        { x: 750, y: 330, sprite: bacteriaSprites[3], scale: 0.5, isBacteria: true },
        { x: 515, y: 460, sprite: bacteriaSprites[4], scale: 0.4, isBacteria: true },
    ];

    positionedBacterias.forEach((bacteria) => obstacles.push(bacteria));

    const textSprites = [];

    for (let i = 1; i <= 9; i++) {
        textSprites.push(assets[`txt${i}`]);
    }

    const positionedTexts = [
        { x: 125, y: 900, sprite: textSprites[0], scale: 0.5 },
        { x: 325, y: 470, sprite: textSprites[1], scale: 0.3 },
        { x: 425, y: 950, sprite: textSprites[2], scale: 0.3 },
        { x: 525, y: 950, sprite: textSprites[8], scale: 0.3 },
        { x: 330, y: 800, sprite: textSprites[4], scale: 0.3 },
        { x: 670, y: 800, sprite: textSprites[5], scale: 0.5 },
        { x: 780, y: 550, sprite: textSprites[6], scale: 0.4 },
        { x: 230, y: 900, sprite: textSprites[7], scale: 0.4 },
        { x: 165, y: 525, sprite: textSprites[3], scale: 0.4 },
    ];

    positionedTexts.forEach((text) => obstacles.push(text));
}

// <----------------------- GAME STATE -----------------------> //

let fallingTimeout;
const disableFallingShortTime = () => {
    isFallingDisabled = true;
    clearTimeout(fallingTimeout);

    fallingTimeout = setTimeout(() => {
        isFallingDisabled = false;
    }, timeoutAfterJump);
};

let gameplayLength
let gameplayPos = 0;
const moveGameplay = () => {
    if (gameplayPos > gameplayLength * gameplayLimit) {
        gameplayPos -= gameSpeed;
    }
};

const playerFall = () => {
    if (isFallingDisabled || isJumpHeld || playerPos >= minPlayerPos) {
        return;
    }
    playerPos += playerFallSpeed;
};

let playerPosBeforeJump = 0;
const playerJump = () => {
    if (!isJumpHeld && playerPosBeforeJump > 0) {
        if (playerPos > playerPosBeforeJump - playerJumpDistance) {
            // player jump wont overshoot intended distance
            playerPos = Math.max(
                playerPosBeforeJump - playerJumpDistance,
                playerPos - playerJumpSpeed
            );
            return;
        }

        playerPosBeforeJump = 0;
        return;
    }

    if (isJumpHeld && playerPos > maxPlayerPos) {
        playerPos = Math.max(
            maxPlayerPos,
            playerPos - playerJumpSpeed
        );
    }
};

// <----------------------- GAME CONTROL -----------------------> //

const currentAudio = new Set()

function playAudio(name) {
    if (!assets.music[name]) return

    assets.music[name].play()
    currentAudio.add(name)
}

function pauseAudio(name) {
    if (!assets.music[name]) return

    assets.music[name].pause()
}

function resumeGame() {
    isGameRunning = true

    playAudio("background")
}

function pauseGame() {
    isGameRunning = false
    pauseAudio("background")
    playAudio("crash")
}

function gameReset() {
    currentView = "game"
    gameplayPos = 0
    playerPos = 300
    isJumpHeld = false;
    playerPosBeforeJump = 0
    isFallingDisabled = false;
    hasGameStarted = false
    isGameRunning = false

    pauseAllMusic(true)
}

function pauseAllMusic(reset) {
    pauseAudio("background")
    pauseAudio("crash")
    pauseAudio("fail")
    pauseAudio("win")
    pauseAudio("applause")    

    if (reset) {
        assets.music.background.currentTime = 0
        assets.music.crash.currentTime = 0
        assets.music.fail.currentTime = 0
        assets.music.win.currentTime = 0
        assets.music.applause.currentTime = 0
    }
}

function toggleAudio() {
    isAudioMuted = !isAudioMuted;

    Object.values(assets.music).forEach(audio => {
        audio.muted = isAudioMuted;
    });

    audioButton.classList.toggle("muted", isAudioMuted);

    audioButton.setAttribute(
        "aria-label",
        isAudioMuted ? "Unmute audio" : "Mute audio"
    );
}

function switchView(view) {
    currentAudio.clear();

    if (view === "game") {
        gameReset();
    } else if (view === "fail") {
        currentView = "fail";
        endcardAnimationStart = performance.now();

        playAudio("fail");
    } else if (view === "win") {
        currentView = "win";
        endcardAnimationStart = performance.now();

        playAudio("win");
        playAudio("applause");
    }
}

function gameLogic() {
    if (isGameRunning) {
        moveGameplay();

        playerJump();
        playerFall();

        if (checkCollision() || checkObstacleCollision()) {
            pauseGame()

            setTimeout(() => {
                switchView("fail")
            }, failScreenDelay)
        }

        if (playerPos >= 400 && gameplayPos <= -650) {
            pauseGame()
            switchView("win")
        }
    }

    requestAnimationFrame(gameLogic);
}

function startGame() {
    drawImages();
    gameLogic();
}
