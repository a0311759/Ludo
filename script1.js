/* ============================================================
   GAMEPLAY LOGIC
   ------------------------------------------------------------
   This file only deals with WHERE pawns go on the board.
   The board/dice/star rendering lives in script.js — you
   shouldn't need to touch that file to change how pawns move.

   Board state today:
   - Each home base (#home-base-red / -yellow / -green / -blue)
     contains 4 fixed ".home-slot" sockets. These are part of the
     BOARD and never move or disappear, even once their pawn has
     left for the track.
   - Each ".home-slot" starts out holding one ".piece-slot" pawn
     (a 🔴/🔵/🟢/🟡 emoji). A pawn can be relocated onto any track
     cell by selector (".y1", ".b12", a shared cell like
     ".b1.y27", etc.) — only the pawn itself moves; the socket it
     came from is left behind, empty but still visible.

   This is a local two-player (hot-seat) setup: only Yellow and
   Blue are wired to actually move (see START_CELL_SELECTOR
   below), matching script.js's currentPlayer turn switching —
   one person plays Yellow, the other plays Blue, taking turns on
   the same screen.

   Extend movePieceFromHomeBase(), or add new functions here, to
   implement full board movement, captures, home stretch,
   winning, etc.
   ============================================================ */

// Each color's starting cell once a pawn leaves its home base.
var START_CELL_SELECTOR = {
    yellow: '.y1',
    blue: '.b1'
    // red: '.r1', green: '.g1' — add these once those colors are in play
};

// Move one pawn out of the current player's home base onto their
// starting cell when a 6 is rolled.
function movePieceFromHomeBase(diceNumber) {
    if (diceNumber !== 6) return; // Only a roll of 6 lets a pawn leave home

    var color = currentPlayer; // whoever's turn it is right now — 'yellow' or 'blue'
    var startSelector = START_CELL_SELECTOR[color];
    if (!startSelector) return; // color not wired up for movement yet

    var homeBase = document.getElementById('home-base-' + color);
    if (!homeBase) return;

    // Only pawns still sitting in a home slot (i.e. still at home) count.
    var pieces = homeBase.querySelectorAll('.home-slot .piece-slot');
    if (pieces.length === 0) return; // all of this color's pawns are already out

    // Define the function to move the clicked piece
    function movePiece(pieceToMove) {
        var targetGrid = document.querySelector(startSelector);
        if (!targetGrid) return;

        // Take the pawn out of its home slot. The slot itself is left in
        // place — it's part of the board, not the piece.
        var homeSlot = pieceToMove.parentElement;
        homeSlot.removeChild(pieceToMove);

        // Place the pawn on its starting track cell.
        targetGrid.appendChild(pieceToMove);
        pieceToMove.classList.remove('movable');

        // Remove the event listeners after moving one piece
        pieces.forEach(function(piece) {
            piece.removeEventListener('click', onClickMovePiece);
        });
    }

    // Function to handle the click event
    function onClickMovePiece() {
        movePiece(this);
    }

    // If there are four pieces, move the first one automatically
    if (pieces.length === 4) {
        movePiece(pieces[0]);
    } else {
        // If there are fewer than four pieces, attach click event to move the clicked piece
        pieces.forEach(function(piece) {
            piece.classList.add('movable');
            piece.addEventListener('click', onClickMovePiece);
        });
    }
}
