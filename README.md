# AI Encrypted Traffic Analysis Platform

## Overview
This project is a comprehensive web application designed to detect malicious behavior within encrypted network traffic using advanced machine learning algorithms. It provides a step-by-step workflow for data processing, model training, and performance analysis.

## Key Features

### 1. Feature Selection & Extraction
- Upload CSV datasets (e.g., UNSW-NB15, CICIDS2017).
- Select specific network flow features for analysis.
- Supports automatic dataset type detection for label mapping.

### 2. Model Training
- Train various machine learning models:
  - **Random Forest**
  - **XGBoost**
  - **Decision Tree**
  - **KNN (K-Nearest Neighbors)**
- Customizable hyperparameters (e.g., Learning Rate).
- Real-time training progress monitoring.

### 3. Performance Analysis
- Visualize model performance with key metrics:
  - **Accuracy, Precision, Recall, F1-Score**
- **Detailed Classification Report**: View detection rates for specific attack types (e.g., DoS, Exploits, PortScan).
- **Feature Importance**: Identify which network features are most critical for detection.
- Download analysis reports as CSV.

## Project Structure
```
project-root
├── backend
│   ├── app.py              # Flask Backend Server
│   └── uploads             # Data storage
├── src
│   ├── pages
│   │   ├── mainPage.js     # Landing Page
│   │   ├── step1.js        # Data Processing
│   │   ├── step2.js        # Model Training
│   │   └── step3.js        # Result Visualization
│   └── ...
├── label_Mapping.json      # Attack Label Mappings
└── README.md
```

## Installation & Usage

### Prerequisites
- Node.js & npm
- Python 3.8+

### 1. Backend Setup
Navigate to the root directory and install Python dependencies:
```bash
pip install flask flask-cors pandas numpy scikit-learn xgboost
```
Start the backend server:
```bash
python backend/app.py
```
*The server will run on http://localhost:5000*

### 2. Frontend Setup
In a new terminal, install Node dependencies:
```bash
npm install
```
Start the React application:
```bash
npm start
```
*The application will open at http://localhost:3000*

## Supported Datasets
- **UNSW-NB15**: Comprehensive network intrusion dataset.
- **CICIDS2017**: Intrusion detection dataset with diverse attacks.
- **ISCX-VPN**: VPN vs Non-VPN traffic classification.

## License
This project is licensed under the MIT License.