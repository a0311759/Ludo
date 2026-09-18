
// Use the following to include this JavaScript file 
// <script src="script1.js"></script>




/* ============================================================
   GAMEPLAY & BOARD MOVEMENT LOGIC
   ============================================================ */

// 52-cell continuous outer perimeter loop around the board
var TRACK_CELLS = [
    '.b1',  '.b2',  '.b3',  '.b4',  '.b5',  '.b6',  '.b7',  '.b8',  '.b9',  '.b10',
    '.b11', '.b12', '.b13', '.b14', '.b15', '.b16', '.b17', '.b18', '.b19', '.b20',
    '.b21', '.b22', '.b23', '.b24', '.b25', '.b26', '.b27', '.b28', '.b29', '.b30',
    '.b31', '.b32', '.b33', '.b34', '.b35', '.b36', '.b37', '.b38', '.b39', '.b40',
    '.b41', '.b42', '.b43', '.b44', '.b45', '.b46', '.b47', '.b48', '.b49', '.b50',
    '.b51', '.b52'
];

// Indices (into TRACK_CELLS, 0-based) of every safe cell on the outer
// track: the 4 colored start squares plus the 4 star squares between
// them. A pawn landing here is never captured, and any opponent pawns
// already parked here are left alone rather than sent home.
var SAFE_TRACK_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// 5-cell home path leading to the center (step 51 -> 52-56)
var HOME_STRETCH = {
    blue:   ['.b52', '.b53', '.b54', '.b55', '.b56'],
    yellow: ['.y52', '.y53', '.y54', '.y55', '.y56']
};

var START_INDEX = {
    blue: 0,   // .b1
    yellow: 26 // .b27 is .y1
};

// Maps pawn element to its total steps traveled from start (0 = start cell, 56 = home goal)
var pieceStepProgress = new Map();

function cleanupMovableListeners(candidates, clickHandler) {
    candidates.forEach(function(item) {
        item.el.classList.remove('movable');
        item.el.removeEventListener('click', clickHandler);
    });
}

function getCellSelectorForProgress(color, progress) {
    // Reached or overshot home goal
    if (progress >= 56) return '.large-grid-center-3x3';

    // In home straight (steps 51 to 55)
    if (progress >= 51) {
        return HOME_STRETCH[color][progress - 51];
    }

    // On standard outer perimeter
    var loopIndex = (START_INDEX[color] + progress) % TRACK_CELLS.length;
    return TRACK_CELLS[loopIndex];
}

// True when the given track-loop index is one of the safe/star squares
function isSafeTrackIndex(loopIndex) {
    return SAFE_TRACK_INDICES.indexOf(loopIndex) !== -1;
}

// Send a pawn back to the first open socket in its own home base
function returnPawnToHome(pieceEl, color) {
    var homeBase = document.getElementById('home-base-' + color);
    if (!homeBase) return;

    var openSlot = Array.from(homeBase.querySelectorAll('.home-slot')).find(function(slot) {
        return slot.children.length === 0;
    });

    if (pieceEl.parentElement) {
        pieceEl.parentElement.removeChild(pieceEl);
    }

    if (openSlot) {
        openSlot.appendChild(pieceEl);
    }

    pieceStepProgress.delete(pieceEl);
}

// After a pawn lands on a track cell, knock any opponent pawns on that
// same cell back to their home base — unless the cell is a safe/star
// square, in which case opposing pawns can share it unharmed.
function checkForCapture(landedPieceEl, targetSelector, loopIndex) {
    if (typeof loopIndex === 'number' && isSafeTrackIndex(loopIndex)) {
        return;
    }

    var targetCell = document.querySelector(targetSelector);
    if (!targetCell) return;

    var landedColor = landedPieceEl.dataset.owner;

    Array.from(targetCell.querySelectorAll('.piece-slot')).forEach(function(otherPiece) {
        if (otherPiece === landedPieceEl) return;
        if (otherPiece.dataset.owner === landedColor) return; // same-color pawns form a block, not a capture

        returnPawnToHome(otherPiece, otherPiece.dataset.owner);
    });
}

