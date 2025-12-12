// 遊戲主變數
let board = Array(9).fill(null); // 棋盤狀態
let current = 'X'; // 當前玩家（玩家為X）
let active = true; // 控制遊戲是否進行中

// 輔助函數：找到可立即獲勝的位置，回傳索引 (給 computerMove 硬性檢查使用)
function findWinningMove(player) {
    const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
    ];
    for (let [a,b,c] of wins) {
        const line = [board[a], board[b], board[c]];
        // 檢查：該行是否有兩個指定的玩家棋子 AND 有一個空格 (null)
        if (line.filter(v => v === player).length === 2 && line.includes(null)) {
            // 回傳空格的索引
            return [a,b,c][line.indexOf(null)];
        }
    }
    return null;
}

// 初始化棋盤
function init() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    board = Array(9).fill(null);
    active = true;
    current = 'X';
    document.getElementById('status').innerText = '玩家 (X) 先手';
    // 建立9個格子
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        // 為了在 reset 時清除舊的顏色 class，我們在 init 時順便清理
        cell.classList.remove('x', 'o', 'win'); 
        cell.onclick = () => playerMove(i);
        boardEl.appendChild(cell);
    }
}

// 玩家下棋
function playerMove(i) {
    if (!active || board[i]) return;
    board[i] = 'X';
    const cells = document.getElementsByClassName('cell');
    cells[i].classList.add(current.toLowerCase());
    updateBoard();
    
    // 呼叫 checkWin 取得勝利線路 (用於標記)
    const playerWinLine = checkWin(board, 'X'); 

    if (playerWinLine) { 
        endGame('玩家 (X) 勝利！', playerWinLine); 
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }

    active = false; // 禁用輸入，等待電腦

    current = 'O';
    document.getElementById('status').innerText = '電腦思考中...';
    setTimeout(computerMove, 700); // 模擬電腦思考時間
}

// 電腦AI下棋邏輯 (Minimax 完美版)
function computerMove() {
    let move = null;
    
    // ⭐ 最終修正 1: 硬性檢查是否能立即獲勝 (優先級最高，不會錯過 +10 分)
    move = findWinningMove('O');
    
    // 如果不能立即獲勝，才使用 Minimax 尋找最佳移動
    if (move === null) {
        move = getBestMove(); 
    }

    // 處理棋盤已滿的情況 (理論上應該在 isFull 檢查到)
    if (move === null) {
        current = 'X';
        document.getElementById('status').innerText = '輪到玩家 (X)';
        return; 
    }

    // 執行最佳下棋
    board[move] = 'O';
    const cells = document.getElementsByClassName('cell');
    cells[move].classList.add(current.toLowerCase());
    updateBoard();
    
    const computerWinLine = checkWin(board, 'O'); 

    // 遊戲狀態檢查
    if (computerWinLine) { 
        endGame('電腦 (O) 勝利！', computerWinLine); 
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }

    active = true; // 重新啟用輸入
    
    current = 'X';
    document.getElementById('status').innerText = '輪到玩家 (X)';
}

// 更新畫面 (包含字體置中結構)
function updateBoard() {
    const cells = document.getElementsByClassName('cell');
    for (let i = 0; i < 9; i++) {
        const value = board[i];
        if (value) {
            // 使用 <span class="marker"> 結構以進行字體置中微調
            cells[i].innerHTML = `<span class="marker">${value}</span>`; 
        } else {
            cells[i].innerHTML = '';
        }
    }
}

// 判斷勝利 (遊戲結束標記專用：回傳勝利線路的索引陣列，否則回傳 null)
function checkWin(currentBoard, player) {
    const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
    ];
    
    const winningLine = wins.find(([a,b,c]) => 
        currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === player
    );
    
    return winningLine ? winningLine : null;
}

// 判斷是否平手
function isFull() {
    return board.every(cell => cell !== null);
}

// 結束遊戲
function endGame(message, winningLine = null) {
    document.getElementById('status').innerText = message;
    active = false;
    if (winningLine) {
        const cells = document.getElementsByClassName('cell');
        for (const index of winningLine) {
            cells[index].classList.add('win'); 
        }
    }
}

// 重開一局
function resetGame() {
    init();
}

// --- Minimax 核心函數 ---

// 專門給 Minimax 使用的布林值 checkWin 函數 (確保穩定性)
function checkWinBool(currentBoard, player) {
    const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
    ];
    return wins.some(([a,b,c]) => 
        currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === player
    );
}

// Minimax 演算法：計算當前局面的最佳分數 (修正：使用 .slice() 確保副本操作)
function minimax(currentBoard, player) {
    // 終止條件：如果電腦獲勝 (+10)
    if (checkWinBool(currentBoard, 'O')) { 
        return 10;
    } 
    // 終止條件：如果玩家獲勝 (-10)
    else if (checkWinBool(currentBoard, 'X')) { 
        return -10;
    } 
    // 終止條件：如果平手 (0)
    else if (currentBoard.every(cell => cell !== null)) {
        return 0;
    }

    const availableMoves = currentBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
    let bestScore;

    if (player === 'O') { // 電腦 (Maximizer)
        bestScore = -Infinity;
        for (let i of availableMoves) {
            let tempBoard = currentBoard.slice(); // 創建副本
            tempBoard[i] = 'O'; 
            let score = minimax(tempBoard, 'X'); 
            bestScore = Math.max(bestScore, score);
        }
    } else { // 玩家 (Minimizer)
        bestScore = Infinity;
        for (let i of availableMoves) {
            let tempBoard = currentBoard.slice(); // 創建副本
            tempBoard[i] = 'X';
            let score = minimax(tempBoard, 'O'); 
            bestScore = Math.min(bestScore, score);
        }
    }
    return bestScore;
}

// 遍歷所有空位，呼叫 Minimax 找到最佳的移動位置 (修正：純 Minimax 邏輯 + 中心優化)
function getBestMove() {
    let bestScore = -Infinity;
    let move = null;
    
    const availableMoves = board.map((v, i) => v === null ? i : null).filter(v => v !== null);

    // Minimax 優先選擇獲勝步，這裡只處理平手時的優化
    for (let i of availableMoves) {
        board[i] = 'O';
        let score = minimax(board, 'X');
        board[i] = null;
        
        if (score > bestScore) {
            bestScore = score;
            move = i;
        }
    }
    
    // ⭐ 優化：當有多個移動都導致最佳分數 (例如都是平手 0) 時，優先選擇中心格 (4)
    if (board[4] === null && availableMoves.includes(4)) { 
        // Minimax 會自動找到 +10，這裡只處理 0 分的情況。
        // 如果中心格能帶來與 bestScore 相同的結果，則選擇中心格。
        if (bestScore === 0) {
            return 4; 
        }
    }

    return move; 
}

// 初始化
init();