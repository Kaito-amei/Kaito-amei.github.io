const boardElement = document.getElementById('board');
const scoreBlackEl = document.getElementById('scoreBlack');
const scoreWhiteEl = document.getElementById('scoreWhite');
const statusEl = document.getElementById('status');
const difficultySelect = document.getElementById('difficulty');
const showHintsCheckbox = document.getElementById('showHints');

// 新增：歷史戰績元素
const historyWinEl = document.getElementById('historyWin');
const historyLoseEl = document.getElementById('historyLose');
const historyDrawEl = document.getElementById('historyDraw');

let board = [];
let currentPlayer = 'black';
let isGameActive = true;
let isAnimating = false;

// 戰績統計
let history = {
    win: 0,
    lose: 0,
    draw: 0
};

// 權重表
const weights = [
    [100, -20, 10,  5,  5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [ 10,  -2, -1, -1, -1, -1,  -2,  10],
    [  5,  -2, -1, -1, -1, -1,  -2,   5],
    [  5,  -2, -1, -1, -1, -1,  -2,   5],
    [ 10,  -2, -1, -1, -1, -1,  -2,  10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10,  5,  5, 10, -20, 100]
];

const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// 初始化遊戲 (不影響歷史戰績)
function initGame() {
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';
    
    currentPlayer = 'black';
    isGameActive = true;
    isAnimating = false;
    renderBoard();
    updateStatus();
}

// 渲染棋盤
function renderBoard() {
    boardElement.innerHTML = '';
    let validMoves = getValidMoves(currentPlayer);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            if (board[r][c]) {
                const piece = document.createElement('div');
                piece.classList.add('piece', board[r][c]);
                cell.appendChild(piece);
            } else {
                const move = validMoves.find(m => m.r === r && m.c === c);
                if (move) {
                    cell.classList.add('valid-move'); 
                    cell.onclick = () => handleUserMove(r, c);

                    if (currentPlayer === 'black' && showHintsCheckbox.checked) {
                        const hint = document.createElement('div');
                        hint.classList.add('hint');
                        hint.textContent = move.flips.length;
                        cell.appendChild(hint);
                    }
                }
            }
            boardElement.appendChild(cell);
        }
    }
    updateScore();
}

function clearHints() {
    document.querySelectorAll('.hint').forEach(el => el.remove());
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('valid-move');
        el.onclick = null;
    });
}

async function handleUserMove(r, c) {
    if (!isGameActive || isAnimating || currentPlayer !== 'black') return;

    clearHints();

    const flips = getFlips(r, c, 'black');
    if (flips.length > 0) {
        await executeMove(r, c, flips, 'black');
        currentPlayer = 'white';
        updateStatus("電腦思考中...");
        setTimeout(computerTurn, 800);
    }
}

async function computerTurn() {
    if (!isGameActive) return;
    clearHints();

    const validMoves = getValidMoves('white');
    
    if (validMoves.length === 0) {
        if (getValidMoves('black').length === 0) {
            endGame();
        } else {
            currentPlayer = 'black';
            updateStatus("電腦無處可下，輪到你了");
            renderBoard();
        }
        return;
    }

    let bestMove;
    const difficulty = difficultySelect.value;

    if (difficulty === 'easy') {
        bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        bestMove = validMoves.reduce((best, move) => {
            const score = weights[move.r][move.c] + move.flips.length; 
            return score > best.score ? { move, score } : best;
        }, { score: -9999 }).move;
    }

    await executeMove(bestMove.r, bestMove.c, bestMove.flips, 'white');

    if (getValidMoves('black').length === 0) {
        if (getValidMoves('white').length === 0) {
            endGame();
        } else {
            updateStatus("你無處可下，電腦繼續");
            setTimeout(computerTurn, 1000);
        }
    } else {
        currentPlayer = 'black';
        updateStatus();
        renderBoard();
    }
}

