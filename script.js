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

// 축제 운영자 공통 비밀번호
const OPERATOR_CODES = ['1004', '2004', '3004', '7777'];

// 게임 상태 변수
let balance = 1000;      // 초기 소지금 (필요시 변경 가능)
let currentBet = 100;    // 1회 스핀 배팅액
let isSpinning = false;
let isGameOver = false;
let adminMode = null;

// =========================================================================
// 🌟 초기화 및 게임 시작 (복구 완료)
// =========================================================================

// 사라졌던 '게임 시작' 버튼 기능 복구
function startGame() {
    // 시작 화면(setup-screen 등)을 숨깁니다
    const startScreen = document.getElementById('start-screen') || document.getElementById('setup-screen');
    if (startScreen) startScreen.style.display = 'none';

    // 게임 화면(game-screen 등)을 보여줍니다
    const gameScreen = document.getElementById('game-screen') || document.getElementById('play-screen');
    if (gameScreen) {
        gameScreen.classList.remove('hidden');
        gameScreen.style.display = 'block'; 
    }

    // 값 초기화 및 화면 세팅
    balance = 1000; 
    isGameOver = false;
    updateUI();
    showMessage('VIP 슬롯머신에 오신 것을 환영합니다.', '#fff');
}

function init() {
    updateUI();

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
        light.style.background = color1; 
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
        const sym = Math.floor(Math.random() * 4); 
        finalResults = [sym, sym, sym];
    } else if (adminMode === 'jackpot') {
        finalResults = [5, 5, 5]; 
    } else if (adminMode === 'lose') {
        finalResults = [0, 1, 2]; 
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
            // 우연히 3개가 같아지는 것을 방지
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
// 🎯 결과 확인 및 파산(0원) 검사
// =========================================================================
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

        // 🌟 소지금 0원 시 강제 종료 로직 🌟
        if (balance <= 0) {
            showMessage('잔액이 모두 소진되었습니다. 게임을 종료합니다.', '#ff6b6b');
            isGameOver = true;
            setTimeout(() => endGame(false), 2500);
            return; 
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
// 🚪 게임 종료 및 정산 처리 (비밀번호 검증 추가)
// =========================================================================
function endGame(isManualQuit) {
    isGameOver = true;
    let finalMessage = isManualQuit ? "게임을 종료하고 정산합니다." : "게임이 종료되었습니다.";
    
    // 화면을 덮는 정산 완료(파산) 오버레이 생성
    const overlay = document.createElement('div');
    overlay.id = 'end-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.95)'; // 더 어둡게 배경 처리
    overlay.style.backdropFilter = 'blur(10px)';
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
        <div style="font-size: 2.5rem; background: rgba(255,255,255,0.1); padding: 20px 40px; border-radius: 15px; border: 1px solid #555;">
            최종 잔액: <b style="color: ${balance > 0 ? 'gold' : '#ff6b6b'};">${balance.toLocaleString()} PT</b>
        </div>
        <p style="margin-top: 20px; color: #888; font-size: 1.1rem;">담당 진행요원에게 이 화면을 보여주세요.</p>
        
        <!-- 🌟 관리자 전용 리셋 구역 🌟 -->
        <div style="margin-top: 50px; padding-top: 30px; border-top: 1px dashed #555; display:flex; flex-direction:column; align-items:center; gap: 15px;">
            <p style="color: #ff3366; font-size: 0.9rem; margin:0;">🔒 다음 참가자를 위한 초기화 (운영자 전용)</p>
            <input type="password" id="admin-reset-pwd" placeholder="운영자 비밀번호 입력" style="padding: 15px; width: 250px; text-align:center; font-size:1.2rem; border-radius: 8px; border: 1px solid #555; background: #222; color: #fff; outline:none;">
            <button onclick="resetSlotGame()" style="padding: 15px; width: 250px; font-size: 1.2rem; font-weight: bold; border-radius: 8px; border: none; background: linear-gradient(135deg, #e82255, #aa0022); color: white; cursor: pointer; box-shadow: 0 5px 15px rgba(255,51,102,0.3);">처음으로 돌아가기</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // 비밀번호 입력창에서 엔터키를 쳐도 초기화 버튼이 눌리도록 이벤트 추가
    const pwdInput = document.getElementById('admin-reset-pwd');
    if (pwdInput) {
        pwdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') resetSlotGame();
        });
    }
}

// 관리자 비밀번호 확인 후 게임 새로고침(초기화)
function resetSlotGame() {
    const pwdInput = document.getElementById('admin-reset-pwd');
    const pwd = pwdInput.value;
    
    // 축제 앱과 동일하게 운영자 코드 검사
    if (OPERATOR_CODES.includes(pwd)) {
        // 완벽하게 게임 초기 상태로 되돌리기 위해 새로고침 실행
        location.reload(); 
    } else {
        alert('❌ 관리자 비밀번호가 틀렸습니다.');
        pwdInput.value = '';
        pwdInput.focus();
    }
}

// 스크립트가 불러와지면 init 함수 실행
window.onload = init;
