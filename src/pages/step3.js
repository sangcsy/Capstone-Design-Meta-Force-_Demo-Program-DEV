import React, { useEffect, useMemo, useState } from "react";

const PERFORMANCE_ENDPOINT = "/api/performance";
const METRICS = ["accuracy", "precision", "recall", "f1"];

export default function Step3({ refreshKey = 0 }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRuns() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(PERFORMANCE_ENDPOINT);
        if (!res.ok) throw new Error("성능 정보를 불러오지 못했습니다.");
        const data = await res.json();
        setRuns(data.runs || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRuns();
  }, [refreshKey]);

  const compareRuns = useMemo(() => runs.slice(0, 4), [runs]);

  return (
    <div className="step-panel">
      <div className="panel-header">
        <div>
          <h2>3단계: 성능 분석 & 시각화</h2>
          <p className="panel-description">
            최대 4개의 최근 실험을 저장해 Accuracy/Precision/Recall/F1과 혼동 행렬을 나란히 비교합니다.
          </p>
        </div>
      </div>

      {loading && <div className="card muted">결과를 불러오는 중...</div>}
      {error && <div className="card error">{error}</div>}

      {!loading && runs.length === 0 && (
        <div className="card muted">아직 실행된 모델이 없습니다. Step2에서 모델을 한 번 실행해보세요.</div>
      )}

      {compareRuns.length > 0 && (
        <>
          <div className="card">
            <h4>지표 비교 (최근 {compareRuns.length}개)</h4>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {compareRuns.map((run, idx) => (
                    <th key={idx}>
                      <div className="comparison-header">
                        <span>{run.dataset?.name || "Dataset"}</span>
                        <small>{run.modelType}</small>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((metric) => (
                  <tr key={metric}>
                    <td>{metric.toUpperCase()}</td>
                    {compareRuns.map((run, idx) => (
                      <td key={`${metric}-${idx}`}>{run.metrics?.[metric] ?? "-"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card chart-card">
            <h4>정확도 시각화</h4>
            <div className="chart-bars">
              {compareRuns.map((run, idx) => (
                <div key={idx} className="chart-bar">
                  <span className="bar-label">{run.modelType}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.round((run.metrics?.accuracy || 0) * 100)}%` }}
                    />
                  </div>
                  <span className="bar-value">
                    {Math.round((run.metrics?.accuracy || 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4>실행 세부 정보</h4>
            <div className="comparison-run-grid">
              {compareRuns.map((run, idx) => (
                <div key={idx} className="run-card">
                  <p className="run-title">{run.modelType}</p>
                  <p className="muted small">{run.ranAt}</p>
                  {run.dataset && (
                    <p className="muted small">
                      {run.dataset.name} · 행 {run.dataset.rowCount} · 열 {run.dataset.columnCount}
                    </p>
                  )}
                  <p className="muted small">
                    특징 {run.selectedFeatures?.length || 0}개 (
                    {formatFeatureList(run.selectedFeatures)})
                  </p>
                </div>
              ))}
            </div>
          </div>

          {compareRuns.some((run) => (run.featureImportance || []).length > 0) && (
            <div className="card">
              <h4>특징 기여도 Top5</h4>
              <div className="importance-grid">
                {compareRuns.map((run, idx) => (
                  <div key={idx} className="importance-card">
                    <p className="run-title">{run.modelType}</p>
                    {(run.featureImportance || []).length === 0 && (
                      <p className="muted small">기여도 정보를 사용할 수 없습니다.</p>
                    )}
                    {(run.featureImportance || []).slice(0, 5).map((item) => (
                      <div key={item.name} className="importance-row">
                        <span className="importance-name">{item.name}</span>
                        <div className="importance-bar">
                          <span
                            className="importance-fill"
                            style={{ width: `${Math.min(item.value * 100, 100)}%` }}
                          />
                        </div>
                        <span className="importance-value">{(item.value * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {compareRuns.some((run) => run.rocCurve) && (
            <div className="card">
              <h4>ROC & AUC 비교</h4>
              <table className="roc-table">
                <thead>
                  <tr>
                    <th>모델</th>
                    <th>AUC</th>
                    <th>ROC 샘플 포인트</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRuns.map((run, idx) => (
                    <tr key={idx}>
                      <td>{run.modelType}</td>
                      <td>{run.rocCurve?.auc ?? "-"}</td>
                      <td className="roc-points">{formatRocPoints(run.rocCurve)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card">
            <h4>혼동 행렬 비교</h4>
            <div className="matrix-grid multi">
              {compareRuns.map((run, idx) => (
                <div key={idx} className="matrix-card">
                  <p className="run-title">{run.modelType}</p>
                  <div className="matrix">
                    {["tp", "fp", "fn", "tn"].map((key) => (
                      <div key={key} className="matrix-cell">
                        <p className="stat-label">{key.toUpperCase()}</p>
                        <p className="stat-value">{run.confusionMatrix?.[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatFeatureList(features) {
  if (!features || features.length === 0) return "미선택";
  const names = features.map((feature) => (typeof feature === "string" ? feature : feature?.name || ""));
  const preview = names.slice(0, 5).join(", ");
  return names.length > 5 ? `${preview} ...` : preview;
}

function formatRocPoints(roc) {
  if (!roc || !Array.isArray(roc.fpr) || !Array.isArray(roc.tpr)) {
    return "데이터 없음";
  }
  const sample = roc.fpr
      .slice(0, 4)
      .map((value, idx) => `${value.toFixed(2)}/${(roc.tpr[idx] || 0).toFixed(2)}`);
  return sample.join(" · ");
}
