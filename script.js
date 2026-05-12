// =========================================================================
// 🎰 VIP 슬롯머신 게임 데이터 및 로직
// =========================================================================

const symbols = ['🍒', '🍋', '🍉', '🔔', '💎', '7️⃣'];

// 심볼별 배당률
const config = {
    '🍒': 2,
    '🍋': 3,
    '🍉': 5,
    '🔔': 10,
    '💎': 20,
    '7️⃣': 50
};

// 게임 상태 변수
let balance = 1000;      // 초기 소지금 (필요시 변경 가능)
let currentBet = 100;    // 1회 스핀 배팅액
let isSpinning = false;
let isGameOver = false;
let adminMode = null;

// =========================================================================
// 🌟 초기화 및 이벤트 연결
// =========================================================================
function init() {
    updateUI();
    showMessage('VIP 슬롯머신에 오신 것을 환영합니다.', '#fff');

    // 키보드 이벤트 (관리자 비밀 조작용)
    // 숫자 1: 강제 당첨, 숫자 2: 강제 실패, 숫자 3: 강제 잭팟
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') { adminMode = 'win'; setStealthLight('var(--neon-green)', 'transparent'); }
        if (e.key === '2') { adminMode = 'lose'; setStealthLight('var(--danger)', 'transparent'); }
        if (e.key === '3') { adminMode = 'jackpot'; setStealthLight('var(--gold)', 'transparent'); }
    });
}

function updateUI() {
    const balanceElem = document.getElementById('balance');
    const betElem = document.getElementById('bet-amount');
    
    if (balanceElem) balanceElem.innerText = balance.toLocaleString();
    if (betElem) betElem.innerText = currentBet.toLocaleString();
}

function showMessage(msg, color = '#fff') {
    const msgElem = document.getElementById('message');
    if (msgElem) {
        msgElem.innerText = msg;
        msgElem.style.color = color;
    }
}

function setStealthLight(color1, color2) {
    const light = document.getElementById('stealth-light');
    if (light) {
        light.style.background = color1; // 관리자 모드가 켜졌는지 몰래 확인하는 조명
    }
}

// =========================================================================
// 🎰 슬롯머신 구동 로직
// =========================================================================
function spin() {
    if (isSpinning || isGameOver) return;
    if (balance < currentBet) {
        showMessage('잔액이 부족합니다.', '#ff6b6b');
        return;
    }

    isSpinning = true;
    balance -= currentBet;
    updateUI();
    showMessage('슬롯이 돌아갑니다...', '#aaa');
    
    // 버튼 잠금
    const spinBtn = document.getElementById('spin-btn');
    const quitBtn = document.getElementById('quit-btn');
    if(spinBtn) spinBtn.disabled = true;
    if(quitBtn) quitBtn.disabled = true;

    // 결과 결정 (관리자 모드 개입)
    let finalResults = [];
    if (adminMode === 'win') {
        const sym = Math.floor(Math.random() * 4); // 🍒, 🍋, 🍉, 🔔 중 하나 당첨
        finalResults = [sym, sym, sym];
    } else if (adminMode === 'jackpot') {
        finalResults = [5, 5, 5]; // 7️⃣ 7️⃣ 7️⃣ 무조건 당첨
    } else if (adminMode === 'lose') {
        finalResults = [0, 1, 2]; // 무조건 꽝
    } else {
        // 자연 확률 (승률 약 20%)
        if (Math.random() < 0.20) {
            const sym = Math.floor(Math.random() * symbols.length);
            finalResults = [sym, sym, sym];
        } else {
            finalResults = [
                Math.floor(Math.random() * symbols.length),
                Math.floor(Math.random() * symbols.length),
                Math.floor(Math.random() * symbols.length)
            ];
            // 우연히 3개가 같아지는 것을 방지 (꽝 보장)
            if (finalResults[0] === finalResults[1] && finalResults[1] === finalResults[2]) {
                finalResults[2] = (finalResults[2] + 1) % symbols.length;
            }
        }
    }

    // 릴 애니메이션
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    
    let spinCount = 0;
    const spinInterval = setInterval(() => {
        reels.forEach(reel => {
            if (reel) reel.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        });
        spinCount++;
        
        // 약 2초간 회전 후 멈춤
        if (spinCount >= 20) {
            clearInterval(spinInterval);
            reels[0].innerText = symbols[finalResults[0]];
            reels[1].innerText = symbols[finalResults[1]];
            reels[2].innerText = symbols[finalResults[2]];
            
            checkResult(finalResults, currentBet);
        }
    }, 100);
}

// =========================================================================
// 🎯 결과 확인 및 파산(0원) 검사 (요청하신 기능 반영 완료)
// =========================================================================
function checkResult(results, bet) {
    if (results[0] === results[1] && results[1] === results[2]) {
        const symbol = symbols[results[0]];
        const winAmount = Math.floor(bet * config[symbol]);
        balance += winAmount;
        showMessage(`🎉 당첨! +${winAmount.toLocaleString()} PT (${symbol})`, 'gold');
        updateUI();

        // 당첨 시 2.5초 대기 후 강제 게임 종료
        isGameOver = true;
        setTimeout(() => endGame(false), 2500);

    } else {
        showMessage('아쉽습니다. 다음 기회에 도전하십시오.', '#888');
        updateUI();

        // 🌟 요청하신 [잔액 0원 시 강제 종료] 로직 🌟
        if (balance <= 0) {
            showMessage('잔액이 모두 소진되었습니다. 게임을 종료합니다.', '#ff6b6b');
            isGameOver = true;
            setTimeout(() => endGame(false), 2500);
            return; // 강제 종료되므로 아래 코드는 무시됨
        }

        // 잔액이 남아있으면 다음 스핀 준비
        isSpinning = false;
        adminMode = null; 
        setStealthLight('transparent', 'transparent');
        
        const spinBtn = document.getElementById('spin-btn');
        const quitBtn = document.getElementById('quit-btn');
        if(spinBtn) spinBtn.disabled = false;
        if(quitBtn) quitBtn.disabled = false;
    }
}

// =========================================================================
// 🚪 게임 종료 및 정산 처리
// =========================================================================
function endGame(isManualQuit) {
    isGameOver = true;
    let finalMessage = isManualQuit ? "게임을 종료하고 정산합니다." : "게임이 종료되었습니다.";
    
    // 화면을 덮는 정산 완료(파산) 오버레이 생성
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.9)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.color = '#fff';

    overlay.innerHTML = `
        <h1 style="color: ${balance > 0 ? 'gold' : '#ff6b6b'}; font-size: 3rem; margin-bottom: 20px; font-family: 'Orbitron', sans-serif;">
            ${balance > 0 ? '💰 정산 완료 💰' : '💀 파산 💀'}
        </h1>
        <p style="font-size: 1.5rem; margin-bottom: 30px;">${finalMessage}</p>
        <div style="font-size: 2rem; background: rgba(255,255,255,0.1); padding: 20px 40px; border-radius: 15px; border: 1px solid #555;">
            최종 잔액: <b style="color: ${balance > 0 ? 'gold' : '#ff6b6b'};">${balance.toLocaleString()} PT</b>
        </div>
        <p style="margin-top: 30px; color: #888; font-size: 1rem;">담당 진행요원에게 최종 화면을 보여주세요.</p>
    `;

    document.body.appendChild(overlay);
}

// 스크립트가 불러와지면 init 함수 실행
window.onload = init;
