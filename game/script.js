const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 360;
canvas.height = 800;
canvas.style.touchAction = "none";

// <----------------------- SETTINGS -----------------------> //

let gameStarted = false;
const gameSpeed = 0.3 * 6; // how fast gameplay image is moving
const playerFallSpeed = 3; // how fast the player is falling
const playerJumpSpeed = 4; // how fast player moves during a jump
let timeoutAfterJump = 300; // how long player doesn't fall after a jump

let playerPos = 300; // starting Y pos
const minPlayerPos = 580;
const maxPlayerPos = 200;
const gameplayLimit = 0.30 // 1 means full width of gameplay is used
let isPlayerJumping = false;
let isJumpHeld = false;
let isFallingDisabled = false;

// <----------------------- LOAD ASSETS -----------------------> //

const assetSources = {
    background: "../assets/bg.jpg",
    gesture: "../assets/gesture.png",
    bgTexture: "../assets/01_game/bg_texture.png",
    logo: "../assets/logo.png",
    tut: "../assets/01_game/tut.png",
    border: "../assets/border.png",
    gameplay: "../assets/01_game/gameplay.png",
    player: "../assets/01_game/player.png",
    bac1: "../assets/01_game/bac1.png",
    bac2: "../assets/01_game/bac2.png",
    bac3: "../assets/01_game/bac3.png",
    bac4: "../assets/01_game/bac4.png",
    bac5: "../assets/01_game/bac5.png",
    bac6: "../assets/01_game/bac6.png",
    txt1: "../assets/01_game/txt1.png",
    txt2: "../assets/01_game/txt2.png",
    txt3: "../assets/01_game/txt3.png",
    txt4: "../assets/01_game/txt4.png",
    txt5: "../assets/01_game/txt5.png",
    txt6: "../assets/01_game/txt6.png",
    txt7: "../assets/01_game/txt7.png",
    txt8: "../assets/01_game/txt8.png",
    txt9: "../assets/01_game/txt9.png",
};

const assets = {};
let loadedCount = 0;
const totalAssets = Object.keys(assetSources).length;

function loadAssets(onComplete) {
    for (let key in assetSources) {
        const img = new Image();
        img.src = assetSources[key];

        img.onload = () => {
            loadedCount++;

            if (loadedCount === totalAssets) {
                onComplete();
            }
        };

        img.onerror = () => {
            console.error(`Failed to load asset: ${assetSources[key]}`);
        };

        assets[key] = img;
    }
}

loadAssets(() => {
    generateTunnelMap();
    generateObstacles()
    startGame();
});

// <----------------------- LISTEN FOR CLICK -----------------------> //

canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();

    if (!gameStarted) {
        gameStarted = true;
        return;
    }

    isJumpHeld = true;
    isPlayerJumping = true;
});

window.addEventListener("pointerup", () => {
    if (!isJumpHeld) return;

    isJumpHeld = false;
    isPlayerJumping = false;

    disableFallingShortTime();
});

window.addEventListener("pointercancel", () => {
    if (!isJumpHeld) return;

    isJumpHeld = false;
    isPlayerJumping = false;

    disableFallingShortTime();
});

window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

// <----------------------- DRAW ASSETS -----------------------> //

function drawAsset(img, x, y, offsetX = 0, offsetY = 0) {
    if (!img) return;
    ctx.drawImage(img, x, y, img.width / 2 + offsetX, img.height / 2 + offsetY);
}

function drawImages() {
    ctx.drawImage(assets.background, 0, 0);
    drawAsset(assets.bgTexture, 0, 80);
    drawAsset(assets.gameplay, gameplayPos, 100, 0, -120);

    drawObstacles()

    drawAsset(assets.logo, 0, 0);
    drawAsset(assets.tut, 0, 0);
    drawAsset(assets.border, 0, 0);

    if (!gameStarted) {
        const gestureX = canvas.width / 2 - 30;
        const gestureY = 450;

        drawAsset(assets.gesture, gestureX, gestureY);
    }

    drawAsset(assets.player, 60, playerPos);

    // Debug player collision marker
    // const markerX = 60 + assets.player.width / 4;
    // const markerY = playerPos + assets.player.height / 4;

    // ctx.beginPath();
    // ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    // ctx.strokeStyle = "lime";
    // ctx.lineWidth = 1;
    // ctx.stroke();
}

