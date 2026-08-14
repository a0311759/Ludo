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
    width: 60,  // Increased size by 20%
    height: 60, // Increased size by 20%
    fill: 'white',
    stroke: 'black',
    strokeWidth: 4,
    cornerRadius: 10, // Rounded corners
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
    fontSize: 22,  // Increased font size for bold effect
    fontFamily: 'Arial',
    fontStyle: 'bold', // Bolder dots
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

var currentPlayer = 'yellow';
var consecutiveSixes = 0;
var rollingAllowed = true;

function updateMessage() {
    document.getElementById('message').innerText = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s turn`;
}
function rollDice() {
    if (!rollingAllowed) return;

    var button = document.getElementById('playButton');
    button.disabled = true; // Disable the button

    // Random dice number and rotation speed
    var diceNumber = getRandomDiceNumber();
    var diceFaceText = getDiceFaceText(diceNumber);
    diceText.text(diceFaceText);

    var rpm = Math.random() * (5 - 2) + 2;
    var rotationSpeed = (rpm * 360) / 2; // Degrees per second

    // Animation duration in seconds
    var duration = 2;
    var framesPerSecond = 60;
    var totalFrames = duration * framesPerSecond;

    var animation = new Konva.Animation(function(frame) {
        var elapsedTime = frame.timeDiff / 1000; // Time elapsed in seconds
        var rotation = rotationSpeed * elapsedTime; // Calculate rotation
        square.rotate(rotation);
        diceText.rotate(rotation); // Rotate the text along with the square
        layer.batchDraw();
    }, layer);

    // Start animation
    animation.start();

    // Stop animation after 2 seconds
    setTimeout(function() {
        animation.stop();
        button.disabled = false; // Enable the button

        if (diceNumber === 6) {
            consecutiveSixes++;
            if (consecutiveSixes === 3) {
                consecutiveSixes = 0; // Reset consecutive sixes
                currentPlayer = currentPlayer === 'yellow' ? 'blue' : 'yellow'; // Switch player
                updateMessage();
            }
            rollingAllowed = true; // Allow another roll
        } else {
            consecutiveSixes = 0; // Reset consecutive sixes
            currentPlayer = currentPlayer === 'yellow' ? 'blue' : 'yellow'; // Switch player
            updateMessage();
            rollingAllowed = true; // Allow another roll
        }
        
        // Call the function to move the piece from home base
        movePieceFromHomeBase(diceNumber);
    }, duration * 1000);
}



// Button click event listener
document.getElementById('playButton').addEventListener('click', rollDice);

updateMessage(); // Initial message
initStarCells(); // Paint all star markers onto their canvases