// Move active pawn along the board
function advancePawn(pieceEl, steps) {
    var color = pieceEl.dataset.owner;
    var currentProgress = pieceStepProgress.get(pieceEl);

    if (currentProgress === undefined) {
        currentProgress = 0;
    }

    var newProgress = currentProgress + steps;

    // Prevent overshooting the final home center
    if (newProgress > 56) {
        return;
    }

    var targetSelector = getCellSelectorForProgress(color, newProgress);
    var targetCell = document.querySelector(targetSelector);

    if (targetCell) {
        targetCell.appendChild(pieceEl);
        pieceStepProgress.set(pieceEl, newProgress);

        // Captures only happen out on the shared outer perimeter —
        // never in a color's private home stretch or the center goal.
        if (newProgress < 51) {
            var loopIndex = (START_INDEX[color] + newProgress) % TRACK_CELLS.length;
            checkForCapture(pieceEl, targetSelector, loopIndex);
        }
    }
}

// Move a pawn out of home socket to its start position
function deployPawnFromHome(pieceEl, color) {
    var startSelector = TRACK_CELLS[START_INDEX[color]];
    var targetCell = document.querySelector(startSelector);
    if (!targetCell) return;

    var homeSlot = pieceEl.parentElement;
    if (homeSlot) {
        homeSlot.removeChild(pieceEl);
    }

    targetCell.appendChild(pieceEl);
    pieceStepProgress.set(pieceEl, 0);

    // Start squares are always safe cells, so this call is a no-op in
    // practice, but it's kept here for symmetry with advancePawn.
    checkForCapture(pieceEl, startSelector, START_INDEX[color]);
}

// Main move orchestrator
function movePieceFromHomeBase(diceNumber, onMoveComplete) {
    var done = typeof onMoveComplete === 'function' ? onMoveComplete : function() {};
    var color = currentPlayer;

    var homeBase = document.getElementById('home-base-' + color);
    var homePawns = homeBase ? Array.from(homeBase.querySelectorAll('.home-slot .piece-slot')) : [];

    homePawns.forEach(function(p) {
        if (!p.dataset.owner) p.dataset.owner = color;
    });

    var activePawns = Array.from(document.querySelectorAll('.piece-slot')).filter(function(p) {
        return p.dataset.owner === color && !homePawns.includes(p);
    });

    if (homePawns.length === 4 && diceNumber !== 6) {
        done(false);
        return;
    }

    if (homePawns.length === 4 && diceNumber === 6) {
        deployPawnFromHome(homePawns[0], color);
        done(true);
        return;
    }

    var selectableCandidates = [];

    if (diceNumber === 6 && homePawns.length > 0) {
        homePawns.forEach(function(pawn) {
            selectableCandidates.push({ el: pawn, type: 'deploy' });
        });
    }

    activePawns.forEach(function(pawn) {
        var progress = pieceStepProgress.get(pawn) || 0;
        if (progress + diceNumber <= 56) {
            selectableCandidates.push({ el: pawn, type: 'advance' });
        }
    });

    if (selectableCandidates.length === 0) {
        done(false);
        return;
    }

    if (selectableCandidates.length === 1) {
        var choice = selectableCandidates[0];
        if (choice.type === 'deploy') {
            deployPawnFromHome(choice.el, color);
        } else {
            advancePawn(choice.el, diceNumber);
        }
        done(true);
        return;
    }

    function onPawnSelected(e) {
        var clickedEl = e.currentTarget;
        var chosen = selectableCandidates.find(function(item) { return item.el === clickedEl; });

        cleanupMovableListeners(selectableCandidates, onPawnSelected);

        if (chosen.type === 'deploy') {
            deployPawnFromHome(chosen.el, color);
        } else {
            advancePawn(chosen.el, diceNumber);
        }

        done(true);
    }

    selectableCandidates.forEach(function(item) {
        item.el.classList.add('movable');
        item.el.addEventListener('click', onPawnSelected);
    });
}
