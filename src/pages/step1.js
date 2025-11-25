import React, { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_DATASET_FEATURES = [
  { name: "flow_duration", label: "Flow Duration", description: "플로우 유지 시간" },
  { name: "packet_rate", label: "Packet Rate", description: "초당 패킷 수" },
  { name: "byte_rate", label: "Byte Rate", description: "초당 바이트 수" },
  { name: "src_entropy", label: "Source Entropy", description: "소스 IP 엔트로피" },
  { name: "dst_entropy", label: "Destination Entropy", description: "목적지 IP 엔트로피" },
  { name: "payload_size_mean", label: "Payload Size Mean", description: "평균 페이로드 크기" },
  { name: "ja3_fingerprint", label: "JA3 Fingerprint", description: "TLS 핑거프린트" },
  { name: "tls_cipher", label: "TLS Cipher", description: "암호 스위트" },
];

const CUSTOM_FEATURE_LIBRARY = [
  {
    name: "burstiness_index",
    label: "Burstiness Index",
    formula: "Flow IAT Std / Flow IAT Mean",
    description: "패킷 간 시간 간격의 불균형도.",
  },
  {
    name: "burstiness_ratio",
    label: "Burstiness Ratio",
    formula: "Active Max / (Active Mean + 1e-9)",
    description: "세션 활성 구간의 순간 burst 정도.",
  },
  {
    name: "handshake_symmetry",
    label: "Handshake Symmetry",
    formula: "log1p(Init_Fwd) - log1p(Init_Bwd)",
    description: "초기 윈도우 크기의 대칭성 여부.",
  },
  {
    name: "payload_shape_score",
    label: "Payload Shape Score",
    formula: "(Fwd Std + Bwd Std) / (Mean + 1e-9)",
    description: "양방향 페이로드 길이 변동성.",
  },
];

export default function Step1({ datasetInfo, onSelectionChange, selectedFeatures = [] }) {
  const [datasetSelection, setDatasetSelection] = useState([]);
  const [customSelection, setCustomSelection] = useState([]);
  const [extractionMessage, setExtractionMessage] = useState("");
  const autoSelectRef = useRef(false);

  const datasetColumns = useMemo(() => {
    if (datasetInfo?.columns?.length) {
      return datasetInfo.columns.map((name) => ({
        name,
        label: name,
        description: "업로드된 CSV 열",
      }));
    }
    return DEFAULT_DATASET_FEATURES;
  }, [datasetInfo]);

  useEffect(() => {
    const datasetNames = (selectedFeatures || [])
        .filter((feature) => (feature?.source || "dataset") === "dataset")
        .map((feature) => feature.name);
    const customNames = (selectedFeatures || [])
        .filter((feature) => feature?.source === "custom")
        .map((feature) => feature.name);
    setDatasetSelection(datasetNames);
    setCustomSelection(customNames);
    if (datasetNames.length > 0 || customNames.length > 0) {
      autoSelectRef.current = true;
    }
  }, [selectedFeatures]);

  useEffect(() => {
    autoSelectRef.current = false;
  }, [datasetInfo]);

  useEffect(() => {
    if (
      !autoSelectRef.current &&
      datasetColumns.length > 0 &&
      datasetSelection.length === 0 &&
      customSelection.length === 0
    ) {
      const defaults = datasetColumns.slice(0, Math.min(5, datasetColumns.length)).map((f) => f.name);
      emitSelection(defaults, []);
      autoSelectRef.current = true;
    }
  }, [datasetColumns, datasetSelection.length, customSelection.length]);

  function emitSelection(datasetList, customList) {
    setDatasetSelection(datasetList);
    setCustomSelection(customList);
    const payload = [
      ...datasetList.map((name) => ({ name, source: "dataset" })),
      ...customList.map((name) => ({ name, source: "custom" })),
    ];
    onSelectionChange && onSelectionChange(payload);
  }

  function toggleDatasetFeature(name) {
    setExtractionMessage("");
    setDatasetSelection((prev) => {
      const exists = prev.includes(name);
      const next = exists ? prev.filter((item) => item !== name) : [...prev, name];
      const payload = [
        ...next.map((item) => ({ name: item, source: "dataset" })),
        ...customSelection.map((item) => ({ name: item, source: "custom" })),
      ];
      onSelectionChange && onSelectionChange(payload);
      return next;
    });
  }

  function toggleCustomFeature(name) {
    setExtractionMessage("");
    setCustomSelection((prev) => {
      const exists = prev.includes(name);
      const next = exists ? prev.filter((item) => item !== name) : [...prev, name];
      const payload = [
        ...datasetSelection.map((item) => ({ name: item, source: "dataset" })),
        ...next.map((item) => ({ name: item, source: "custom" })),
      ];
      onSelectionChange && onSelectionChange(payload);
      return next;
    });
  }

  function handleClear() {
    autoSelectRef.current = true;
    emitSelection([], []);
    setExtractionMessage("선택을 초기화했습니다.");
  }

  function handleSelectAllDataset() {
    emitSelection(datasetColumns.map((feature) => feature.name), customSelection);
    setExtractionMessage("");
  }

  function handleExtract() {
    const total = datasetSelection.length + customSelection.length;
    if (total === 0) {
      setExtractionMessage("선택된 특징이 없습니다.");
      return;
    }
    setExtractionMessage(
        `총 ${total}개의 특징을 추출했습니다. (데이터셋 ${datasetSelection.length}, 커스텀 ${customSelection.length})`
    );
  }

  return (
    <div className="step-panel">
      <div className="panel-header">
        <div>
          <h2>1단계: 특징 선택/추출</h2>
          <p className="panel-description">
            업로드한 CSV 열과 커스텀 파생 특징을 조합해 사전 학습 모델에 투입할 입력을 결정합니다.
          </p>
        </div>
        <div className="panel-actions">
          <button className="ghost-btn" onClick={handleSelectAllDataset}>
            데이터셋 전체 선택
          </button>
          <button className="ghost-btn" onClick={handleClear}>
            초기화
          </button>
          <button className="primary-btn" onClick={handleExtract}>
            선택 특징 추출
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">데이터셋 열</p>
          <p className="stat-value">{datasetColumns.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">커스텀 특징</p>
          <p className="stat-value">{CUSTOM_FEATURE_LIBRARY.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">선택된 특징</p>
          <p className="stat-value">{datasetSelection.length + customSelection.length}</p>
        </div>
      </div>

      <div className="feature-section card">
        <h3>데이터셋 특징 ({datasetColumns.length})</h3>
        <p className="muted small">CSV에 포함된 열을 기반으로 선택합니다.</p>
        <div className="feature-list">
          {datasetColumns.map((feature) => (
            <label key={feature.name} className="feature-option">
              <input
                type="checkbox"
                checked={datasetSelection.includes(feature.name)}
                onChange={() => toggleDatasetFeature(feature.name)}
              />
              <div>
                <span className="feature-name">{feature.label}</span>
                <p className="feature-meta">{feature.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="feature-section card">
        <h3>커스텀 특징 라이브러리</h3>
        <p className="muted small">데이터셋에 없는 분석 친화적인 파생 특징을 추가할 수 있습니다.</p>
        <div className="feature-list">
          {CUSTOM_FEATURE_LIBRARY.map((feature) => (
            <label key={feature.name} className="feature-option">
              <input
                type="checkbox"
                checked={customSelection.includes(feature.name)}
                onChange={() => toggleCustomFeature(feature.name)}
              />
              <div>
                <span className="feature-name">{feature.label}</span>
                <p className="feature-meta">{feature.description}</p>
                <p className="feature-formula">{feature.formula}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {extractionMessage && <div className="card muted">{extractionMessage}</div>}
    </div>
  );
}
