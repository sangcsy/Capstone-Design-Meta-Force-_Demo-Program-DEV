import React, { useEffect, useState } from "react";

const PERFORMANCE_ENDPOINT = "/api/performance";

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

  return (
    <div className="step-panel">
      <div className="panel-header">
        <div>
          <h2>3단계: 성능 분석 & 시각화</h2>
          <p className="panel-description">
            실행된 모델들의 주요 지표를 비교하고, 혼동 행렬과 지표 추이를 시각화합니다.
          </p>
        </div>
      </div>

      {loading && <div className="card muted">결과를 불러오는 중...</div>}
      {error && <div className="card error">{error}</div>}

      {!loading && runs.length === 0 && (
        <div className="card muted">아직 실행된 모델이 없습니다. Step2에서 모델을 학습해보세요.</div>
      )}

      {runs.length > 0 && (
        <>
          <div className="card">
            <h4>최근 실행 기록</h4>
            <table className="results-table">
              <thead>
                <tr>
                  <th>실행 시각</th>
                  <th>모델</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, idx) => (
                  <tr key={`${run.ranAt}-${idx}`}>
                    <td>{run.ranAt}</td>
                    <td>{run.modelType}</td>
                    <td>{run.metrics.accuracy}</td>
                    <td>{run.metrics.precision}</td>
                    <td>{run.metrics.recall}</td>
                    <td>{run.metrics.f1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card chart-card">
            <h4>정확도 추이</h4>
            <div className="chart-bars">
              {runs.slice(0, 5).map((run, idx) => (
                <div key={idx} className="chart-bar">
                  <span className="bar-label">{run.modelType}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.round(run.metrics.accuracy * 100)}%` }}
                    />
                  </div>
                  <span className="bar-value">{Math.round(run.metrics.accuracy * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4>혼동 행렬</h4>
            <div className="matrix-grid">
              {["tp", "fp", "fn", "tn"].map((key) => (
                <div key={key} className="matrix-cell">
                  <p className="stat-label">{key.toUpperCase()}</p>
                  <p className="stat-value">{runs[0].confusionMatrix[key]}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
