// Elements
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const successModal = document.getElementById('successModal');
const closeModal = document.getElementById('closeModal');
const secondChanceModal = document.getElementById('secondChanceModal');
const closeSecondChance = document.getElementById('closeSecondChance');

// NO 버튼 도망가기 설정 (rem 단위 기준 변환)
const MOVE_RADIUS_REM = 5;  // 기본 도망 거리 (rem) - 8에서 5로 줄임
const MAX_ESCAPES = 13;     // 최대 도망 횟수
const MIN_SAFE_DISTANCE_REM = 5; // YES 버튼과의 최소 안전 거리 (rem)

// NO 버튼 활성화 상태
let escapeCount = 0; // 도망간 횟수 카운트
let currentX = 0;
let currentY = 0;

// NO 버튼 초기 위치 설정
noBtn.style.transform = `translate(0px, 0px)`;
noBtn.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // 빠른 반응속도

// NO 버튼 클릭 시 도망가기 (클릭 횟수 기준)
noBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 기본 동작(폼 제출 등) 방지
    
    // 클릭은 발생했지만 이미 mousedown에서 도망갔을 수 있음.
    // 여기서는 7번째 클릭일 때 모달 띄우는 역할에 집중
    
    if (escapeCount >= MAX_ESCAPES) {
        // 7번째 클릭 성공 -> "다시 기회" 모달 표시
        secondChanceModal.classList.add('show');
        
        // 다시 기회 모달을 띄운 후 초기화할지, 아니면 계속 잡힌 상태로 둘지 결정
        // "다시 기회를 드린다"는 것은 사용자가 YES를 선택하도록 유도하는 것
        // 여기서는 모달만 띄워주고, 닫으면 다시 NO를 누를 수 있게 하거나 리셋
        // 사용자가 "7번째는 잡힐 수 있게"라고 했으므로 버튼은 멈춘 상태
    }
});

// 마우스 다운(누르는 순간)에 도망가기 - 반응 속도 극대화
noBtn.addEventListener('mousedown', (e) => {
    // 7번째 미만일 때는 누르자마자 도망감
    if (escapeCount < MAX_ESCAPES) {
        e.preventDefault(); // 포커스 방지 등
        escapeCount++; // 횟수 증가
        escapeButton(); // 도망!
    }
});

