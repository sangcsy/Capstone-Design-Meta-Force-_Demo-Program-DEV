# AI 암호화 트래픽 분석 플랫폼 (AI Encrypted Traffic Analysis Platform)

## 개요 (Overview)
이 프로젝트는 머신러닝 알고리즘을 활용하여 암호화된 네트워크 트래픽 내의 악성 행위를 탐지하는 웹 애플리케이션입니다. 데이터 전처리부터 모델 학습, 성능 분석까지의 전체 과정을 단계별로 제공합니다.

## 주요 기능 (Key Features)

### 1. 특징 선택 및 추출 (Feature Selection)
- CSV 데이터셋 업로드 지원 (예: UNSW-NB15, CICIDS2017).
- 분석에 필요한 네트워크 플로우 특징(Feature) 선택 기능.
- 파일명을 기반으로 데이터셋 종류를 자동 인식하여 라벨 매핑 적용.

### 2. 모델 학습 (Model Training)
- 다양한 머신러닝 모델 학습 지원:
  - **Random Forest**
  - **XGBoost**
  - **Decision Tree**
  - **KNN (K-Nearest Neighbors)**
- 하이퍼파라미터(학습률 등) 사용자 설정 가능.
- 실시간 학습 진행률 모니터링.

### 3. 성능 분석 (Performance Analysis)
- 주요 성능 지표 시각화:
  - **정확도(Accuracy), 정밀도(Precision), 재현율(Recall), F1-Score**
- **상세 탐지 리포트**: 공격 유형별(예: DoS, Exploits) 탐지 성능 확인 가능.
- **특징 중요도(Feature Importance)**: 탐지에 가장 큰 영향을 미친 특징 식별.
- 분석 결과 CSV 다운로드 기능.

## 프로젝트 구조 (Project Structure)
```
project-root
├── backend
│   ├── app.py              # Flask 백엔드 서버
│   └── uploads             # 데이터 파일 저장소
├── src
│   ├── pages
│   │   ├── mainPage.js     # 메인 페이지
│   │   ├── step1.js        # 1단계: 데이터 처리
│   │   ├── step2.js        # 2단계: 모델 학습
│   │   └── step3.js        # 3단계: 결과 분석
│   └── ...
├── label_Mapping.json      # 공격 라벨 매핑 정보
└── README.md
```

## 설치 및 실행 방법 (Installation & Usage)

### 사전 요구사항
- Node.js & npm
- Python 3.8 이상

### 1. 백엔드 설정 (Backend)
루트 디렉토리에서 Python 라이브러리를 설치합니다:
```bash
pip install flask flask-cors pandas numpy scikit-learn xgboost
```
백엔드 서버를 실행합니다:
```bash
python backend/app.py
```
*서버는 http://localhost:5000 에서 실행됩니다.*

### 2. 프론트엔드 설정 (Frontend)
새 터미널을 열고 Node 패키지를 설치합니다:
```bash
npm install
```
React 애플리케이션을 실행합니다:
```bash
npm start
```
*애플리케이션이 http://localhost:3000 에서 자동으로 열립니다.*

## 지원 데이터셋 (Supported Datasets)
- **UNSW-NB15**: 포괄적인 네트워크 침입 탐지 데이터셋
- **CICIDS2017**: 다양한 최신 공격 시나리오가 포함된 데이터셋
- **ISCX-VPN**: VPN 및 Non-VPN 트래픽 분류 데이터셋

## 라이선스 (License)
이 프로젝트는 MIT 라이선스를 따릅니다.