function drawObstacles() {
    const scaleY = (assets.gameplay.height / 2 - 120)
                  / assets.gameplay.height;

    obstacles.forEach(obstacle => {
        const sprite = obstacle.sprite;

        const obstacleScale = obstacle.scale || 0.5

        const obstacleWidth = sprite.width * obstacleScale;
        const obstacleHeight = sprite.height * obstacleScale;

        const screenX = gameplayPos + obstacle.x;
        const screenY = 100 + obstacle.y * scaleY;

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
    if (!gameStarted) return false;

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

// <----------------------- OBSTACLES -----------------------> //

let obstacles = [];

function generateObstacles() {
    const bacteriaSprites = [];

    for (let i = 1; i <= 6; i++) {
        bacteriaSprites.push(assets[`bac${i}`]);
    }

    const positionedBacterias = [
        { x: 125,  y: 700,  sprite: bacteriaSprites[5], scale: 0.4 },
        { x: 275,  y: 900,  sprite: bacteriaSprites[1], scale: 0.5 },
        { x: 425,  y: 835,  sprite: bacteriaSprites[0], scale: 0.3 },
        { x: 600,  y: 1130,  sprite: bacteriaSprites[2], scale: 0.3 },
        { x: 750,  y: 330,  sprite: bacteriaSprites[3], scale: 0.5 },
        { x: 515,  y: 460,  sprite: bacteriaSprites[4], scale: 0.4 },
    ];

    positionedBacterias.forEach(bacteria => obstacles.push(bacteria))

    const textSprites = []

    for (let i = 1; i <= 9; i++) {
        textSprites.push(assets[`txt${i}`]);
    }

    const positionedTexts = [
        { x: 125,  y: 900,  sprite: textSprites[0], scale: 0.5 },
        { x: 325,  y: 470,  sprite: textSprites[1], scale: 0.3 },
        { x: 425,  y: 950,  sprite: textSprites[2], scale: 0.3 },
        { x: 525,  y: 950,  sprite: textSprites[8], scale: 0.3 },
        { x: 330,  y: 800,  sprite: textSprites[4], scale: 0.3 },
        { x: 670,  y: 800,  sprite: textSprites[5], scale: 0.5 },
        { x: 780,  y: 550,  sprite: textSprites[6], scale: 0.4 },
        { x: 230,  y: 900,  sprite: textSprites[7], scale: 0.4 },
        { x: 165,  y: 525,  sprite: textSprites[3], scale: 0.4 },
    ]

    positionedTexts.forEach(text => obstacles.push(text))
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

const gameplayLength = -assets.gameplay.width / 2 + canvas.width
let gameplayPos = -0;
const moveGameplay = () => {
    if (gameplayPos > gameplayLength * gameplayLimit) {
        gameplayPos -= gameSpeed;
    }
};

const playerFall = () => {
    if (isFallingDisabled || isPlayerJumping || playerPos >= minPlayerPos) return;
    playerPos += playerFallSpeed;
};

const playerJump = () => {
    if (!isJumpHeld) return;

    if (playerPos > maxPlayerPos) {
        playerPos = Math.max(maxPlayerPos, playerPos - playerJumpSpeed);
    }
};

// <----------------------- GAME CONTROL -----------------------> //

function gameLogic() {
    if (gameStarted) {
        moveGameplay();

        playerJump();
        playerFall();

        if (checkCollision()) {
            console.log("gameover");
        }
    }

    requestAnimationFrame(gameLogic);
}

function render() {
    drawImages();
    requestAnimationFrame(render);
}

function startGame() {
    render();
    gameLogic();
}
