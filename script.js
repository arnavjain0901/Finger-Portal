const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");
const filterText = document.getElementById("filterName");

const systemStatus = document.getElementById("systemStatus");
const handCount = document.getElementById("handCount");
const pointCount = document.getElementById("pointCount");
const portalStatus = document.getElementById("portalStatus");

// =====================================================
// FILTERS
// =====================================================

const filters = [
    "Grid",
    "Pixelated",
    "Halftone",
    "Pink Duotone",
    "Frosted"
];

let currentFilter = 0;

// =====================================================
// MEDIA PIPE
// =====================================================

let hands = null;

// Four portal points
let portalPoints = [];

// Smoothed points
let smoothPoints = [];


// =====================================================
// OFFSCREEN CANVASES
// =====================================================

const filterCanvas = document.createElement("canvas");
const filterCtx = filterCanvas.getContext("2d");

const pixelCanvas = document.createElement("canvas");
const pixelCtx = pixelCanvas.getContext("2d");


// =====================================================
// CAMERA
// =====================================================

navigator.mediaDevices.getUserMedia({
    video: {
        width: 1280,
        height: 720
    },
    audio: false
})
.then(function(stream) {

    console.log("CAMERA STARTED");

    video.srcObject = stream;

    video.onloadedmetadata = function() {

        video.play();

        resizeCanvas();

        statusText.textContent =
    "Computer vision initialized";

systemStatus.textContent =
    "ONLINE";
        filterText.textContent =
            "Filter: " + filters[currentFilter];

        console.log("VIDEO PLAYING");

        startMediaPipe();
    };

})
.catch(function(error) {

    console.error("CAMERA ERROR:", error);

    statusText.textContent =
        "Camera error: " + error.message;
});


// =====================================================
// MEDIA PIPE INITIALIZATION
// =====================================================

