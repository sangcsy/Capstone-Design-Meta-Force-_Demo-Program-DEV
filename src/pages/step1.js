import React, { useEffect, useMemo, useRef, useState } from "react";

const API_ENDPOINT = "/api/features";

export default function Step1({ onSelectionChange, selectedFeatures }) {
  const [features, setFeatures] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localSelection, setLocalSelection] = useState(selectedFeatures || []);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    let cancelled = false;
    async function fetchFeatures() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) throw new Error("서버에서 특징 정보를 불러오지 못했습니다.");
        const data = await res.json();
        if (cancelled) {
          return;
        }
        setFeatures(data.features || []);
        setSummary(data.summary);
        if (!selectedFeatures || selectedFeatures.length === 0) {
          const recommended = data.selected || [];
          setLocalSelection(recommended);
          onSelectionChange && onSelectionChange(recommended);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchFeatures();
    return () => {
      cancelled = true;
    };
  }, [onSelectionChange, selectedFeatures]);

  useEffect(() => {
    if (Array.isArray(selectedFeatures)) {
      setLocalSelection(selectedFeatures);
    }
  }, [selectedFeatures]);

  function handleToggle(name) {
    setLocalSelection((prev) => {
      const exists = prev.includes(name);
      const updated = exists ? prev.filter((f) => f !== name) : [...prev, name];
      onSelectionChange && onSelectionChange(updated);
      return updated;
    });
  }

  function handleSelectAll() {
    const all = features.map((f) => f.name);
    setLocalSelection(all);
    onSelectionChange && onSelectionChange(all);
  }

  function handleClear() {
    setLocalSelection([]);
    onSelectionChange && onSelectionChange([]);
  }

  function handleRecommend() {
    const recommended = features
        .filter((f) => f.importance >= 0.5)
        .map((f) => f.name);
    setLocalSelection(recommended);
    onSelectionChange && onSelectionChange(recommended);
  }

  const grouped = useMemo(() => {
    return features.reduce((acc, feature) => {
      acc[feature.kind] = acc[feature.kind] || [];
      acc[feature.kind].push(feature);
      return acc;
    }, {});
  }, [features]);

  return (
    <div className="step-panel">
      <div className="panel-header">
        <div>
          <h2>1단계: 특징 선택/추출</h2>
          <p className="panel-description">
            암호화 트래픽에서 악성 여부를 분류하는 데 유용한 특징을 선택합니다.
            추천 세트나 직접 수동으로 선택할 수 있습니다.
          </p>
        </div>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={handleRecommend}>
            추천 선택
          </button>
          <button className="ghost-btn" onClick={handleSelectAll}>
            전체 선택
          </button>
          <button className="ghost-btn" onClick={handleClear}>
            초기화
          </button>
        </div>
      </div>

      {loading && <div className="card muted">특징 정보를 불러오는 중...</div>}
      {error && <div className="card error">{error}</div>}

      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">총 특징 수</p>
            <p className="stat-value">{summary.total}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">추천 특징</p>
            <p className="stat-value">{summary.recommended}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">업데이트</p>
            <p className="stat-value">{summary.last_updated}</p>
          </div>
        </div>
      )}

      <div className="feature-count">
        선택한 특징: <strong>{localSelection.length}</strong>
      </div>

      <div className="feature-groups">
        {Object.keys(grouped).map((kind) => (
          <div key={kind} className="feature-group card">
            <h4>{kind}</h4>
            <ul>
              {grouped[kind].map((feature) => {
                const checked = localSelection.includes(feature.name);
                return (
                  <li key={feature.name}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggle(feature.name)}
                      />
                      <span className="feature-name">{feature.name}</span>
                    </label>
                    <div className="feature-meta">
                      <span>{feature.description}</span>
                      <span className="feature-score">
                        중요도 {Math.round(feature.importance * 100)}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
