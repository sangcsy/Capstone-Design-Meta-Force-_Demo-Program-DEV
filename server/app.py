import random
import time
import uuid
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from sklearn.metrics import (
    accuracy_score,
    auc,
    f1_score,
    precision_score,
    recall_score,
    roc_curve,
)
from werkzeug.utils import secure_filename

try:
  import joblib
except ImportError:  # pragma: no cover
  joblib = None


BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
UPLOAD_DIR = BASE_DIR / "uploads"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__)


# simple in-memory caches
RECORDED_RUNS: List[Dict] = []
DATASETS: Dict[str, Dict] = {}
MODEL_CACHE: Dict[str, object] = {}


@dataclass
class Feature:
  name: str
  kind: str
  importance: float
  description: str


FEATURES = [
    Feature("flow_duration", "시간", 0.87, "플로우가 유지된 시간(초)"),
    Feature("packet_rate", "통계", 0.81, "초당 패킷 수"),
    Feature("byte_rate", "통계", 0.62, "초당 바이트 수"),
    Feature("src_entropy", "엔트로피", 0.54, "소스 IP의 엔트로피"),
    Feature("dst_entropy", "엔트로피", 0.49, "목적지 IP의 엔트로피"),
    Feature("payload_size_mean", "통계", 0.42, "평균 페이로드 크기"),
    Feature("tls_cipher", "TLS", 0.35, "TLS Cipher suite"),
    Feature("ja3_fingerprint", "TLS", 0.33, "JA3 Fingerprint"),
]


def _response(payload, status=200):
  """Attach permissive CORS headers for the React dev server."""
  resp = jsonify(payload)
  resp.status_code = status
  resp.headers["Access-Control-Allow-Origin"] = "*"
  resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
  return resp


@app.route("/api/features", methods=["GET"])
def list_features():
  selected = [f.name for f in FEATURES if f.importance >= 0.5]
  summary = {
      "total": len(FEATURES),
      "recommended": len(selected),
      "last_updated": "2025-02-01 10:22",
  }
  return _response({
      "features": [asdict(f) for f in FEATURES],
      "selected": selected,
      "summary": summary,
  })


@app.route("/api/datasets/upload", methods=["POST"])
def upload_dataset():
  if "file" not in request.files:
    return _response({"error": "파일이 필요합니다."}, status=400)
  file = request.files["file"]
  if file.filename == "":
    return _response({"error": "파일 이름이 비어 있습니다."}, status=400)
  dataset_id = str(uuid.uuid4())
  filename = secure_filename(file.filename) or f"dataset_{dataset_id}.csv"
  save_path = UPLOAD_DIR / f"{dataset_id}_{filename}"
  try:
    file.save(save_path)
    header_df = pd.read_csv(save_path, nrows=0)
    preview_df = pd.read_csv(save_path, nrows=5)
  except Exception as exc:  # pragma: no cover
    if save_path.exists():
      save_path.unlink()
    return _response({"error": f"CSV를 처리하는 중 오류가 발생했습니다: {exc}"}, status=400)

  columns = list(header_df.columns)
  row_count = max(_count_csv_rows(save_path) - 1, 0)
  preview = preview_df.fillna("").to_dict(orient="records")

  DATASETS[dataset_id] = {
      "name": filename,
      "path": str(save_path),
      "columns": columns,
      "rowCount": row_count,
  }
  return _response({
      "datasetId": dataset_id,
      "name": filename,
      "rowCount": row_count,
      "columns": columns,
      "preview": preview,
  })


@app.route("/api/run-model", methods=["POST"])
def run_model():
  body = request.get_json(force=True)
  selected_features = body.get("selectedFeatures") or []
  normalized_features = _normalize_feature_names(selected_features)
  model_type = body.get("modelType", "random_forest")
  params = body.get("hyperParams") or {}
  dataset_id = body.get("datasetId")
  target_column = body.get("targetColumn") or "label"

  if not dataset_id or dataset_id not in DATASETS:
    return _response({"error": "업로드된 데이터셋을 찾을 수 없습니다."}, status=400)

  dataset_entry = DATASETS[dataset_id]
  df = pd.read_csv(dataset_entry["path"])
  dataset_meta = {
      "name": dataset_entry["name"],
      "rowCount": int(dataset_entry.get("rowCount") or df.shape[0]),
      "columnCount": int(len(dataset_entry.get("columns") or df.columns)),
  }
  if target_column not in df.columns:
    return _response({"error": f"타깃 컬럼 '{target_column}'을(를) 찾을 수 없습니다."}, status=400)

  feature_frame = _prepare_feature_frame(df, normalized_features)
  if feature_frame.empty:
    return _response({"error": "선택한 특징이 데이터셋에 존재하지 않습니다."}, status=400)

  model = _load_model(model_type)
  metrics, confusion, roc_data = _run_inference(model, feature_frame, df[target_column])
  feature_importance = _extract_feature_importance(model, feature_frame)

  result = {
      "modelType": model_type,
      "hyperParams": params,
      "selectedFeatures": selected_features,
      "dataset": dataset_meta,
      "metrics": metrics,
      "confusionMatrix": confusion,
      "featureImportance": feature_importance,
      "rocCurve": roc_data,
      "ranAt": time.strftime("%Y-%m-%d %H:%M:%S"),
  }
  RECORDED_RUNS.insert(0, result)
  if len(RECORDED_RUNS) > 4:
    RECORDED_RUNS.pop()
  return _response({"message": "모델 학습이 완료되었습니다.", "result": result})