function startMediaPipe() {

    console.log("STARTING MEDIAPIPE");

    hands = new Hands({
        locateFile: function(file) {
            return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" + file;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    hands.onResults(function(results) {

        processHands(results);

    });

    processFrame();
}


// =====================================================
// SEND VIDEO TO MEDIAPIPE
// =====================================================

let processing = false;

async function processFrame() {

    if (!processing && video.readyState >= 2) {

        processing = true;

        try {

            await hands.send({
                image: video
            });

        } catch (error) {

            console.error("MEDIAPIPE ERROR:", error);

        }

        processing = false;
    }

    requestAnimationFrame(processFrame);
}


// =====================================================
// HAND PROCESSING
// =====================================================

function processHands(results) {

    const points = [];

    // -----------------------------------------------
    // COUNT DETECTED HANDS
    // -----------------------------------------------

    const detectedHands =
        results.multiHandLandmarks
            ? results.multiHandLandmarks.length
            : 0;

    console.log(
        "Hands detected:",
        detectedHands
    );


    // -----------------------------------------------
    // UPDATE HUD
    // -----------------------------------------------

    if (handCount) {
        handCount.textContent =
            detectedHands + " / 2";
    }


    // -----------------------------------------------
    // COLLECT THUMB + INDEX POINTS
    // -----------------------------------------------

    if (results.multiHandLandmarks) {

        for (const hand of results.multiHandLandmarks) {

            const thumb = hand[4];
            const index = hand[8];

            points.push({
                x: thumb.x,
                y: thumb.y
            });

            points.push({
                x: index.x,
                y: index.y
            });
        }
    }


    // -----------------------------------------------
    // UPDATE POINT COUNT
    // -----------------------------------------------

    if (pointCount) {

        pointCount.textContent =
            points.length + " / 4";
    }


    // -----------------------------------------------
    // PORTAL DETECTION
    // -----------------------------------------------

    if (points.length === 4) {

        const sorted =
            sortPoints(points);

        smoothPoints =
            smoothPortalPoints(
                smoothPoints,
                sorted
            );

        portalPoints =
            smoothPoints;


        // HUD

        if (portalStatus) {
            portalStatus.textContent =
                "LOCKED";
        }

        if (statusText) {
            statusText.textContent =
                "Portal geometry established";
        }

    }

    else {

        portalPoints = [];

        // HUD

        if (portalStatus) {
            portalStatus.textContent =
                "SEARCHING";
        }

        if (statusText) {

            if (detectedHands === 0) {

                statusText.textContent =
                    "Show both hands";

            } else if (detectedHands === 1) {

                statusText.textContent =
                    "Show second hand";

            } else {

                statusText.textContent =
                    "Position thumb + index";
            }
        }
    }


    // -----------------------------------------------
    // DRAW
    // -----------------------------------------------

    draw();
}


// =====================================================
// SORT 4 POINTS AROUND CENTER
// =====================================================

function sortPoints(points) {

    let centerX = 0;
    let centerY = 0;

    for (const p of points) {

        centerX += p.x;
        centerY += p.y;
    }

    centerX /= points.length;
    centerY /= points.length;

    points.sort(function(a, b) {

        const angleA = Math.atan2(
            a.y - centerY,
            a.x - centerX
        );

        const angleB = Math.atan2(
            b.y - centerY,
            b.x - centerX
        );

        return angleA - angleB;
    });

    return points;
}


// =====================================================
// SMOOTH POINT MOVEMENT
// =====================================================

function smoothPortalPoints(oldPoints, newPoints) {

    if (
        !oldPoints ||
        oldPoints.length !== newPoints.length
    ) {
        return newPoints.map(function(p) {
            return {
                x: p.x,
                y: p.y
            };
        });
    }

    const smoothing = 0.35;

    return newPoints.map(function(p, i) {

        return {
            x:
                oldPoints[i].x +
                (p.x - oldPoints[i].x) * smoothing,

            y:
                oldPoints[i].y +
                (p.y - oldPoints[i].y) * smoothing
        };

    });
}


// =====================================================
// DRAW EVERYTHING
// =====================================================

function draw() {

    resizeCanvas();

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // -----------------------------------------------
    // CAMERA
    // -----------------------------------------------

    ctx.save();

    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
        video,
        0,
        0,
        w,
        h
    );

    ctx.restore();


    // -----------------------------------------------
    // PORTAL
    // -----------------------------------------------

    if (portalPoints.length === 4) {

        drawPortal(w, h);
    }
}


// =====================================================
// DRAW PORTAL
// =====================================================

function drawPortal(w, h) {

    const points = portalPoints.map(function(p) {

        return {
            x: (1 - p.x) * w,
            y: p.y * h
        };

    });

    // -----------------------------------------------
    // PORTAL CLIP
    // -----------------------------------------------

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );

    for (let i = 1; i < points.length; i++) {

        ctx.lineTo(
            points[i].x,
            points[i].y
        );
    }

    ctx.closePath();

    ctx.clip();


    // -----------------------------------------------
    // APPLY FILTER ONLY INSIDE PORTAL
    // -----------------------------------------------

    applyFilter(
        points,
        canvas.width,
        canvas.height
    );

    ctx.restore();


    // -----------------------------------------------
    // PORTAL BORDER
    // -----------------------------------------------

    drawPortalBorder(points);
}


// =====================================================
// FILTER SYSTEM
// =====================================================

function applyFilter(points, w, h) {

    const filter = filters[currentFilter];

    if (filter === "Grid") {

        drawGrid(points, w, h);

    }

    else if (filter === "Pixelated") {

        drawPixelated(w, h);

    }

    else if (filter === "Halftone") {

        drawHalftone(w, h);

    }

    else if (filter === "Pink Duotone") {

        drawPinkDuotone(w, h);

    }

    else if (filter === "Frosted") {

        drawFrosted(w, h);
    }
}


// =====================================================
// GRID FILTER
// =====================================================

