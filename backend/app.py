from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from xgboost import XGBClassifier
import time
import datetime
import os
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# 파일 업로드 설정
UPLOAD_FOLDER = 'backend/uploads'
ALLOWED_EXTENSIONS = {'csv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 * 1024  # 5GB 제한

# uploads 폴더가 없으면 생성
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Label Mapping 로드
LABEL_MAPPING = {}
try:
    with open('label_Mapping.json', 'r', encoding='utf-8') as f:
        LABEL_MAPPING = json.load(f)
    print("Label mapping loaded successfully.")
except Exception as e:
    print(f"Error loading label mapping: {e}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/files', methods=['GET'])
def list_files():
    try:
        files = []
        upload_dir = app.config['UPLOAD_FOLDER']
        
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                filepath = os.path.join(upload_dir, filename)
                if os.path.isfile(filepath) and allowed_file(filename):
                    # Get file info
                    file_stat = os.stat(filepath)
                    files.append({
                        'filename': filename,
                        'filepath': filepath,
                        'size': file_stat.st_size,
                        'modified': file_stat.st_mtime
                    })
        
        # Sort by modified time (newest first)
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({'files': files})
    except Exception as e:
        print(f"Error listing files: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # 파일 저장
            file.save(filepath)
            
            # CSV 헤더 읽기 (컬럼 목록만)
            df_sample = pd.read_csv(filepath, nrows=5)
            columns = df_sample.columns.tolist()
            
            # 전체 행 수 계산 (메모리 효율적)
            row_count = sum(1 for _ in open(filepath)) - 1  # 헤더 제외
            
            return jsonify({
                "success": True,
                "filename": filename,
                "columns": columns,
                "rowCount": row_count,
                "filepath": filepath
            })
        
        return jsonify({"error": "File type not allowed"}), 400
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/file_info', methods=['POST'])
def get_file_info():
    try:
        req_data = request.json
        filepath = req_data.get('filepath')
        
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found"}), 404
        
        # Read CSV header
        df_sample = pd.read_csv(filepath, nrows=5)
        columns = df_sample.columns.tolist()
        
        # Get row count
        row_count = sum(1 for _ in open(filepath, encoding='utf-8', errors='ignore')) - 1
        
        filename = os.path.basename(filepath)
        
        return jsonify({
            "success": True,
            "filename": filename,
            "columns": columns,
            "rowCount": row_count,
            "filepath": filepath
        })
        
    except Exception as e:
        print(f"File info error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    try:
        req_data = request.json
        feature_filepath = req_data.get('featureFilepath')
        label_filepath = req_data.get('labelFilepath')
        selected_features = req_data.get('selectedFeatures')
        train_ratio = float(req_data.get('trainRatio', 80))
        selected_model = req_data.get('selectedModel')
        learning_rate = float(req_data.get('learningRate', 0.1))

        print(f"Training {selected_model} with files: {feature_filepath}, {label_filepath}")
        
        # 서버에 저장된 CSV 파일 읽기
        if not os.path.exists(feature_filepath):
            return jsonify({"error": "Feature file not found on server"}), 404
        if not os.path.exists(label_filepath):
            return jsonify({"error": "Label file not found on server"}), 404
        
        # Feature 파일 읽기 (선택된 컬럼만)
        df_features = pd.read_csv(feature_filepath, usecols=selected_features)
        
        # Label 파일 읽기 (첫 번째 컬럼만, 헤더 스킵)
        df_labels = pd.read_csv(label_filepath, header=0)
        y = df_labels.iloc[:, 0]  # 첫 번째 컬럼
        
        print(f"Loaded data - Features: {df_features.shape}, Labels: {y.shape}")
        
        # X, y 준비
        X = df_features
        
        # 결측치 처리
        X = X.fillna(0)
        
        # 수치형 변환
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
        
        # 레이블 인코딩
        if y.dtype == 'object':
            y = y.astype('category').cat.codes
        
        # Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, train_size=train_ratio/100, random_state=42
        )
        
        print(f"Train: {len(X_train)}, Test: {len(X_test)}")

        model = None
        feature_importance = {}

        start_time = time.time()

        if selected_model == "Random Forest":
            model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
            model.fit(X_train, y_train)
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_importance = dict(zip(selected_features, importances * 100))

        elif selected_model == "Decision Tree":
            model = DecisionTreeClassifier(random_state=42)
            model.fit(X_train, y_train)
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_importance = dict(zip(selected_features, importances * 100))

        elif selected_model == "XGBoost":
            model = XGBClassifier(
                n_estimators=100, 
                learning_rate=learning_rate, 
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss',
                n_jobs=-1
            )
            model.fit(X_train, y_train)
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                # Convert numpy float32 to Python float for JSON serialization
                feature_importance = {feat: float(imp * 100) for feat, imp in zip(selected_features, importances)}

        elif selected_model == "KNN":
            model = KNeighborsClassifier(n_neighbors=5, n_jobs=-1)
            model.fit(X_train, y_train)
            feature_importance = {}

        else:
            return jsonify({"error": "Unknown model selected"}), 400

        end_time = time.time()
        training_time = end_time - start_time
        print(f"Training completed in {training_time:.2f}s")

        # Evaluation
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred) * 100
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0) * 100
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0) * 100
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0) * 100

        # Classification Report (상세 리포트)
        report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        
        # 데이터셋 타입 추론 및 매핑 적용
        filename_lower = os.path.basename(feature_filepath).lower()
        dataset_type = None
        
        if 'unsw' in filename_lower:
            dataset_type = 'unsw_nb15'
        elif 'cicids' in filename_lower or 'cic' in filename_lower:
            dataset_type = 'cicids2017'
        elif 'iscx' in filename_lower or 'vpn' in filename_lower:
            dataset_type = 'iscx_vpn'
            
        print(f"Detected dataset type: {dataset_type} from filename: {filename_lower}")

        mapped_report = {}
        if dataset_type and dataset_type in LABEL_MAPPING:
            mapping = LABEL_MAPPING[dataset_type]
            print(f"Applying mapping for {dataset_type}")
            
            for key, value in report_dict.items():
                # 키를 문자열로 변환하여 매핑 확인 (JSON 키는 항상 문자열)
                str_key = str(key)
                if str_key in mapping:
                    mapped_key = mapping[str_key]
                    mapped_report[mapped_key] = value
                else:
                    mapped_report[key] = value
        else:
            mapped_report = report_dict

        result = {
            "completed": True,
            "model": selected_model,
            "learningRate": learning_rate,
            "selectedFeatures": selected_features,
            "trainRatio": train_ratio,
            "featureImportance": feature_importance,
            "accuracy": accuracy,
            "completedAt": datetime.datetime.now().isoformat(),
            "metrics": {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1": f1
            },
            "classificationReport": mapped_report,
            "datasetType": dataset_type
        }

        return jsonify(result)

    except Exception as e:
        print(f"Error during training: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
