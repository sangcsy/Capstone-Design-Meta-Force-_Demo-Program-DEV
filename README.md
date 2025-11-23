# Main Page Web Project

## Overview
This project is a web application designed to guide users through a series of steps. The main page serves as the entry point, providing navigation to different steps of the application.

## Project Structure
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

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd main-page-web
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
이 프로젝트는 Flask 기반 API 서버와 React 프론트엔드로 구성됩니다.

### 1. 서버 (Flask API)
```
cd server
pip install -r requirements.txt
python app.py
```
서버가 `http://localhost:5000`에서 `/api/features`, `/api/run-model`, `/api/performance` 엔드포인트를 제공합니다.

### 2. 프론트엔드 (React)
```
npm install
npm start
```
`npm start`를 실행하면 CRA 개발 서버가 열리고, API 요청은 `proxy` 설정을 통해 Flask 서버로 전달됩니다.

## Features
- Main page with navigation to different steps.
- Responsive design with consistent header and footer across all pages.
- Step cards that provide information about each step.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.