function drawGrid(points, w, h) {

    // Darken portal slightly
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1;

    const size = 35;

    // Vertical
    for (let x = 0; x < w; x += size) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);

        ctx.stroke();
    }

    // Horizontal
    for (let y = 0; y < h; y += size) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(w, y);

        ctx.stroke();
    }
}


// =====================================================
// PIXELATED FILTER
// =====================================================

function drawPixelated(w, h) {

    const smallWidth = 160;

    const smallHeight =
        Math.max(
            1,
            Math.round(
                smallWidth *
                video.videoHeight /
                video.videoWidth
            )
        );

    pixelCanvas.width = smallWidth;
    pixelCanvas.height = smallHeight;

    pixelCtx.clearRect(
        0,
        0,
        smallWidth,
        smallHeight
    );

    pixelCtx.save();

    pixelCtx.translate(
        smallWidth,
        0
    );

    pixelCtx.scale(-1, 1);

    pixelCtx.drawImage(
        video,
        0,
        0,
        smallWidth,
        smallHeight
    );

    pixelCtx.restore();

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
        pixelCanvas,
        0,
        0,
        w,
        h
    );

    ctx.imageSmoothingEnabled = true;
}


// =====================================================
// HALFTONE FILTER
// =====================================================

function drawHalftone(w, h) {

    filterCanvas.width = 180;
    filterCanvas.height =
        Math.round(
            180 *
            video.videoHeight /
            video.videoWidth
        );

    filterCtx.clearRect(
        0,
        0,
        filterCanvas.width,
        filterCanvas.height
    );

    filterCtx.save();

    filterCtx.translate(
        filterCanvas.width,
        0
    );

    filterCtx.scale(-1, 1);

    filterCtx.drawImage(
        video,
        0,
        0,
        filterCanvas.width,
        filterCanvas.height
    );

    filterCtx.restore();

    const image = filterCtx.getImageData(
        0,
        0,
        filterCanvas.width,
        filterCanvas.height
    );

    const data = image.data;

    const scaleX =
        w / filterCanvas.width;

    const scaleY =
        h / filterCanvas.height;

    ctx.fillStyle = "rgba(255,255,255,0.8)";

    const step = 7;

    for (
        let y = 0;
        y < filterCanvas.height;
        y += step
    ) {

        for (
            let x = 0;
            x < filterCanvas.width;
            x += step
        ) {

            const index =
                (y * filterCanvas.width + x) * 4;

            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            const brightness =
                (r + g + b) / 3;

            const radius =
                (1 - brightness / 255) *
                4;

            if (radius > 0.4) {

                ctx.beginPath();

                ctx.arc(
                    x * scaleX,
                    y * scaleY,
                    radius * 1.5,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }
        }
    }
}


// =====================================================
// PINK DUOTONE
// =====================================================

function drawPinkDuotone(w, h) {

    ctx.drawImage(
        video,
        0,
        0,
        w,
        h
    );

    ctx.fillStyle =
        "rgba(255, 0, 110, 0.55)";

    ctx.fillRect(
        0,
        0,
        w,
        h
    );
}


// =====================================================
// FROSTED GLASS
// =====================================================

function drawFrosted(w, h) {

    ctx.save();

    ctx.filter = "blur(10px)";

    ctx.globalAlpha = 0.85;

    ctx.drawImage(
        video,
        0,
        0,
        w,
        h
    );

    ctx.restore();

    ctx.filter = "none";

    ctx.fillStyle =
        "rgba(255,255,255,0.08)";

    ctx.fillRect(
        0,
        0,
        w,
        h
    );
}


// =====================================================
// PORTAL BORDER
// =====================================================

function drawPortalBorder(points) {

    const time = performance.now();

    // -----------------------------------------------
    // ANIMATIONS
    // -----------------------------------------------

    const pulse =
        0.65 +
        Math.sin(time * 0.004) * 0.25;

    const glow =
        10 +
        Math.sin(time * 0.003) * 6;


    // -----------------------------------------------
    // OUTER ENERGY GLOW
    // -----------------------------------------------

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );

    for (let i = 1; i < points.length; i++) {

        ctx.lineTo(
            points[i].x,
            points[i].y
        );
    }

    ctx.closePath();

    ctx.shadowColor =
        "rgba(255, 255, 255, 0.95)";

    ctx.shadowBlur = glow;

    ctx.strokeStyle =
        `rgba(255, 255, 255, ${pulse})`;

    ctx.lineWidth = 3;

    ctx.stroke();

    ctx.restore();


    // -----------------------------------------------
    // INNER THIN LINE
    // -----------------------------------------------

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );

    for (let i = 1; i < points.length; i++) {

        ctx.lineTo(
            points[i].x,
            points[i].y
        );
    }

    ctx.closePath();

    ctx.strokeStyle =
        "rgba(255, 255, 255, 0.95)";

    ctx.lineWidth = 1;

    ctx.stroke();

    ctx.restore();


    // -----------------------------------------------
    // FINGER POINT MARKERS
    // -----------------------------------------------

    drawFingerMarkers(points, time);


    // -----------------------------------------------
    // ENERGY PARTICLES
    // -----------------------------------------------

    drawPortalParticles(points, time);
}       