async function executeMove(r, c, flips, color) {
    isAnimating = true;
    board[r][c] = color;
    const cellIndex = r * 8 + c;
    const cell = boardElement.children[cellIndex];
    cell.innerHTML = ''; 
    const newPiece = document.createElement('div');
    newPiece.classList.add('piece', color);
    cell.appendChild(newPiece);

    for (let i = 0; i < flips.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const flipR = flips[i].r;
        const flipC = flips[i].c;
        const flipCellIndex = flipR * 8 + flipC;
        const pieceToFlip = boardElement.children[flipCellIndex].querySelector('.piece');

        if (pieceToFlip) {
            pieceToFlip.style.transform = "rotateY(90deg)";
            await new Promise(resolve => setTimeout(resolve, 150)); 
            pieceToFlip.classList.remove(color === 'black' ? 'white' : 'black');
            pieceToFlip.classList.add(color);
            board[flipR][flipC] = color;
            pieceToFlip.style.transform = "rotateY(0deg)";
        }
    }
    isAnimating = false;
    updateScore();
}

function getValidMoves(color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === null) {
                const flips = getFlips(r, c, color);
                if (flips.length > 0) {
                    moves.push({ r, c, flips });
                }
            }
        }
    }
    return moves;
}

function getFlips(r, c, color) {
    const opponent = color === 'black' ? 'white' : 'black';
    let flips = [];
    for (let [dr, dc] of directions) {
        let rCurr = r + dr;
        let cCurr = c + dc;
        let potentialFlips = [];
        while (rCurr >= 0 && rCurr < 8 && cCurr >= 0 && cCurr < 8 && board[rCurr][cCurr] === opponent) {
            potentialFlips.push({ r: rCurr, c: cCurr });
            rCurr += dr;
            cCurr += dc;
        }
        if (rCurr >= 0 && rCurr < 8 && cCurr >= 0 && cCurr < 8 && board[rCurr][cCurr] === color) {
            flips = flips.concat(potentialFlips);
        }
    }
    return flips;
}

function updateScore() {
    let black = 0, white = 0;
    board.forEach(row => row.forEach(cell => {
        if (cell === 'black') black++;
        if (cell === 'white') white++;
    }));
    scoreBlackEl.textContent = black;
    scoreWhiteEl.textContent = white;
}

function updateStatus(msg) {
    if (msg) {
        statusEl.textContent = msg;
    } else {
        statusEl.textContent = currentPlayer === 'black' ? "輪到你了 (黑棋)" : "電腦思考中 (白棋)...";
    }
}

// 遊戲結束：更新戰績
function endGame() {
    isGameActive = false;
    let black = parseInt(scoreBlackEl.textContent);
    let white = parseInt(scoreWhiteEl.textContent);
    let msg = "";
    
    if (black > white) {
        msg = "恭喜！你贏了！🎉";
        history.win++;
    } else if (white > black) {
        msg = "電腦贏了，再接再厲！🤖";
        history.lose++;
    } else {
        msg = "平手！🤝";
        history.draw++;
    }
    
    updateHistoryUI();
    statusEl.textContent = `遊戲結束 - ${msg}`;
    
    // 延遲一點點再跳視窗，讓玩家看到最後一顆子落下
    setTimeout(() => alert(msg), 300);
}

// 更新戰績 UI
function updateHistoryUI() {
    historyWinEl.textContent = history.win;
    historyLoseEl.textContent = history.lose;
    historyDrawEl.textContent = history.draw;
}

// 功能：再來一局 (保留戰績)
function nextRound() {
    initGame();
}

// 功能：全部重置 (戰績歸零)
function fullReset() {
    if(confirm("確定要重置所有戰績嗎？")) {
        history = { win: 0, lose: 0, draw: 0 };
        updateHistoryUI();
        initGame();
    }
}

showHintsCheckbox.addEventListener('change', () => {
    if(currentPlayer === 'black' && !isAnimating) renderBoard();
});

// 啟動
initGame();