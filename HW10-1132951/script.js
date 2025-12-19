const boardElement = document.getElementById('board');
const scoreBlackEl = document.getElementById('scoreBlack');
const scoreWhiteEl = document.getElementById('scoreWhite');
const statusEl = document.getElementById('status');
const difficultySelect = document.getElementById('difficulty');
const showHintsCheckbox = document.getElementById('showHints');

let board = [];
let currentPlayer = 'black';
let isGameActive = true;
let isAnimating = false;

// 權重表 (角落分數高，角落旁分數低)
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

function renderBoard() {
    boardElement.innerHTML = '';
    // 取得所有合法步數
    let validMoves = getValidMoves(currentPlayer);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            // 情況1：有棋子
            if (board[r][c]) {
                const piece = document.createElement('div');
                piece.classList.add('piece', board[r][c]);
                piece.id = `piece-${r}-${c}`;
                cell.appendChild(piece);
            } 
            // 情況2：空格
            else {
                // 檢查是否為合法落子點
                const move = validMoves.find(m => m.r === r && m.c === c);
                
                if (move) {
                    // 重要修正：只要是合法步數，無論有沒有開提示，都要能點擊
                    cell.classList.add('valid-move'); 
                    cell.onclick = () => handleUserMove(r, c);

                    // 只有在 (輪到玩家) 且 (開啟提示選項) 時才畫出數字圈圈
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

// 輔助函式：清除所有提示 (讓畫面變乾淨)
function clearHints() {
    document.querySelectorAll('.hint').forEach(el => el.remove());
    // 移除 valid-move 樣式，讓使用者知道現在不能點
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('valid-move');
        el.onclick = null;
    });
}

async function handleUserMove(r, c) {
    if (!isGameActive || isAnimating || currentPlayer !== 'black') return;

    // 玩家落子瞬間，立刻清除提示
    clearHints();

    const flips = getFlips(r, c, 'black');
    if (flips.length > 0) {
        await executeMove(r, c, flips, 'black');
        
        currentPlayer = 'white';
        updateStatus("電腦思考中...");
        
        // 延遲一下進入電腦回合
        setTimeout(computerTurn, 800);
    }
}

async function computerTurn() {
    if (!isGameActive) return;

    // 確保電腦思考時也不會有殘留的提示
    clearHints();

    const validMoves = getValidMoves('white');
    
    if (validMoves.length === 0) {
        if (getValidMoves('black').length === 0) {
            endGame();
        } else {
            currentPlayer = 'black';
            updateStatus("電腦無處可下，輪到你了");
            renderBoard(); // 重繪並顯示提示
        }
        return;
    }

    let bestMove;
    const difficulty = difficultySelect.value;

    if (difficulty === 'easy') {
        bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    } else {
        // 進階邏輯
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
        renderBoard(); // 電腦下完，輪到玩家，這時才會再次顯示提示
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
        await new Promise(resolve => setTimeout(resolve, 50));
        
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

function endGame() {
    isGameActive = false;
    let black = parseInt(scoreBlackEl.textContent);
    let white = parseInt(scoreWhiteEl.textContent);
    let msg = "";
    if (black > white) msg = "恭喜！你贏了！🎉";
    else if (white > black) msg = "電腦贏了，再接再厲！🤖";
    else msg = "平手！🤝";
    
    statusEl.textContent = `遊戲結束 - ${msg}`;
    alert(msg);
}

function resetGame() {
    initGame();
}

// 監聽 Checkbox 變化
showHintsCheckbox.addEventListener('change', () => {
    // 只有在輪到玩家且沒有動畫時才重繪
    if(currentPlayer === 'black' && !isAnimating) renderBoard();
});

initGame();