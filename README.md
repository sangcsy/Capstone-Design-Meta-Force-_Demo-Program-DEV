# 메인 페이지 웹 프로젝트

## 개요
이 프로젝트는 단계별 워크플로우를 체험할 수 있도록 만든 웹 애플리케이션입니다. 메인 페이지에서 업로드 → 특징 선택 → 모델 추론 → 시각화 단계를 한 화면에서 빠르게 진행할 수 있습니다.

## 프로젝트 구조
```
main-page-web
├── public
│   └── index.html
├── src
│   ├── index.js
│   ├── app.js
│   ├── pages
│   │   ├── mainPage.js
│   │   ├── step1.js
│   │   ├── step2.js
│   │   └── step3.js
│   ├── components
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   └── StepCard.js
│   └── styles
│       └── main.css
├── package.json
├── .gitignore
└── README.md
```

# 설치
1. 리포지토리 클론:
   ```
   git clone <repository-url>
   ```
2. 프로젝트 디렉터리로 이동:
   ```
   cd main-page-web
   ```
3. 프론트엔드 의존성 설치:
   ```
   npm install
   ```

## 사용법
플랫폼은 Flask API(백엔드)와 CRA 기반 React 앱(프론트엔드)로 나뉘며, 로컬 환경에서 두 프로세스를 동시에 실행해야 합니다.

### 1. 서버 (Flask API) 실행
1. 가상환경 준비(선택 사항이지만 권장):
   ```
   cd server
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   ```
2. 의존성 설치 및 모델 파일 배치:
   ```
   pip install -r requirements.txt
   mkdir -p models
   cp <학습된-모델>.pkl models/random_forest.pkl  # 모델 타입별로 이름을 맞춰 배치
   ```
   - 지원 모델: `random_forest`, `xgboost`, `lightgbm`. 각각 `models/<모델이름>.pkl`로 둡니다.
3. Flask 서버 실행:
   ```
   python app.py
   ```
   - 서버는 `http://127.0.0.1:5000`에서 동작하며 `/api/datasets/upload`, `/api/run-model`, `/api/performance` 등을 제공합니다.
   - 업로드된 CSV는 `server/uploads/`에 저장됩니다.

### 2. 프론트엔드 (React) 실행
1. 루트 디렉터리(프로젝트 최상단)에서 의존성 설치:
   ```
   npm install
   ```
2. 개발 서버 실행:
   ```
   npm start
   ```
   - `http://localhost:3000`에서 접속 가능하며, 프록시 설정이 자동으로 Flask 서버(`127.0.0.1:5000`)와 통신합니다.
   - 개발 모드이므로 성능 최적화는 포함되지 않습니다. 프로덕션 빌드는 `npm run build`.

### 3. 데모 사용 흐름
1. **CSV 업로드**  
   - 메인 페이지 상단 업로드 박스에서 CSV를 선택하면 업로드 진행률이 표시되고, 완료 시 서버가 열 목록/행 수/미리보기 5행을 반환합니다.  
   - 대용량 파일도 열 구조만 분석하므로 브라우저가 다운되지 않습니다.

2. **1단계: 특징 선택**  
   - 업로드된 CSV 열과 사전 정의된 커스텀 특징을 체크박스로 선택합니다.  
   - 커스텀 특징은 `Burstiness Index` 등 파생 수식으로 계산되며 서버에서 자동 생성됩니다.
   - “선택 특징 추출” 버튼으로 현재 선택 상태를 확정할 수 있습니다.

3. **2단계: 모델 추론**  
   - 타깃 컬럼(레이블)과 사용할 모델 타입(Random Forest/XGBoost/LightGBM)을 선택하고 하이퍼파라미터를 입력합니다.  
   - “추론 실행”을 누르면 업로드된 데이터에서 선택한 특징만 추출해 서버의 사전 학습 모델에 투입하고, 지표/혼동 행렬을 계산합니다.  
   - 실행 기록은 자동 저장되어 Step3에서 비교할 수 있습니다.

4. **3단계: 성능 시각화**  
   - 최근 최대 4개의 실행 결과를 Accuracy/Precision/Recall/F1로 비교하고, 혼동 행렬을 각각 시각화합니다.  
   - 모델별 상위 5개 특징 기여도(importance) 막대, ROC 곡선 샘플(AUC 포함)도 제공해 어떤 특징/모델이 가장 기여했는지 확인할 수 있습니다.

### 4. 기타 팁
- CSV 파일은 타깃 컬럼을 포함해야 하며, Step2에서 해당 컬럼을 선택해야 추론을 실행할 수 있습니다.
- 서버 로그(Flask 실행 터미널)에서 업로드/추론 상태를 확인하고, React 쪽 오류는 `npm start` 터미널 또는 브라우저 DevTools에서 확인하세요.
- 모델 파일이 없거나 포맷이 맞지 않으면 서버가 자동으로 시뮬레이션 지표를 반환해 UI는 계속 동작하지만, 실제 모델 결과를 보려면 `.pkl`을 올바르게 배치해야 합니다.

## 주요 기능
- 단계별 네비게이션(특징 선택 → 모델 추론 → 성능 시각화)
- 반응형 레이아웃과 공통 Header/Footer 컴포넌트
- 업로드 진행률 표시, CSV 미리보기, 커스텀 특징 선택
- 추론 결과 지표/혼동 행렬, 특징 기여도 Top5, ROC/AUC 비교

## 라이선스
MIT License