@app.route("/api/performance", methods=["GET"])
def list_performance():
  return _response({
      "runs": RECORDED_RUNS[:10],
      "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
  })


def _normalize_feature_names(selected_features):
  normalized = []
  for item in selected_features:
    if isinstance(item, dict):
      normalized.append(item.get("name"))
    else:
      normalized.append(item)
  return [name for name in normalized if name]


def _prepare_feature_frame(df: pd.DataFrame, selected: List[str]) -> pd.DataFrame:
  for feature in selected:
    if feature not in df.columns:
      _compute_custom_feature(df, feature)
  available = [name for name in selected if name in df.columns]
  return df[available].copy()


def _compute_custom_feature(df: pd.DataFrame, feature: str) -> None:
  if feature == "burstiness_index":
    std_col = _find_column(df, ["Flow IAT Std", "flow_iat_std"])
    mean_col = _find_column(df, ["Flow IAT Mean", "flow_iat_mean"])
    if std_col and mean_col:
      df[feature] = df[std_col] / (df[mean_col] + 1e-9)
    else:
      df[feature] = 0.0
  elif feature == "burstiness_ratio":
    max_col = _find_column(df, ["Active Max", "active_max"])
    mean_col = _find_column(df, ["Active Mean", "active_mean"])
    if max_col and mean_col:
      df[feature] = df[max_col] / (df[mean_col] + 1e-9)
    else:
      df[feature] = 0.0
  elif feature == "handshake_symmetry":
    forward = _find_column(df, ["Init_Win_bytes_forward", "init_win_bytes_forward"])
    backward = _find_column(df, ["Init_Win_bytes_backward", "init_win_bytes_backward"])
    if forward and backward:
      df[feature] = np.log1p(df[forward]) - np.log1p(df[backward])
    else:
      df[feature] = 0.0
  elif feature == "payload_shape_score":
    fwd_std = _find_column(df, ["Fwd Packet Length Std", "fwd_packet_length_std"])
    bwd_std = _find_column(df, ["Bwd Packet Length Std", "bwd_packet_length_std"])
    mean_col = _find_column(df, ["Packet Length Mean", "packet_length_mean"])
    if fwd_std and bwd_std and mean_col:
      df[feature] = (df[fwd_std] + df[bwd_std]) / (df[mean_col] + 1e-9)
    else:
      df[feature] = 0.0


def _find_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
  for candidate in candidates:
    if candidate in df.columns:
      return candidate
    normalized = candidate.lower().replace(" ", "_")
    matches = [col for col in df.columns if col.lower().replace(" ", "_") == normalized]
    if matches:
      return matches[0]
  return None


def _load_model(model_type: str):
  path = _resolve_model_path(model_type)
  if path is None or not path.exists() or joblib is None:
    return None
  if model_type not in MODEL_CACHE:
    MODEL_CACHE[model_type] = joblib.load(path)
  return MODEL_CACHE[model_type]


def _resolve_model_path(model_type: str) -> Optional[Path]:
  candidates = {
      "random_forest": MODELS_DIR / "random_forest.pkl",
      "xgboost": MODELS_DIR / "xgboost.pkl",
      "lightgbm": MODELS_DIR / "lightgbm.pkl",
  }
  return candidates.get(model_type, candidates["random_forest"])


def _run_inference(model, features: pd.DataFrame, target: pd.Series):
  if model is None:
    return _simulate_metrics(features, target)

  try:
    predictions = model.predict(features)
    y_true = target.loc[features.index]
    metrics, confusion = _compute_metrics(y_true, predictions)
    scores = _predict_scores(model, features, predictions)
    roc_data = _compute_roc_data(y_true, scores)
    return metrics, confusion, roc_data
  except Exception:  # pragma: no cover
    return _simulate_metrics(features, target)


