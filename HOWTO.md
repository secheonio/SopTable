# 개발 및 실행 방법 안내

## 1. 프론트엔드(React) 실행 방법

1. 터미널에서 frontend 폴더로 이동
   ```powershell
   cd frontend
   ```
2. 개발 서버 실행
   ```powershell
   npm start
   ```
3. 브라우저에서 http://localhost:3000 접속

---

## 2. 백엔드(Node.js/Express) 실행 방법

1. 터미널에서 backend 폴더로 이동
   ```powershell
   cd backend
   ```
2. 서버 실행
   ```powershell
   node index.js
   ```
3. 브라우저에서 http://localhost:4000 접속 ("Backend 서버가 정상적으로 동작합니다!" 메시지 확인)

---

## 3. 개발 워크플로우

1. 기능 개발 시, main 브랜치에서 바로 작업하지 않고 feature 브랜치 생성
   ```powershell
   git checkout -b feature/기능명
   ```
2. 작업 후 변경사항 커밋
   ```powershell
   git add .
   git commit -m "기능 설명"
   ```
3. 원격 저장소로 푸시
   ```powershell
   git push origin feature/기능명
   ```
4. GitHub에서 Pull Request(PR) 생성 후 코드 리뷰 및 main 브랜치로 병합

---

## 4. 기타
- 필요시 npm install로 의존성 설치
- 문제가 생기면 오류 메시지와 함께 문의
