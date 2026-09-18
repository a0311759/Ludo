
// Initialize the stage
var stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight * 0.2 // Adjusted height for the dice
});

// Initialize the layer
var layer = new Konva.Layer();
stage.add(layer);

// Create a white square with rounded corners
var square = new Konva.Rect({
    x: stage.width() / 2 - 30,
    y: stage.height() / 2 - 30,
    width: 60,
    height: 60,
    fill: 'white',
    stroke: 'black',
    strokeWidth: 4,
    cornerRadius: 10,
    offsetX: 30,
    offsetY: 30
});

// Add the square to the layer
layer.add(square);

// Create a text object for the dice face with bold dots
var diceText = new Konva.Text({
    x: stage.width() / 2 - 30,
    y: stage.height() / 2 - 30,
    text: '',
    fontSize: 22,
    fontFamily: 'Arial',
    fontStyle: 'bold',
    fill: 'black',
    width: 60,
    align: 'center',
    verticalAlign: 'middle',
    offsetX: 30,
    offsetY: 30
});

// Add text object to the layer
layer.add(diceText);
layer.draw();

// Function to get a random dice number
function getRandomDiceNumber() {
    return Math.floor(Math.random() * 6) + 1;
}

// Function to get dice face text based on the number
function getDiceFaceText(number) {
    const diceFaces = {
        1: '   \n • \n   ',
        2: '•  \n   \n  •',
        3: '•  \n • \n  •',
        4: '• •\n   \n• •',
        5: '• •\n • \n• •',
        6: '• •\n• •\n• •'
    };
    return diceFaces[number] || '';
}

// Draw a 5-pointed star centered in the given canvas
function drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    var rot = (Math.PI / 2) * 3;
    var step = Math.PI / spikes;
    var x, y;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (var i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

function drawStarCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var outerRadius = (Math.min(w, h) / 2) - 2;
    var innerRadius = outerRadius * 0.45;

    ctx.clearRect(0, 0, w, h);
    drawStarShape(ctx, cx, cy, 5, outerRadius, innerRadius);
    ctx.fillStyle = '#FFD700';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#8a6d00';
    ctx.fill();
    ctx.stroke();
}

// Paint every star-marked cell on the board
function initStarCells() {
    document.querySelectorAll('.star-canvas').forEach(function(canvas) {
        drawStarCanvas(canvas);
    });
}

// Set Blue as the first turn
var currentPlayer = 'blue';
var consecutiveSixes = 0;
var rollingAllowed = true;

var PLAYER_BASE_ID = {
    yellow: 'home-base-yellow',
    blue: 'home-base-blue',
    red: 'home-base-red',
    green: 'home-base-green'
};

// Turn indication is border-only now (see .active-turn in the CSS) —
// no text label anywhere on the board announces whose turn it is.
function highlightCurrentPlayer() {
    Object.keys(PLAYER_BASE_ID).forEach(function(color) {
        var el = document.getElementById(PLAYER_BASE_ID[color]);
        if (el) el.classList.remove('active-turn');
    });

    var activeBaseId = PLAYER_BASE_ID[currentPlayer];
    var activeEl = activeBaseId && document.getElementById(activeBaseId);
    if (activeEl) activeEl.classList.add('active-turn');
}

// Turn resolution after pawn movement
function resolveTurnAfterMove(diceNumber, movedPawn) {
    var button = document.getElementById('playButton');

    if (diceNumber === 6 && movedPawn) {
        consecutiveSixes++;
        if (consecutiveSixes === 3) {
            // Three consecutive sixes forfeits turn
            consecutiveSixes = 0;
            currentPlayer = (currentPlayer === 'blue') ? 'yellow' : 'blue';
            highlightCurrentPlayer();
        }
        // If not 3 consecutive sixes, player keeps turn (bonus roll)
    } else {
        consecutiveSixes = 0;
        currentPlayer = (currentPlayer === 'blue') ? 'yellow' : 'blue';
        highlightCurrentPlayer();
    }

    rollingAllowed = true;
    if (button) button.disabled = false;
}

function rollDice() {
    if (!rollingAllowed) return;

    var button = document.getElementById('playButton');
    button.disabled = true;
    rollingAllowed = false;

    var diceNumber = getRandomDiceNumber();
    var diceFaceText = getDiceFaceText(diceNumber);
    diceText.text(diceFaceText);

    var rpm = Math.random() * (5 - 2) + 2;
    var rotationSpeed = (rpm * 360) / 2;

    var duration = 2;
    var framesPerSecond = 60;
    var totalFrames = duration * framesPerSecond;

    var animation = new Konva.Animation(function(frame) {
        var elapsedTime = frame.timeDiff / 1000;
        var rotation = rotationSpeed * elapsedTime;
        square.rotate(rotation);
        diceText.rotate(rotation);
        layer.batchDraw();
    }, layer);

    animation.start();

    setTimeout(function() {
        animation.stop();
        movePieceFromHomeBase(diceNumber, function(movedPawn) {
            resolveTurnAfterMove(diceNumber, movedPawn);
        });
    }, duration * 1000);
}

document.getElementById('playButton').addEventListener('click', rollDice);

highlightCurrentPlayer();
initStarCells();
