let balance = 0;
let isSpinning = false;
let isGameOver = false;
let adminMode = null; 
const reelsDOM = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
const stealthLight = document.getElementById('stealth-light');

function setStealthLight(color, shadow) {
  stealthLight.style.backgroundColor = color;
  stealthLight.style.boxShadow = `0 0 5px ${shadow}`;
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

window.addEventListener('keydown', e => {
  if (document.getElementById('game-screen').classList.contains('active') && !isGameOver) {
    const key = e.key.toLowerCase();

    if (key === ' ' || e.code === 'Space') {
      e.preventDefault(); 
      if (!isSpinning) spin();
    }

    if (key === 'z') { adminMode = 0; setStealthLight('rgba(0, 100, 255, 0.3)', 'rgba(0, 100, 255, 0.2)'); }
    if (key === 'x') { adminMode = 1; setStealthLight('rgba(0, 255, 255, 0.3)', 'rgba(0, 255, 255, 0.2)'); }
    if (key === 'c') { adminMode = 2; setStealthLight('rgba(0, 255, 0, 0.3)', 'rgba(0, 255, 0, 0.2)'); }
    if (key === 'v') { adminMode = 3; setStealthLight('rgba(255, 255, 0, 0.3)', 'rgba(255, 255, 0, 0.2)'); }
    if (key === 'b') { adminMode = 4; setStealthLight('rgba(200, 0, 255, 0.3)', 'rgba(200, 0, 255, 0.2)'); }
    if (key === 'n') { adminMode = 'lose'; setStealthLight('rgba(255, 0, 0, 0.3)', 'rgba(255, 0, 0, 0.2)'); }
    if (key === 'm') { adminMode = null; setStealthLight('transparent', 'transparent'); }
  }
});

function startGame() {
  balance = parseInt(document.getElementById('start-balance').value) || 1000;
  isGameOver = false;
  showScreen('game-screen');
  buildReels();
  updateUI();
}

function buildReels() {
  reelsDOM.forEach(reel => {
    let html = '';
    for (let i = 0; i < 15; i++) {
      symbols.forEach(s => html += `<li class="symbol">${s}</li>`);
    }
    reel.innerHTML = html;
    reel.style.transform = 'translateY(0px)';
  });
}

function updateUI() {
  document.getElementById('balance-display').innerText = balance.toLocaleString();
}

function showMessage(text, color = 'var(--gold-light)') {
  const msgBoard = document.getElementById('message-board');
  msgBoard.innerText = text;
  msgBoard.style.color = color;
}

// 🎯 커스텀 확률 (꽝 95%)
function getRandomResultByProbability() {
  const rand = Math.random() * 100; 
  if (rand < 95) return 'lose';                
  else if (rand < 98) return 0;                
  else if (rand < 99.5) return 1;                
  else if (rand < 99.99) return 2;                
  else if (rand < 99.999) return 3;              
  else return 4;                                  
}

function getForcedLoseArray() {
  const first = Math.floor(Math.random() * symbols.length);
  return [first, (first + 1) % symbols.length, (first + 2) % symbols.length];
}

async function spin() {
  if (document.activeElement === document.getElementById('bet-input')) {
    document.getElementById('bet-input').blur();
  }

  const bet = parseInt(document.getElementById('bet-input').value) || 100;

  if (isSpinning || isGameOver) return;
  if (balance < bet || bet <= 0) {
    showMessage('잔액(PT)이 부족합니다.', '#ff6b6b');
    return;
  }

  isSpinning = true;
  balance -= bet;
  updateUI();
  document.getElementById('spin-btn').disabled = true;
  document.getElementById('quit-btn').disabled = true; 
  showMessage('머신이 회전하고 있습니다...', '#ccc');

  const handle = document.getElementById('handle-container');
  handle.classList.add('pulling');
  setTimeout(() => handle.classList.remove('pulling'), 500);

  let results = [];
  if (adminMode === 'lose') {
    results = getForcedLoseArray();
  } else if (adminMode !== null) {
    results = [adminMode, adminMode, adminMode];
  } else {
    const probResult = getRandomResultByProbability();
    if (probResult === 'lose') {
      results = getForcedLoseArray();
    } else {
      results = [probResult, probResult, probResult];
    }
  }

  const promises = reelsDOM.map((reel, i) => new Promise(resolve => {
    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0px)';
    void reel.offsetHeight;

    const move = (reelSize * symbols.length * (5 + i)) + (results[i] * reelSize);
    const duration = 2.5 + i * 0.6;

    reel.style.transition = `transform ${duration}s cubic-bezier(0.1, 0.8, 0.1, 1)`;
    reel.style.transform = `translateY(-${move}px)`;

    setTimeout(resolve, duration * 1000);
  }));

  await Promise.all(promises);
  checkResult(results, bet);
}

function checkResult(results, bet) {
  if (results[0] === results[1] && results[1] === results[2]) {
    const symbol = symbols[results[0]];
    const winAmount = Math.floor(bet * config[symbol]);
    balance += winAmount;
    showMessage(`🎉 당첨! +${winAmount.toLocaleString()} PT (${symbol})`, 'var(--gold)');
    updateUI();

    // 당첨 시 2.5초 대기 후 강제 게임 종료
    isGameOver = true;
    setTimeout(() => endGame(false), 2500);

  } else {
    showMessage('아쉽습니다. 다음 기회에 도전하십시오.', '#888');
    updateUI();
    isSpinning = false;
    adminMode = null; 
    setStealthLight('transparent', 'transparent');
    document.getElementById('spin-btn').disabled = false;
    document.getElementById('quit-btn').disabled = false;
  }
}

// 게임 종료 및 정산
function endGame(isManual = false) {
  if(isSpinning && !isGameOver) return; 
  isGameOver = true;
  
  let bonusMessage = "";
  if (isManual) {
    balance += 200; 
    bonusMessage = "<br><span style='font-size: 18px; color: #7dff9a; display: block; margin-top: 15px; font-family: sans-serif;'>💡 수동 종료 보너스 +200 PT 지급!</span>";
  }

  document.getElementById('final-balance-display').innerHTML = balance.toLocaleString() + ' PT' + bonusMessage;
  showScreen('game-over-screen');

}
