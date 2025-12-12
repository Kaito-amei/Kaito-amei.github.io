// 遊戲主變數
let board = Array(9).fill(null); // 棋盤狀態
let current = 'X'; // 當前玩家（玩家為X）
let active = true; // 控制遊戲是否進行中
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
        cell.onclick = () => playerMove(i);
        boardEl.appendChild(cell);
    }
}
// 玩家下棋
    function playerMove(i) {
    if (!active || board[i]) return;
    board[i] = 'X';
    updateBoard();
    if (checkWin(board, 'X')) {
    endGame('玩家 (X) 勝利！');
    return;
    } else if (isFull()) {
    endGame('平手！');
    return;
    }
    current = 'O';
    document.getElementById('status').innerText = '電腦思考中...';
    setTimeout(computerMove, 700); // 模擬電腦思考時間
}
// 電腦AI下棋邏輯
// 電腦AI下棋邏輯 (Minimax 完美版)
function computerMove() {
    if (!active) return;
    
    // Minimax 演算法會找到最佳移動 (獲勝或至少平手)
    let move = getBestMove(); 
    
    // 如果棋盤滿了，getBestMove 可能返回 null，但這應該被 isFull 捕捉
    if (move === null) {
         // 這表示棋盤已滿，但未判斷出勝負 (即平手)
        current = 'X';
        document.getElementById('status').innerText = '輪到玩家 (X)';
        return; 
    }

    // 執行最佳下棋
    board[move] = 'O';
    updateBoard();
    
    // 遊戲狀態檢查
    if (checkWin(board, 'O')) { // 注意這裡使用了修正後的 checkWin(board, player)
        endGame('電腦 (O) 勝利！');
        return;
    } else if (isFull()) {
        endGame('平手！');
        return;
    }

    current = 'X';
    document.getElementById('status').innerText = '輪到玩家 (X)';
}
// 更新畫面
   function updateBoard() {
   const cells = document.getElementsByClassName('cell');
   for (let i = 0; i < 9; i++) {
   cells[i].innerText = board[i] || '';
   }
   }
    // 判斷勝利
   function checkWin(currentBoard, player) {
   const wins = [
   [0,1,2],[3,4,5],[6,7,8],
   [0,3,6],[1,4,7],[2,5,8],
   [0,4,8],[2,4,6]
   ];
   return wins.some(([a,b,c]) => currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === player);
   }
    // 判斷是否平手
   function isFull() {
   return board.every(cell => cell !== null);
   }
   // 結束遊戲
   function endGame(message) {
   document.getElementById('status').innerText = message;
   active = false;
   }
       // 重開一局
   function resetGame() {
   init();
   }
   // 初始化
   init();
// Minimax 演算法：計算當前局面的最佳分數
function minimax(newBoard, player) {
    // 終止條件：如果電腦獲勝 (+10)
    if (checkWin(newBoard, 'O')) {
        return 10;
    } 
    // 終止條件：如果玩家獲勝 (-10)
    else if (checkWin(newBoard, 'X')) {
        return -10;
    } 
    // 終止條件：如果平手 (0)
    else if (newBoard.every(cell => cell !== null)) {
        return 0;
    }

    const availableMoves = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
    let bestScore;

    if (player === 'O') { // 電腦 (Maximizer)
        bestScore = -Infinity;
        for (let i of availableMoves) {
            newBoard[i] = 'O';
            let score = minimax(newBoard, 'X'); // 換成玩家回合
            newBoard[i] = null; // 撤銷移動
            bestScore = Math.max(bestScore, score);
        }
    } else { // 玩家 (Minimizer)
        bestScore = Infinity;
        for (let i of availableMoves) {
            newBoard[i] = 'X';
            let score = minimax(newBoard, 'O'); // 換成電腦回合
            newBoard[i] = null; // 撤銷移動
            bestScore = Math.min(bestScore, score);
        }
    }
    return bestScore;
}
// 遍歷所有空位，呼叫 Minimax 找到最佳的移動位置
function getBestMove() {
    let bestScore = -Infinity;
    let move = null;
    
    // 獲取所有空的索引
    const availableMoves = board.map((v, i) => v === null ? i : null).filter(v => v !== null);

    for (let i of availableMoves) {
        // 1. 嘗試下這一步
        board[i] = 'O';
        
        // 2. 呼叫 minimax，計算這一步之後的局面分數 (此時 Minimax 從玩家 X 回合開始計算)
        let score = minimax(board, 'X');
        
        // 3. 撤銷這一步 (恢復棋盤，因為我們只是在模擬)
        board[i] = null;
        
        // 4. 判斷是否為最佳移動
        if (score > bestScore) {
            bestScore = score;
            move = i;
        }
    }
    return move; // 回傳帶有最高分數的索引
}
