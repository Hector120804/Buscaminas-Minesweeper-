var bombImage = '<img src="images/bomb.png">';
var flagImage = '<img src="images/flag.png">';
var wrongBombImage = '<img src="images/wrong-bomb.png">';
var colors = [
  '',
  '#0000FA',
  '#4B802D',
  '#DB1300',
  '#202081',
  '#690400',
  '#457A7A',
  '#1B1B1B',
  '#7A7A7A',
];

var boardRows;
var boardCols;
var totalMines;
var board;
var bombCount;
var timeElapsed;
var adjBombs;
var hitBomb;
var elapsedTime;
var timerId;
var winner;
var firstClick;

var boardEl = document.getElementById('board');
var configForm = document.getElementById('config-form');
var gameContainer = document.getElementById('game-container');
var startBtn = document.getElementById('start');

var difficultyLevels = {
    'Fácil': { rows: 8, cols: 8, mines: 10 },
    'Medio': { rows: 12, cols: 12, mines: 20 },
    'Difícil': { rows: 16, cols: 16, mines: 40 },
    'Muy Difícil': { rows: 20, cols: 20, mines: 70 },
    'Hardcore': { rows: 24, cols: 24, mines: 100 },
    'Leyenda': { rows: 30, cols: 30, mines: 150 },
};

configForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var rows = parseInt(document.getElementById('rows').value);
    var cols = parseInt(document.getElementById('cols').value);
    var mines = parseInt(document.getElementById('mines').value);
    var maxMines = rows * cols - 1;
    if (rows < 5 || cols < 5) {
        alert('El tamaño mínimo del tablero es de 5x5.');
        return;
    }
    if (mines >= maxMines) {
        alert(`La cantidad máxima de minas para este tablero es ${maxMines}.`);
        return;
    }
    boardRows = rows;
    boardCols = cols;
    totalMines = mines;
    init();
    render();
    configForm.style.display = 'none';
    gameContainer.style.display = 'flex';
});

document.getElementById('size-btns').addEventListener('click', function(e) {
    var target = e.target;
    if (target.tagName.toLowerCase() !== 'button') {
        target = target.closest('button');
    }
    if (target) {
        var level = target.getAttribute('data-difficulty');
        if (level && difficultyLevels[level]) {
            var config = difficultyLevels[level];
            boardRows = config.rows;
            boardCols = config.cols;
            totalMines = config.mines;
            init();
            render();
            configForm.style.display = 'none';
            gameContainer.style.display = 'flex';
        }
    }
});

boardEl.addEventListener('click', function(e) {
    handleCellClick(e, false);
});

boardEl.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    handleCellClick(e, true);
});

startBtn.addEventListener('click', function() {
    resetGame();
});

function handleCellClick(e, isRightClick) {
    if (winner || hitBomb) return;
    var clickedEl = e.target.tagName.toLowerCase() === 'img' ? e.target.parentElement : e.target;
    if (clickedEl.classList.contains('game-cell')) {
        var row = parseInt(clickedEl.dataset.row);
        var col = parseInt(clickedEl.dataset.col);
        var cell = board[row][col];

        if (firstClick) {
            addBombs(cell);
            runCodeForAllCells(function(cell){
                cell.calcAdjBombs();
            });
            firstClick = false;
            if (!timerId) setTimer();
        }

        if (isRightClick) {
            if (!cell.revealed) {
                bombCount += cell.flag() ? -1 : 1;
                render();
            }
        } else {
            if (!cell.flagged) {
                hitBomb = cell.reveal();
                if (hitBomb) {
                    revealAll();
                    clearInterval(timerId);
                    clickedEl.style.backgroundColor = 'red';
                }
                winner = getWinner();
                render();
            }
        }
    }
}

function createResetListener() { 
    document.getElementById('reset').addEventListener('click', function() {
        init();
        render();
    });
}

function setTimer() {
    timerId = setInterval(function(){
        elapsedTime += 1;
        document.getElementById('timer').innerText = elapsedTime.toString().padStart(3, '0');
    }, 1000);
}

function revealAll() {
    board.forEach(function(rowArr) {
        rowArr.forEach(function(cell) {
            cell.reveal();
        });
    });
}

function buildTable() {
    var topRow = `
    <tr>
        <td class="menu" id="window-title-bar" colspan="${boardCols}">
            <div id="window-title">Buscaminas</div>
        </td>
    </tr>
    <tr>
        <td class="menu" colspan="${boardCols}">
            <section id="status-bar">
                <div id="bomb-counter">000</div>
                <div id="reset"><img src="images/smiley-face.png" alt="Reset"></div>
                <div id="timer">000</div>
            </section>
        </td>
    </tr>
    `;
    boardEl.innerHTML = topRow + `<tr>${'<td class="game-cell"></td>'.repeat(boardCols)}</tr>`.repeat(boardRows);
    boardEl.style.width = `${boardCols * 30}px`;
    createResetListener();
    var cells = Array.from(document.querySelectorAll('td:not(.menu)'));
    cells.forEach(function(cell, idx) {
        cell.setAttribute('data-row', Math.floor(idx / boardCols));
        cell.setAttribute('data-col', idx % boardCols);
    });
}

function buildArrays() {
    var arr = Array(boardRows).fill(null);
    arr = arr.map(function() {
        return new Array(boardCols).fill(null);
    });
    return arr;
}