// =====================================================
// CANVAS RESIZE
// =====================================================

function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener(
    "resize",
    resizeCanvas
);


// =====================================================
// KEYBOARD CONTROLS
// =====================================================

document.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key.toLowerCase();

        // F = change filter
        if (key === "f") {

            currentFilter =
                (currentFilter + 1) %
                filters.length;

            filterText.textContent =
                "Filter: " +
                filters[currentFilter];

            console.log(
                "FILTER:",
                filters[currentFilter]
            );
        }

        // Q = stop camera
        if (key === "q") {

            if (video.srcObject) {

                const tracks =
                    video.srcObject.getTracks();

                tracks.forEach(function(track) {

                    track.stop();

                });

                video.srcObject = null;
            }

            statusText.textContent =
                "Camera stopped";

            console.log("CAMERA STOPPED");
        }
    }
);


function drawFingerMarkers(points, time) {

    for (let i = 0; i < points.length; i++) {

        const p = points[i];

        const pulse =
            1 +
            Math.sin(time * 0.006 + i) * 0.25;

        ctx.save();

        // Outer glow
        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            9 * pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "rgba(255, 255, 255, 0.08)";

        ctx.shadowColor =
            "rgba(255, 255, 255, 0.9)";

        ctx.shadowBlur = 15;

        ctx.fill();


        // Main marker
        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.shadowColor =
            "#ffffff";

        ctx.shadowBlur = 10;

        ctx.fill();


        // Crosshair
        ctx.strokeStyle =
            "rgba(255,255,255,0.65)";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
            p.x - 14,
            p.y
        );

        ctx.lineTo(
            p.x - 6,
            p.y
        );

        ctx.moveTo(
            p.x + 6,
            p.y
        );

        ctx.lineTo(
            p.x + 14,
            p.y
        );

        ctx.moveTo(
            p.x,
            p.y - 14
        );

        ctx.lineTo(
            p.x,
            p.y - 6
        );

        ctx.moveTo(
            p.x,
            p.y + 6
        );

        ctx.lineTo(
            p.x,
            p.y + 14
        );

        ctx.stroke();

        ctx.restore();
    }
}

function getPointOnPortal(points, progress) {

    const segmentCount = points.length;

    const scaled =
        progress * segmentCount;

    const index =
        Math.floor(scaled) % segmentCount;

    const nextIndex =
        (index + 1) % segmentCount;

    const local =
        scaled - Math.floor(scaled);

    const a =
        points[index];

    const b =
        points[nextIndex];

    return {
        x:
            a.x +
            (b.x - a.x) * local,

        y:
            a.y +
            (b.y - a.y) * local
    };
}