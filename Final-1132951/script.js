class NineBoardGo {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0)); 
        this.currentPlayer = 1;
        this.gameHistory = [];
        this.consecutivePasses = 0;
        this.aiEnabled = true; 
        this.gameOver = false;
        this.previousBoardStr = ""; 
        this.isProcessing = false; 
        this.warningTimeout = null;
        
        this.loadStats();
        
        this.initBoard();
        this.updateStatus();
        
        // ★ 初始化時更新按鈕樣式
        this.updateAIButtonVisuals();

        document.getElementById('passBtn').onclick = () => this.pass();
        document.getElementById('undoBtn').onclick = () => this.undoMove();
    }

    loadStats() {
        const bWins = localStorage.getItem('go_black_wins') || 0;
        const wWins = localStorage.getItem('go_white_wins') || 0;
        document.getElementById('totalBlackWins').textContent = bWins;
        document.getElementById('totalWhiteWins').textContent = wWins;
    }

    saveStats(winnerColor) {
        let bWins = parseInt(localStorage.getItem('go_black_wins') || 0);
        let wWins = parseInt(localStorage.getItem('go_white_wins') || 0);

        if (winnerColor === 1) {
            bWins++;
            localStorage.setItem('go_black_wins', bWins);
        } else if (winnerColor === -1) {
            wWins++;
            localStorage.setItem('go_white_wins', wWins);
        }
        this.loadStats(); 
    }

    initBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => this.handleClick(r, c));
                boardEl.appendChild(cell);
            }
        }
    }

    // ★ 新增：更新 AI 按鈕視覺的函式
    updateAIButtonVisuals() {
        const btn = document.getElementById('aiBtn');
        if (this.aiEnabled) {
            btn.textContent = "AI 對弈 (開)";
            btn.classList.add('ai-on');
            btn.classList.remove('ai-off');
        } else {
            btn.textContent = "AI 對弈 (關)";
            btn.classList.add('ai-off');
            btn.classList.remove('ai-on');
        }
    }

    async handleClick(row, col) {
        if (this.gameOver || this.isProcessing) return;
        if (this.aiEnabled && this.currentPlayer === -1) return;

        const invalidReason = this.getInvalidReason(row, col);
        if (!invalidReason) {
            await this.makeMove(row, col, this.currentPlayer);
            
            if (this.aiEnabled && !this.gameOver && this.currentPlayer === -1) {
                setTimeout(() => this.aiMove(), 400);
            }
        } else {
            this.showWarning(invalidReason);
        }
    }

    showWarning(message) {
        const statusEl = document.getElementById('status');
        if (this.warningTimeout) clearTimeout(this.warningTimeout);
        statusEl.textContent = `❌ ${message}`;
        statusEl.className = 'status warning';
        this.warningTimeout = setTimeout(() => {
            this.updateStatus(); 
            this.warningTimeout = null;
        }, 1500);
    }

    getInvalidReason(row, col) {
        if (this.board[row][col] !== 0) return "這裡已經有棋子了";

        const player = this.currentPlayer;
        const opponent = -player;
        const tempBoard = this.board.map(r => [...r]);
        tempBoard[row][col] = player;

        let captured = false;
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for (let [dr, dc] of dirs) {
            const nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && tempBoard[nr][nc] === opponent) {
                if (!this.hasLiberties(tempBoard, nr, nc, opponent)) {
                    captured = true;
                    this.removeGroupFromTempBoard(tempBoard, nr, nc, opponent);
                }
            }
        }

        if (!captured && !this.hasLiberties(tempBoard, row, col, player)) {
            return "禁著點：這是自殺 (無氣)";
        }

        const currentBoardStr = JSON.stringify(tempBoard);
        if (currentBoardStr === this.previousBoardStr) {
            return "禁著點：打劫 (Ko) - 不能重複同局面";
        }

        return null;
    }

    removeGroupFromTempBoard(board, row, col, color) {
        const stack = [{r:row, c:col}];
        board[row][col] = 0; 
        
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        while(stack.length) {
            const curr = stack.pop();
            for(let d of dirs){
                let nr = curr.r + d[0], nc = curr.c + d[1];
                if(nr>=0 && nr<9 && nc>=0 && nc<9 && board[nr][nc] === color){
                    board[nr][nc] = 0; 
                    stack.push({r:nr, c:nc});
                }
            }
        }
    }

    pass() {
        if (this.gameOver || this.isProcessing) return;
        
        this.consecutivePasses++;
        this.gameHistory.push({ 
            type: 'pass', 
            player: this.currentPlayer,
            passes: this.consecutivePasses,
            boardSnapshot: JSON.stringify(this.board),
            prevBoardStr: this.previousBoardStr
        });
        
        document.getElementById('passCount').textContent = this.consecutivePasses;
        
        if (this.consecutivePasses >= 2) {
            this.endGame('雙方連續虛手，遊戲結束');
            return;
        }

        this.currentPlayer = -this.currentPlayer;
        this.updateStatus();

        if (this.aiEnabled && this.currentPlayer === -1) {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    isValidMove(row, col) {
        return this.getInvalidReason(row, col) === null;
    }

    async makeMove(row, col, player) {
        try {
            this.isProcessing = true;
            this.previousBoardStr = JSON.stringify(this.board);

            this.board[row][col] = player;
            this.consecutivePasses = 0;
            document.getElementById('passCount').textContent = '0';
            
            this.updateBoardDisplay(); 
            await new Promise(r => setTimeout(r, 50)); 

            const opponent = -player;
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            let capturedStones = [];
            
            for (let [dr, dc] of dirs) {
                const r = row + dr, c = col + dc;
                if (r >= 0 && r < 9 && c >= 0 && c < 9 && this.board[r][c] === opponent) {
                    if (!this.hasLiberties(this.board, r, c, opponent)) {
                        capturedStones.push(...this.findGroup(r, c, opponent));
                    }
                }
            }

            if (capturedStones.length > 0) {
                const uniqueStones = [];
                const visitedKey = new Set();
                capturedStones.forEach(s => {
                    const key = `${s.r},${s.c}`;
                    if(!visitedKey.has(key)) {
                        visitedKey.add(key);
                        uniqueStones.push(s);
                    }
                });

                uniqueStones.forEach(pos => {
                    const cell = document.querySelector(`.cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
                    if(cell && cell.firstChild) cell.firstChild.classList.add('captured');
                });

                await new Promise(r => setTimeout(r, 300));

                uniqueStones.forEach(pos => {
                    this.board[pos.r][pos.c] = 0;
                });
                
                this.updateBoardDisplay();
            }

            this.gameHistory.push({
                type: 'move',
                row, col, player,
                passes: 0,
                captured: capturedStones.length,
                boardSnapshot: JSON.stringify(this.board),
                prevBoardStr: this.previousBoardStr 
            });

            this.lastMove = {row, col};
            this.currentPlayer = -player;
            this.updateStatus(); 

        } catch (error) {
            console.error("Move Error:", error);
        } finally {
            this.isProcessing = false;
        }
    }

    findGroup(row, col, color) {
        const group = [];
        const stack = [{r:row, c:col}];
        const visited = Array(9).fill().map(() => Array(9).fill(false));
        visited[row][col] = true;
        
        while(stack.length) {
            const curr = stack.pop();
            group.push(curr);
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for(let d of dirs){
                let nr = curr.r + d[0], nc = curr.c + d[1];
                if(nr>=0 && nr<9 && nc>=0 && nc<9 && !visited[nr][nc] && this.board[nr][nc] === color){
                    visited[nr][nc] = true;
                    stack.push({r:nr, c:nc});
                }
            }
        }
        return group;
    }

    hasLiberties(board, row, col, color) {
        const stack = [{r: row, c: col}];
        const visited = new Set();
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        
        while(stack.length > 0) {
            const {r, c} = stack.pop();
            const key = `${r},${c}`;
            if (visited.has(key)) continue;
            visited.add(key);

            for (let [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9) {
                    if (board[nr][nc] === 0) return true;
                    if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                        stack.push({r: nr, c: nc});
                    }
                }
            }
        }
        return false;
    }

    async aiMove() {
        if (this.gameOver) return;

        const moves = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.isValidMove(r, c)) {
                    if (this.isSelfEye(r, c, -1)) continue; 
                    const score = this.evaluatePosition(r, c);
                    moves.push({r, c, score});
                }
            }
        }

        if (moves.length === 0) {
            this.pass();
            return;
        }

        moves.sort((a, b) => b.score - a.score);
        const bestMove = moves[0];

        if (bestMove.score < 1.0) {
            this.pass();
            return;
        }

        await this.makeMove(bestMove.r, bestMove.c, -1);
    }

    isSelfEye(r, c, player) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        let friendlyCount = 0;
        let borderCount = 0;
        for(let d of dirs){
            let nr = r+d[0], nc = c+d[1];
            if(nr<0 || nr>=9 || nc<0 || nc>=9) borderCount++;
            else if (this.board[nr][nc] === player) friendlyCount++;
            else return false;
        }
        return (friendlyCount + borderCount) === 4;
    }

    evaluatePosition(r, c) {
        let score = 0;
        if (r===0||r===8||c===0||c===8) score += 2;
        if ((r===2||r===6) && (c===2||c===6)) score += 4; 
        
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for(let d of dirs){
            let nr = r+d[0], nc = c+d[1];
            if(nr>=0&&nr<9&&nc>=0&&nc<9) {
                const neighbor = this.board[nr][nc];
                if(neighbor === 1) score += 3;
                if(neighbor === -1) score += 1;
            }
        }
        score += Math.random() * 0.5;
        if (this.isSurroundedBySelf(r, c, -1)) score -= 5;
        return score;
    }

    isSurroundedBySelf(r, c, player) {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        for(let d of dirs){
            let nr = r+d[0], nc = c+d[1];
            if(nr>=0 && nr<9 && nc>=0 && nc < 9) {
                if(this.board[nr][nc] !== player) return false;
            }
        }
        return true;
    }

    updateBoardDisplay() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const val = this.board[r][c];
            
            if (val === 0) {
                cell.innerHTML = '';
            } else {
                const existingStone = cell.querySelector('.stone');
                const isBlack = val === 1;
                
                if (!existingStone || (isBlack && !existingStone.classList.contains('black')) || (!isBlack && !existingStone.classList.contains('white'))) {
                    cell.innerHTML = '';
                    const stone = document.createElement('div');
                    stone.className = val === 1 ? 'stone black' : 'stone white';
                    cell.appendChild(stone);
                } else {
                    existingStone.classList.remove('captured');
                }
            }
            
            if (this.lastMove && this.lastMove.row === r && this.lastMove.col === c && val !== 0) {
                const existingMarker = cell.querySelector('.last-move-marker');
                if (!existingMarker) {
                    const marker = document.createElement('div');
                    marker.className = 'last-move-marker';
                    if (cell.firstChild) {
                        cell.firstChild.style.display = 'flex';
                        cell.firstChild.style.alignItems = 'center';
                        cell.firstChild.style.justifyContent = 'center';
                        cell.firstChild.appendChild(marker);
                    }
                }
            } else {
                const m = cell.querySelector('.last-move-marker');
                if(m) m.remove();
            }
        });
        
        let b = 0, w = 0;
        this.board.forEach(row => row.forEach(v => {
            if (v===1) b++; else if(v===-1) w++;
        }));
        document.getElementById('blackScore').textContent = b;
        document.getElementById('whiteScore').textContent = w;
    }

    undoMove() {
        if(this.isProcessing) return; 
        if(this.gameHistory.length === 0) return;

        let steps = 1;
        if (this.aiEnabled && this.gameHistory.length >= 2 && this.currentPlayer === 1) {
            steps = 2;
        }

        for(let i=0; i<steps; i++) {
            if(this.gameHistory.length === 0) break;
            this.gameHistory.pop();
        }

        if(this.gameHistory.length === 0) {
            this.board = Array(9).fill().map(() => Array(9).fill(0));
            this.currentPlayer = 1;
            this.consecutivePasses = 0;
            this.lastMove = null;
            this.previousBoardStr = "";
        } else {
            const lastState = this.gameHistory[this.gameHistory.length - 1];
            this.board = JSON.parse(lastState.boardSnapshot);
            this.currentPlayer = -lastState.player; 
            this.consecutivePasses = lastState.passes; 
            this.previousBoardStr = lastState.prevBoardStr || ""; 
            
            if (lastState.type === 'move') {
                this.lastMove = { row: lastState.row, col: lastState.col };
            } else {
                this.lastMove = null;
            }
        }

        this.gameOver = false;
        document.getElementById('status').classList.remove('game-over', 'atari', 'warning');
        document.getElementById('passCount').textContent = this.consecutivePasses;

        document.querySelectorAll('.territory-mark').forEach(el => el.remove());

        this.updateBoardDisplay();
        this.updateStatus();
    }

    updateStatus() {
        if (this.warningTimeout) return;
        if(this.gameOver) return;
        
        const statusEl = document.getElementById('status');
        const name = this.currentPlayer === 1 ? "🖤 黑棋" : "🤍 白棋";
        
        const myStones = this.currentPlayer; 
        
        let isAtari = false;
        const visited = new Set();
        for(let r=0; r<9; r++){
            for(let c=0; c<9; c++){
                if(this.board[r][c] === myStones && !visited.has(`${r},${c}`)) {
                    const libs = this.countLiberties(r, c, myStones, visited);
                    if(libs === 1) {
                        isAtari = true;
                    }
                }
            }
        }

        statusEl.className = 'status'; 
        if (isAtari) statusEl.classList.add('atari');

        let text = `${name} 回合`;
        if (this.consecutivePasses > 0) text += " (對手已虛手)";
        if (isAtari) text += " ⚠️ 叫吃！";

        statusEl.textContent = text;
    }

    countLiberties(r, c, color, globalVisited) {
        const stack = [{r, c}];
        const localVisited = new Set(); 
        const liberties = new Set();    
        
        while(stack.length) {
            const curr = stack.pop();
            const key = `${curr.r},${curr.c}`;
            if(localVisited.has(key)) continue;
            localVisited.add(key);
            if(globalVisited) globalVisited.add(key);

            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for(let d of dirs){
                let nr = curr.r+d[0], nc = curr.c+d[1];
                if(nr>=0 && nr<9 && nc>=0 && nc<9) {
                    if(this.board[nr][nc] === 0) {
                        liberties.add(`${nr},${nc}`);
                    } else if (this.board[nr][nc] === color && !localVisited.has(`${nr},${nc}`)) {
                        stack.push({r:nr, c:nc});
                    }
                }
            }
        }
        return liberties.size;
    }

    endGame(reason) {
        this.gameOver = true;
        let blackPoints = 0;
        let whitePoints = 0;

        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if(this.board[r][c] === 1) blackPoints++;
                else if(this.board[r][c] === -1) whitePoints++;
            }
        }

        const visited = Array(9).fill().map(()=>Array(9).fill(false));
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if(this.board[r][c] === 0 && !visited[r][c]) {
                    const territory = this.checkTerritory(r, c, visited);
                    
                    if(territory.owner !== 0) {
                        if(territory.owner === 1) blackPoints += territory.count;
                        else whitePoints += territory.count;

                        territory.cells.forEach(pos => {
                            const cell = document.querySelector(`.cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
                            const mark = document.createElement('div');
                            mark.className = `territory-mark ${territory.owner === 1 ? 'black-owner' : 'white-owner'}`;
                            cell.appendChild(mark);
                        });
                    }
                }
            }
        }

        const resultText = `黑棋: ${blackPoints} (子+地) | 白棋: ${whitePoints} (子+地)`;
        let winnerName = "";
        let winnerColor = 0;

        if (blackPoints > whitePoints) {
            winnerName = "黑棋勝";
            winnerColor = 1;
        } else if (whitePoints > blackPoints) {
            winnerName = "白棋勝";
            winnerColor = -1;
        } else {
            winnerName = "平手";
            winnerColor = 0;
        }
        
        if (winnerColor !== 0) {
            this.saveStats(winnerColor);
        }

        const statusEl = document.getElementById('status');
        statusEl.innerHTML = `${reason}<br><strong>${winnerName}！</strong><br>${resultText}`;
        statusEl.classList.remove('atari');
        statusEl.classList.add('game-over');
    }

    checkTerritory(r, c, visited) {
        const queue = [{r, c}];
        visited[r][c] = true;
        const cells = [{r,c}]; 
        let touchBlack = false;
        let touchWhite = false;
        
        while(queue.length > 0) {
            const curr = queue.shift();
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for(let d of dirs) {
                const nr = curr.r + d[0], nc = curr.c + d[1];
                if(nr>=0 && nr<9 && nc>=0 && nc<9) {
                    const val = this.board[nr][nc];
                    if(val === 0) {
                        if(!visited[nr][nc]) {
                            visited[nr][nc] = true;
                            queue.push({r:nr, c:nc});
                            cells.push({r:nr, c:nc});
                        }
                    } else if (val === 1) {
                        touchBlack = true;
                    } else if (val === -1) {
                        touchWhite = true;
                    }
                }
            }
        }
        
        let owner = 0; 
        if(touchBlack && !touchWhite) owner = 1;
        if(!touchBlack && touchWhite) owner = -1;
        
        return { count: cells.length, owner, cells };
    }
}

let game;
function newGame() {
    game = new NineBoardGo();
    document.getElementById('blackScore').textContent = '0';
    document.getElementById('whiteScore').textContent = '0';
    document.getElementById('passCount').textContent = '0';
    document.getElementById('status').classList.remove('game-over', 'atari', 'warning');
    document.querySelectorAll('.territory-mark').forEach(el => el.remove());
}

function toggleAI() {
    if(game) {
        game.aiEnabled = !game.aiEnabled;
        // ★ 更新按鈕視覺
        game.updateAIButtonVisuals();
        
        if (game.aiEnabled && game.currentPlayer === -1 && !game.gameOver) {
             setTimeout(() => game.aiMove(), 500);
        }
    }
}

function resetStats() {
    if(confirm('確定要清除所有歷史戰績嗎？此動作無法復原喔！')) {
        localStorage.removeItem('go_black_wins');
        localStorage.removeItem('go_white_wins');
        if(game) game.loadStats(); 
        alert('戰績已重置歸零！');
    }
}

window.onload = newGame;