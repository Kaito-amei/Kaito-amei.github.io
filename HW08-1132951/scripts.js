// 初始變數
const boardE1 = document.getElementById('board');
const cells = Array.from(document.querySelectorAll('.cell'));
const btnReset = document.getElementById('reset');
const btnResetAll = document.getElementById('reset-all');
const turnEl = document.getElementById('turn');
const stateEl = document.getElementById('state');
const wLine =  document.getElementById('winnerLine');
let board, current, active;
//三格成直線狀態
const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
];
// 起始函式
function init(){
    board = Array(9).fill('');
    current = 'X';
    active = true;
    cells.forEach(c=>{
    c.textContent = '';
    c.className = 'cell';
    c.disabled = false;
    });
    turnEl.textContent = current;
    stateEl.textContent = '';
    wLine.style.opacity = '0';
}
// 下手
function place(idx){
    if(!active || board[idx]) return;
    board[idx] = current;
    const cell = cells[idx];
    cell.textContent = current;
    cell.classList.add(current.toLowerCase());
    const result = evaluate();
    if(result.finished){
    endGame(result);
    }else{
    switchTurn();
    }
}
// 換手函式
function switchTurn(){
    current = current==='X' ? 'O' : 'X';
    turnEl.textContent = current;
}
// 下手後計算是否成一線結束遊戲的函式
function evaluate(){
    for(const line of WIN_LINES){
        const [a,b,c] = line;
        if(board[a] && board[a]===board[b] && board[a]===board[c]){
            return { finished:true, winner:board[a], line };
        }
    }
    if(board.every(v=>v)) return { finished:true, winner:null };
    return { finished:false };
}
//線
function drawLine(type, posi){
    wLine.style.opacity = '1'; wLine.style.width = '90%';
    if(type=="horizontal"){
        wLine.style.left = '5%';
        wLine.style.transform = 'rotate(0deg)';
        const percentageTop = (posi * 33.333) + 16.666;
        wLine.style.top = `calc(${percentageTop}% - 0.5%)`;
    }else if(type=="vertical"){
        const colCenterPercentage = (posi * 33.333) + 16.666;
        let leftOffset = `calc(${colCenterPercentage}% - 0.5%)`; 
        if (posi === 0) { 
            leftOffset = `calc(${leftOffset} + 1%)`; 
        } else if (posi === 2) { // 第 2 欄，最靠右，偏左較輕微
            leftOffset = `calc(${leftOffset} + 1.5%)`; 
        }
        wLine.style.left = leftOffset;
        wLine.style.top = '5%';
        wLine.style.transform = 'rotate(90deg)';
    }else if(type === "backslash"){ // 左上到右下 (\)
        wLine.style.width = '127.2791%'; // 對角線寬度
        wLine.style.top = '5%';
        wLine.style.left = '5%';
        wLine.style.transform = 'rotate(45deg)';
        
    }else if(type === "slash"){ // 右上到左下 (/)
        wLine.style.width = '127.2791%';
        wLine.style.top = '95%'; // 從底部開始
        wLine.style.left = '5%';
        wLine.style.transform = 'rotate(-45deg)'; // 逆時針旋轉
    }
}
//
cells.forEach(cell=>{
 cell.addEventListener('click', ()=>{
 const idx = +cell.getAttribute('data-idx');
 place(idx);
 });
});
btnReset.addEventListener('click', init);
//
init();
// 計分板元素
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawEl = document.getElementById('score-draw');

// 計分用變數
let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;
/**
* 遊戲結束，處理勝利或平手
* @param {object} param0 - {winner, line}
*/
function endGame({winner, line}){
    active = false;
    turnEl.textContent = "無ㅤㅤ";
    if(winner){
        stateEl.textContent = `${winner} 勝利！`;
        if(line[1] === line[0] + 1 && line[2] === line[1] + 1){
            drawLine("horizontal",line[0]/3);
        }else if(line[1] === line[0] + 3 && line[2] === line[1] + 3){
            drawLine("vertical",line[0]);
        }else if(line[0] === 0 && line[2] === 8){
            drawLine("backslash", 0);
        }else if(line[0] === 2 && line[2] === 6){
            drawLine("slash", 0); 
        }
        line.forEach(i=> cells[i].classList.add('win'));
        if(winner==='X') scoreX++; else scoreO++;
    }else{
        stateEl.textContent = '平手';
        scoreDraw++;
    }
    updateScoreboard();
    cells.forEach(c=> c.disabled = true);
}
/**
* 更新計分板數字
*/
function updateScoreboard(){
    scoreXEl.textContent = scoreX;
    scoreOEl.textContent = scoreO;
    scoreDrawEl.textContent = scoreDraw;
}
// 綁定事件：重開遊戲（保留分數）
btnReset.addEventListener('click', init);
// 綁定事件：重置計分（連同遊戲）
btnResetAll.addEventListener('click', ()=>{
    scoreX = scoreO = scoreDraw = 0;
    updateScoreboard();
    init();
});