// NO 버튼 도망가기 함수
function escapeButton() {
    const yesRect = yesBtn.getBoundingClientRect();
    const yesCenterX = yesRect.left + yesRect.width / 2;
    const yesCenterY = yesRect.top + yesRect.height / 2;
    
    const contentRect = document.querySelector('.content').getBoundingClientRect();
    
    // 현재 rem 크기 계산 (px 변환용)
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const moveRadiusPx = MOVE_RADIUS_REM * rootFontSize;
    const minSafeDistPx = MIN_SAFE_DISTANCE_REM * rootFontSize;
    
    // 현재 noBtn rect (이동 전 기준점)
    const startRect = noBtn.getBoundingClientRect();
    
    // 버튼의 초기 위치(translate(0,0)) 기준점 계산
    const originX = startRect.left - currentX;
    const originY = startRect.top - currentY;
    
    // 이동 가능한 최대/최소 범위 계산 (content 박스 내부로 한정)
    const padding = 20;
    const minTransX = contentRect.left - originX + padding;
    const maxTransX = contentRect.right - originX - startRect.width - padding;
    const minTransY = contentRect.top - originY + padding;
    const maxTransY = contentRect.bottom - originY - startRect.height - padding;
    
    let bestMoveX = currentX;
    let bestMoveY = currentY;
    let foundSafeSpot = false;
    let isBouncing = false; // 튕겨나가는 중인지 확인

    // 기본 애니메이션 (빠릿빠릿함)
    noBtn.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    // 적절한 위치를 찾을 때까지 시도
    for(let i = 0; i < 20; i++) {
        // 완전 랜덤 각도
        const randomAngle = Math.random() * Math.PI * 2;
        
        // 거리를 좀 더 다양하게
        const distance = moveRadiusPx * (0.8 + Math.random() * 0.7); 
        
        let deltaX = Math.cos(randomAngle) * distance;
        let deltaY = Math.sin(randomAngle) * distance;
        
        let tempX = currentX + deltaX;
        let tempY = currentY + deltaY;
        
        // 벽 충돌 감지 및 2배 반사 로직
        let hitWall = false;
        
        // 왼쪽이나 오른쪽 벽에 부딪히면
        if (tempX < minTransX || tempX > maxTransX) {
            deltaX = -deltaX * 2; // 반대 방향으로 2배 튕겨나감
            hitWall = true;
        }
        // 위나 아래 벽에 부딪히면
        if (tempY < minTransY || tempY > maxTransY) {
            deltaY = -deltaY * 2; // 반대 방향으로 2배 튕겨나감
            hitWall = true;
        }

        if (hitWall) {
            // 튕겨나간 델타값으로 새 위치 계산
            tempX = currentX + deltaX;
            tempY = currentY + deltaY;
            
            // 튕겨나간 위치도 박스를 벗어날 수 있으므로 다시 한번 제한
            // (무한히 튕기지 않고 반대편 벽에서 멈춤)
            if (tempX < minTransX) tempX = minTransX;
            if (tempX > maxTransX) tempX = maxTransX;
            if (tempY < minTransY) tempY = minTransY;
            if (tempY > maxTransY) tempY = maxTransY;
        } else {
            // 벽에 안 부딪혔으면 그냥 제한만 함 (안전장치)
            if (tempX < minTransX) tempX = minTransX;
            if (tempX > maxTransX) tempX = maxTransX;
            if (tempY < minTransY) tempY = minTransY;
            if (tempY > maxTransY) tempY = maxTransY;
        }
        
        // 제한된 위치에서의 절대 좌표 계산 (YES 버튼과 거리 비교용)
        const candidateAbsX = originX + tempX + startRect.width / 2;
        const candidateAbsY = originY + tempY + startRect.height / 2;
        
        // YES 버튼과의 거리 계산
        const distToYes = Math.sqrt(
            Math.pow(candidateAbsX - yesCenterX, 2) + 
            Math.pow(candidateAbsY - yesCenterY, 2)
        );
        
        // YES 버튼과 충분히 떨어져 있으면 채택
        if (distToYes >= minSafeDistPx) {
            bestMoveX = tempX;
            bestMoveY = tempY;
            foundSafeSpot = true;
            if (hitWall) isBouncing = true;
            break;
        }
    }
    
    // 만약 안전한 곳을 못 찾았다면 중앙으로 강제 이동
    if (!foundSafeSpot) {
        const contentCenterX = contentRect.left + contentRect.width / 2;
        const contentCenterY = contentRect.top + contentRect.height / 2;
        const btnCenterX = startRect.left + startRect.width / 2;
        const btnCenterY = startRect.top + startRect.height / 2;
        
        const vecX = contentCenterX - btnCenterX;
        const vecY = contentCenterY - btnCenterY;
        const len = Math.sqrt(vecX*vecX + vecY*vecY);
        
        bestMoveX = currentX + (vecX / len) * moveRadiusPx * 2;
        bestMoveY = currentY + (vecY / len) * moveRadiusPx * 2;
        isBouncing = true;
    }

    // 튕겨나갈 때만 탄성 있는 애니메이션 적용
    if (isBouncing) {
        noBtn.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)'; 
    }

    currentX = bestMoveX;
    currentY = bestMoveY;

    noBtn.style.transform = `translate(${currentX}px, ${currentY}px)`;
}

// YES 버튼 클릭 이벤트
yesBtn.addEventListener('click', () => {
    successModal.classList.add('show');
});

// NO 버튼 클릭 이벤트 - 클릭 시도 시 도망가기
// 위에서 이미 addEventListener를 등록했으므로 중복 제거를 위해 기존 코드 제거 또는 수정
// 기존 코드는 아래 부분에 있었음:
/*
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (escapeCount < MAX_ESCAPES) {
        const rect = noBtn.getBoundingClientRect();
        escapeButton(e.clientX, e.clientY, rect.left + rect.width/2, rect.top + rect.height/2);
    }
});

noBtn.addEventListener('mousedown', (e) => {
    if (escapeCount < MAX_ESCAPES) {
        e.preventDefault();
        const rect = noBtn.getBoundingClientRect();
        escapeButton(e.clientX, e.clientY, rect.left + rect.width/2, rect.top + rect.height/2);
    }
});
*/
// 깔끔하게 정리하기 위해 위의 새 로직으로 대체되었으므로,
// 하단의 중복 리스너들은 제거하거나 빈 함수로 
// (MultiEdit은 문자열 치환이므로, 기존 코드를 찾아 주석처리하거나 삭제해야 함)

// 두 번째 기회 모달 닫기 (NO 버튼 잡힘)
closeSecondChance.addEventListener('click', () => {
    secondChanceModal.classList.remove('show');
    location.reload(); // 페이지 새로고침
});

// 두 번째 기회 모달 배경 클릭 닫기
secondChanceModal.addEventListener('click', (e) => {
    if (e.target === secondChanceModal) {
        secondChanceModal.classList.remove('show');
        location.reload(); // 페이지 새로고침
    }
});

// 모달 닫기
closeModal.addEventListener('click', () => {
    successModal.classList.remove('show');
});

// 모달 배경 클릭 시 닫기
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('show');
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        successModal.classList.remove('show');
    }
});
