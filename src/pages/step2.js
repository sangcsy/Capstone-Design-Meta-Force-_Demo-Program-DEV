import React, { useEffect, useMemo, useState } from "react";

const RUN_ENDPOINT = "/api/run-model";

const MODELS = [
  { value: "random_forest", label: "Random Forest" },
  { value: "xgboost", label: "XGBoost" },
  { value: "lightgbm", label: "LightGBM" },
];

export default function Step2({ datasetInfo = null, selectedFeatures = [], onRunComplete }) {
  const [modelType, setModelType] = useState(MODELS[0].value);
  const [hyperParams, setHyperParams] = useState({
    learningRate: 0.05,
    estimators: 120,
    maxDepth: 6,
  });
  const [targetColumn, setTargetColumn] = useState("label");
  const [statusMessage, setStatusMessage] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const datasetSelected = useMemo(
      () => selectedFeatures.filter((feature) => (feature?.source || "dataset") === "dataset"),
      [selectedFeatures]
  );
  const customSelected = useMemo(
      () => selectedFeatures.filter((feature) => feature?.source === "custom"),
      [selectedFeatures]
  );
  const isReady =
      Boolean(datasetInfo?.datasetId) && Boolean(targetColumn) && selectedFeatures.length > 0;

  useEffect(() => {
    if (datasetInfo?.columns?.length) {
      if (datasetInfo.columns.includes(targetColumn)) {
        return;
      }
      const defaultTarget =
          datasetInfo.columns.find((col) => col.toLowerCase() === "label") ||
          datasetInfo.columns[datasetInfo.columns.length - 1];
      setTargetColumn(defaultTarget);
    } else {
      setTargetColumn("label");
    }
  }, [datasetInfo]);

  function formatFeatureName(feature) {
    if (typeof feature === "string") return feature;
    return feature?.name || "";
  }

  function handleHyperChange(e) {
    const { name, value } = e.target;
    setHyperParams((prev) => ({ ...prev, [name]: Number(value) }));
  }

  async function handleRun() {
    if (!datasetInfo?.datasetId) {
      setError("데이터셋을 먼저 업로드해주세요.");
      return;
    }
    if (selectedFeatures.length === 0) {
      setError("사용할 특징을 1개 이상 선택해주세요.");
      return;
    }
    if (!targetColumn) {
      setError("타깃 컬럼을 선택해주세요.");
      return;
    }
    setIsRunning(true);
    setStatusMessage("모델 추론을 시작했습니다...");
    setError(null);
    try {
      const res = await fetch(RUN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType,
          hyperParams,
          selectedFeatures,
          datasetId: datasetInfo.datasetId,
          targetColumn,
        }),
      });
      let data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "모델 실행 요청에 실패했습니다.");
      }
      setResult(data.result);
      setStatusMessage("추론이 완료되었습니다.");
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
          <h2>2단계: 모델 추론</h2>
          <p className="panel-description">
            추출된 특징을 사전 학습된 모델에 넣어 악성 행위를 분류합니다.
            사용자가 선택한 알고리즘과 타깃 컬럼으로 다양한 시나리오를 시험해 볼 수 있습니다.
          </p>
        </div>
        <div className="panel-actions">
          <button className="primary-btn" onClick={handleRun} disabled={isRunning || !isReady}>
            {isRunning ? "실행 중..." : "추론 실행"}
          </button>
        </div>
      </div>

      {!datasetInfo && (
        <div className="card error">
          데이터셋이 업로드되지 않았습니다. 메인 페이지에서 CSV를 업로드한 뒤 다시 시도하세요.
        </div>
      )}

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

        <div>
          <label className="form-label">타깃 컬럼</label>
          <select
            value={targetColumn || ""}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="form-control"
            disabled={!datasetInfo?.columns?.length}
          >
            {datasetInfo?.columns?.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card dataset-summary">
        <h4>데이터셋 개요</h4>
        {datasetInfo ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">이름</p>
                <p className="stat-value">{datasetInfo.name}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">행</p>
                <p className="stat-value">
                  {typeof datasetInfo.rowCount === "number" ? datasetInfo.rowCount : "알 수 없음"}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-label">열</p>
                <p className="stat-value">{datasetInfo.columns?.length || 0}</p>
              </div>
            </div>
            {datasetInfo.preview?.length > 0 && (
              <div className="preview-scroll">
                <table className="preview-table compact">
                  <thead>
                    <tr>
                      {datasetInfo.columns?.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datasetInfo.preview.map((row, idx) => (
                      <tr key={idx}>
                        {datasetInfo.columns?.map((col) => (
                          <td key={col}>{row[col] ?? ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="muted small">CSV를 업로드하면 데이터 요약이 표시됩니다.</p>
        )}
      </div>

      <div className="card">
        <h4>사용할 특징 ({selectedFeatures.length})</h4>
        {selectedFeatures.length === 0 && (
          <p className="muted small">Step1에서 모델에 투입할 특징을 선택하세요.</p>
        )}
        {selectedFeatures.length > 0 && (
          <>
            {datasetSelected.length > 0 && (
              <>
                <p className="muted small">데이터셋 특징</p>
                <div className="chip-row">
                  {datasetSelected.map((feature) => (
                    <span key={feature.name || feature} className="chip">
                      {formatFeatureName(feature)}
                    </span>
                  ))}
                </div>
              </>
            )}
            {customSelected.length > 0 && (
              <>
                <p className="muted small">커스텀 특징</p>
                <div className="chip-row">
                  {customSelected.map((feature) => (
                    <span key={feature.name || feature} className="chip chip-alt">
                      {formatFeatureName(feature)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
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
          {result.dataset && (
            <p className="muted small">
              데이터셋 {result.dataset.name} · 특징 {result.selectedFeatures?.length || 0}개 사용
            </p>
          )}
          <p className="muted small">실행 시각: {result.ranAt}</p>
        </div>
      )}
    </div>
  );
}
