// 슬롯 기호 및 배당률 설정
const config = { 
  '🍒': 2.0, 
  '🍋': 3.0, 
  '🍇': 5.0, 
  '💎': 10.0, 
  '7️⃣': 15.0 
};

// 기호 배열 생성
const symbols = Object.keys(config);

// 릴 한 칸의 크기 (CSS의 --reel-size와 동일해야 함)
const reelSize = 120;