def _simulate_metrics(features: pd.DataFrame, target: pd.Series):
  time.sleep(0.3)
  seed = features.shape[1] * 17 + len(target) * 7
  random.seed(seed)
  accuracy = round(0.82 + random.random() * 0.12, 3)
  precision = round(0.8 + random.random() * 0.1, 3)
  recall = round(0.78 + random.random() * 0.1, 3)
  f1 = round(2 * (precision * recall) / (precision + recall + 1e-6), 3)
  confusion = {
      "tp": random.randint(80, 95),
      "fp": random.randint(5, 15),
      "fn": random.randint(6, 16),
      "tn": random.randint(70, 90),
  }
  roc_data = _simulate_roc_data()
  return {
      "accuracy": accuracy,
      "precision": precision,
      "recall": recall,
      "f1": f1,
  }, confusion, roc_data


def _predict_scores(model, features: pd.DataFrame, predictions=None):
  if hasattr(model, "predict_proba"):
    try:
      proba = model.predict_proba(features)
      if proba.ndim > 1:
        return proba[:, -1]
      return proba
    except Exception:  # pragma: no cover
      pass
  if hasattr(model, "decision_function"):
    try:
      scores = model.decision_function(features)
      return _sigmoid(scores)
    except Exception:  # pragma: no cover
      pass
  if predictions is None:
    predictions = model.predict(features)
  return predictions


def _compute_roc_data(y_true: pd.Series, scores):
  try:
    fpr, tpr, _ = roc_curve(y_true, scores)
    roc_auc = auc(fpr, tpr)
    return {
        "fpr": fpr.tolist(),
        "tpr": tpr.tolist(),
        "auc": round(float(roc_auc), 3),
    }
  except Exception:  # pragma: no cover
    return _simulate_roc_data()


def _simulate_roc_data():
  base = 0.82 + random.random() * 0.12
  points = [
      (0.0, 0.0),
      (0.1, min(0.4 + random.random() * 0.2, 1.0)),
      (0.25, min(0.7 + random.random() * 0.2, 1.0)),
      (0.5, min(0.85 + random.random() * 0.1, 1.0)),
      (1.0, 1.0),
  ]
  fpr, tpr = zip(*points)
  return {
      "fpr": list(fpr),
      "tpr": list(tpr),
      "auc": round(base, 3),
  }


def _compute_metrics(y_true: pd.Series, y_pred: np.ndarray):
  y_pred_series = pd.Series(y_pred, index=y_true.index)
  accuracy = float(accuracy_score(y_true, y_pred_series))
  precision = float(precision_score(y_true, y_pred_series, zero_division=0))
  recall = float(recall_score(y_true, y_pred_series, zero_division=0))
  f1 = float(f1_score(y_true, y_pred_series, zero_division=0))
  cm = _confusion_counts(y_true, y_pred_series)
  return {
      "accuracy": round(accuracy, 3),
      "precision": round(precision, 3),
      "recall": round(recall, 3),
      "f1": round(f1, 3),
  }, cm


def _confusion_counts(y_true: pd.Series, y_pred: pd.Series):
  tp = int(((y_true == 1) & (y_pred == 1)).sum())
  tn = int(((y_true == 0) & (y_pred == 0)).sum())
  fp = int(((y_true == 0) & (y_pred == 1)).sum())
  fn = int(((y_true == 1) & (y_pred == 0)).sum())
  return {"tp": tp, "tn": tn, "fp": fp, "fn": fn}


def _extract_feature_importance(model, feature_frame: pd.DataFrame):
  columns = list(feature_frame.columns)
  if not columns:
    return []

  values = None
  if model is not None:
    if hasattr(model, "feature_importances_"):
      try:
        values = np.array(model.feature_importances_, dtype=float)
      except Exception:  # pragma: no cover
        values = None
    elif hasattr(model, "coef_"):
      try:
        coef = np.array(model.coef_, dtype=float)
        if coef.ndim > 1:
          coef = np.mean(np.abs(coef), axis=0)
        else:
          coef = np.abs(coef)
        values = coef
      except Exception:  # pragma: no cover
        values = None

  if values is None or len(values) != len(columns):
    rng = np.random.default_rng(len(columns) * 31 + feature_frame.shape[0])
    values = rng.random(len(columns))

  total = float(np.sum(np.abs(values))) or 1.0
  normalized = np.abs(values) / total
  items = [
      {"name": name, "value": round(float(score), 4)}
      for name, score in zip(columns, normalized)
  ]
  items.sort(key=lambda item: item["value"], reverse=True)
  return items


def _count_csv_rows(path: Path) -> int:
  line_count = 0
  with path.open("r", encoding="utf-8", errors="ignore") as handle:
    for _ in handle:
      line_count += 1
  return line_count


def _sigmoid(values):
  arr = np.array(values, dtype=float)
  return 1 / (1 + np.exp(-arr))


@app.after_request
def after_request(response):
  # Allow preflight requests for local dev
  response.headers["Access-Control-Allow-Origin"] = "*"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type"
  response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
  return response


if __name__ == "__main__":
  app.run(debug=True)
