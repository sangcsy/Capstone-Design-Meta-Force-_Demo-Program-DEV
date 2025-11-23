import React, { useEffect, useRef, useState } from "react";

const FEATURE_ENDPOINT = "/api/features";
const RUN_ENDPOINT = "/api/run-model";

const MODELS = [
  { value: "random_forest", label: "Random Forest" },
  { value: "xgboost", label: "XGBoost" },
  { value: "lightgbm", label: "LightGBM" },
];

export default function Step2({
  selectedFeatures = [],
  onSelectionChange,
  onRunComplete,
}) {
  const [featurePool, setFeaturePool] = useState([]);
  const [selection, setSelection] = useState(selectedFeatures);
  const [modelType, setModelType] = useState(MODELS[0].value);
  const [hyperParams, setHyperParams] = useState({
    learningRate: 0.05,
    estimators: 120,
    maxDepth: 6,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    async function fetchPool() {
      try {
        const res = await fetch(FEATURE_ENDPOINT);
        const data = await res.json();
        if (cancelled) return;
        setFeaturePool(data.features || []);
        setSelection((prev) => {
          if (prev.length === 0 && data.selected) {
            return data.selected;
          }
          return prev;
        });
      } catch (e) {
        if (!cancelled) {
          console.error(e);
        }
      }
    }
    fetchPool();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelection(selectedFeatures);
  }, [selectedFeatures]);

  function toggleFeature(name) {
    setSelection((prev) => {
      const exists = prev.includes(name);
      const next = exists ? prev.filter((f) => f !== name) : [...prev, name];
      onSelectionChange && onSelectionChange(next);
      return next;
    });
  }

  function handleHyperChange(e) {
    const { name, value } = e.target;
    setHyperParams((prev) => ({ ...prev, [name]: Number(value) }));
  }

  async function handleRun() {
    if (selection.length === 0) {
      setError("특징을 1개 이상 선택해주세요.");
      return;
    }
    setIsRunning(true);
    setStatusMessage("모델 학습을 시작했습니다...");
    setError(null);
    try {
      const res = await fetch(RUN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType,
          hyperParams,
          selectedFeatures: selection,
        }),
      });
      if (!res.ok) throw new Error("모델 학습 요청에 실패했습니다.");
      const data = await res.json();
      setResult(data.result);
      setStatusMessage("학습이 완료되었습니다.");
      onRunComplete && onRunComplete(data.result);
    } catch (e) {
      setError(e.message);
      setStatusMessage("");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="step-panel">
      <div className="panel-header">
        <div>
          <h2>2단계: 머신러닝 학습</h2>
          <p className="panel-description">
            선택한 특징과 알고리즘을 이용해 악성 행위를 분류하는 모델을 학습합니다.
            하이퍼파라미터를 조정하며 여러 조합을 시험해 볼 수 있습니다.
          </p>
        </div>
        <div className="panel-actions">
          <button className="primary-btn" onClick={handleRun} disabled={isRunning}>
            {isRunning ? "실행 중..." : "학습 실행"}
          </button>
        </div>
      </div>

      {error && <div className="card error">{error}</div>}
      {statusMessage && <div className="card muted">{statusMessage}</div>}

      <div className="card form-grid">
        <div>
          <label className="form-label">모델 선택</label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="form-control"
          >
            {MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Learning Rate</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="0.5"
            name="learningRate"
            value={hyperParams.learningRate}
            onChange={handleHyperChange}
            className="form-control"
          />
        </div>

        <div>
          <label className="form-label">Estimators</label>
          <input
            type="number"
            name="estimators"
            min="10"
            max="300"
            value={hyperParams.estimators}
            onChange={handleHyperChange}
            className="form-control"
          />
        </div>

        <div>
          <label className="form-label">Max Depth</label>
          <input
            type="number"
            name="maxDepth"
            min="2"
            max="20"
            value={hyperParams.maxDepth}
            onChange={handleHyperChange}
            className="form-control"
          />
        </div>
      </div>

      <div className="card">
        <h4>사용할 특징 ({selection.length})</h4>
        <div className="chip-row">
          {selection.map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
          {selection.length === 0 && (
            <span className="muted">Step1에서 특징을 선택하세요.</span>
          )}
        </div>
        <div className="feature-pool">
          {featurePool.map((feature) => (
            <label key={feature.name}>
              <input
                type="checkbox"
                checked={selection.includes(feature.name)}
                onChange={() => toggleFeature(feature.name)}
              />
              {feature.name}
            </label>
          ))}
        </div>
      </div>

      {result && (
        <div className="card result-card">
          <h4>{MODELS.find((m) => m.value === result.modelType)?.label || result.modelType}</h4>
          <div className="metrics-grid">
            {Object.entries(result.metrics).map(([key, value]) => (
              <div key={key}>
                <p className="stat-label">{key.toUpperCase()}</p>
                <p className="stat-value">{value}</p>
              </div>
            ))}
          </div>
          <div className="confusion-matrix">
            <div>
              <strong>TP:</strong> {result.confusionMatrix.tp}
            </div>
            <div>
              <strong>FP:</strong> {result.confusionMatrix.fp}
            </div>
            <div>
              <strong>FN:</strong> {result.confusionMatrix.fn}
            </div>
            <div>
              <strong>TN:</strong> {result.confusionMatrix.tn}
            </div>
          </div>
          <p className="muted small">실행 시각: {result.ranAt}</p>
        </div>
      )}
    </div>
  );
}
