import random
import time
from dataclasses import dataclass, asdict
from typing import List, Dict

from flask import Flask, jsonify, request


app = Flask(__name__)


# simple in-memory cache so the UI can fetch historical runs
RECORDED_RUNS: List[Dict] = []


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


@app.route("/api/run-model", methods=["POST"])
def run_model():
  body = request.get_json(force=True)
  features = body.get("selectedFeatures") or []
  model_type = body.get("modelType", "random_forest")
  params = body.get("hyperParams") or {}

  # quick simulation of a training job
  time.sleep(0.3)
  seed = len(features) * 17 + len(model_type) * 13
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

  result = {
      "modelType": model_type,
      "hyperParams": params,
      "selectedFeatures": features,
      "metrics": {
          "accuracy": accuracy,
          "precision": precision,
          "recall": recall,
          "f1": f1,
      },
      "confusionMatrix": confusion,
      "ranAt": time.strftime("%Y-%m-%d %H:%M:%S"),
  }
  RECORDED_RUNS.insert(0, result)
  return _response({"message": "모델 학습이 완료되었습니다.", "result": result})


@app.route("/api/performance", methods=["GET"])
def list_performance():
  return _response({
      "runs": RECORDED_RUNS[:10],
      "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
  })


@app.after_request
def after_request(response):
  # Allow preflight requests for local dev
  response.headers["Access-Control-Allow-Origin"] = "*"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type"
  response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
  return response


if __name__ == "__main__":
  app.run(debug=True)