function buildCells(){
    board.forEach(function(rowArr, rowIdx) {
        rowArr.forEach(function(slot, colIdx) {
            board[rowIdx][colIdx] = new Cell(rowIdx, colIdx, board);
        });
    });
    if (!firstClick) {
        addBombs();
        runCodeForAllCells(function(cell){
            cell.calcAdjBombs();
        });
    }
}

function init() {
    buildTable();
    board = buildArrays();
    buildCells();
    bombCount = totalMines;
    elapsedTime = 0;
    clearInterval(timerId);
    timerId = null;
    hitBomb = false;
    winner = false;
    firstClick = true;
    document.getElementById('timer').innerText = '000';
    document.getElementById('bomb-counter').innerText = bombCount.toString().padStart(3, '0');
    document.getElementById('reset').innerHTML = '<img src="images/smiley-face.png" alt="Reset">';
}

function resetGame() {
    clearInterval(timerId);
    timerId = null;
    boardEl.innerHTML = '';
    configForm.reset();
    configForm.style.display = 'block';
    gameContainer.style.display = 'none';
    boardRows = null;
    boardCols = null;
    totalMines = null;
    board = null;
    bombCount = null;
    elapsedTime = 0;
    hitBomb = false;
    winner = false;
    firstClick = true;
    document.getElementById('timer').innerText = '000';
    document.getElementById('bomb-counter').innerText = '000';
}

function addBombs(initialCell) {
    var minesPlaced = 0;
    while (minesPlaced < totalMines) {
        var row = Math.floor(Math.random() * boardRows);
        var col = Math.floor(Math.random() * boardCols);
        var cell = board[row][col];
        if (!cell.bomb && cell !== initialCell) {
            cell.bomb = true;
            minesPlaced++;
        }
    }
}

function getWinner() {
    for (var row = 0; row < boardRows; row++) {
        for (var col = 0; col < boardCols; col++) {
            var cell = board[row][col];
            if (!cell.revealed && !cell.bomb) return false;
        }
    } 
    return true;
}

function render() {
    document.getElementById('bomb-counter').innerText = bombCount.toString().padStart(3, '0');
    var tdList = Array.from(document.querySelectorAll('[data-row]'));
    tdList.forEach(function(td) {
        var rowIdx = parseInt(td.getAttribute('data-row'));
        var colIdx = parseInt(td.getAttribute('data-col'));
        var cell = board[rowIdx][colIdx];
        if (cell.flagged) {
            td.innerHTML = flagImage;
        } else if (cell.revealed) {
            if (cell.bomb) {
                td.innerHTML = bombImage;
            } else if (cell.adjBombs) {
                td.className = 'revealed';
                td.style.color = colors[cell.adjBombs];
                td.textContent = cell.adjBombs;
            } else {
                td.className = 'revealed';
            }
        } else {
            td.innerHTML = '';
        }
    });
    if (hitBomb) {
        document.getElementById('reset').innerHTML = '<img src="images/dead-face.png" alt="Perdiste">';
        runCodeForAllCells(function(cell) {
            if (!cell.bomb && cell.flagged) {
                var td = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                td.innerHTML = wrongBombImage;
            }
        });
    } else if (winner) {
        document.getElementById('reset').innerHTML = '<img src="images/cool-face.png" alt="Ganaste">';
        clearInterval(timerId);
    }
}

function runCodeForAllCells(cb) {
    board.forEach(function(rowArr) {
        rowArr.forEach(function(cell) {
            cb(cell);
        });
    });
}

class Cell {
    constructor(row, col, board) {
        this.row = row;
        this.col = col;
        this.bomb = false;
        this.board = board;
        this.revealed = false;
        this.flagged = false;
    }

    getAdjCells() {
        var adj = [];
        var lastRow = board.length - 1;
        var lastCol = board[0].length - 1;
        if (this.row > 0 && this.col > 0) adj.push(board[this.row - 1][this.col - 1]);
        if (this.row > 0) adj.push(board[this.row - 1][this.col]);
        if (this.row > 0 && this.col < lastCol) adj.push(board[this.row - 1][this.col + 1]);
        if (this.col < lastCol) adj.push(board[this.row][this.col + 1]);
        if (this.row < lastRow && this.col < lastCol) adj.push(board[this.row + 1][this.col + 1]);
        if (this.row < lastRow) adj.push(board[this.row + 1][this.col]);
        if (this.row < lastRow && this.col > 0) adj.push(board[this.row + 1][this.col - 1]);
        if (this.col > 0) adj.push(board[this.row][this.col - 1]);       
        return adj;
    }

    calcAdjBombs() {
        var adjCells = this.getAdjCells();
        var adjBombs = adjCells.reduce(function(acc, cell) {
            return acc + (cell.bomb ? 1 : 0);
        }, 0);
        this.adjBombs = adjBombs;
    }

    flag() {
        if (!this.revealed) {
            this.flagged = !this.flagged;
            return this.flagged;
        }
    }

    reveal() {
        if (this.revealed && !hitBomb) return;
        this.revealed = true;
        if (this.bomb) return true;
        if (this.adjBombs === 0) {
            var adj = this.getAdjCells();
            adj.forEach(function(cell){
                if (!cell.revealed && !cell.flagged) cell.reveal();
            });
        }
        return false;
    }
}