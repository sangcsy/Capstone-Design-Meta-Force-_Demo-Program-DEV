import React, { useMemo, useState } from "react";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

const TABS = [
  { id: "step1", label: "1단계 특징 선정", description: "데이터 자질 탐색" },
  { id: "step2", label: "2단계 모델 학습", description: "ML 실험 실행" },
  { id: "step3", label: "3단계 성능/시각화", description: "결과 분석" },
];

export default function MainPage() {
  const [fileName, setFileName] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFileName(f ? f.name : null);
  }

  function handleRunComplete() {
    setRefreshKey((prev) => prev + 1);
  }

  const currentTab = useMemo(
      () => TABS.find((tab) => tab.id === activeTab),
      [activeTab]
  );

  return (
    <div className="container">
      <h1 className="title">암호화 트래픽 악성 행위 분석 데모</h1>
      <p className="subtitle">
        업로드한 흐름 데이터에서 특징을 선정하고, 머신러닝 모델을 학습한 뒤 성능을 시각화합니다.
        모든 단계를 하나의 화면에서 빠르게 체험해보세요.
      </p>

      <section className="uploader">
        <label className="file-label">
          CSV 업로드
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </label>
        <div className="file-info">
          {fileName ? `선택된 파일: ${fileName}` : "아직 데이터가 업로드되지 않았습니다."}
        </div>
      </section>

      <section className="tab-section">
        <div className="tab-controls">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.description}</small>
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {currentTab?.id === "step1" && (
            <Step1
              selectedFeatures={selectedFeatures}
              onSelectionChange={setSelectedFeatures}
            />
          )}
          {currentTab?.id === "step2" && (
            <Step2
              selectedFeatures={selectedFeatures}
              onSelectionChange={setSelectedFeatures}
              onRunComplete={handleRunComplete}
            />
          )}
          {currentTab?.id === "step3" && <Step3 refreshKey={refreshKey} />}
        </div>
      </section>
    </div>
  );
}
