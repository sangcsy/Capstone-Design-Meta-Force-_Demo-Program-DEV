import React, { useMemo, useState } from "react";
import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

const TABS = [
  { id: "step1", label: "1단계 특징 선정", description: "데이터 자질 탐색" },
  { id: "step2", label: "2단계 모델 추론", description: "사전 학습 모델 실행" },
  { id: "step3", label: "3단계 성능/시각화", description: "결과 분석" },
];

export default function MainPage() {
  const [fileName, setFileName] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [datasetError, setDatasetError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) {
      setFileName(null);
      setDatasetInfo(null);
      setSelectedFeatures([]);
      return;
    }
    setIsParsing(true);
    setDatasetError(null);
    setUploadProgress(0);
    setFileName(f.name);
    setSelectedFeatures([]);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetchWithProgress("/api/datasets/upload", {
        method: "POST",
        body: formData,
      }, setUploadProgress);
      if (!res.ok) {
        throw new Error("서버로 데이터를 업로드하지 못했습니다.");
      }
      const info = await res.json();
      setDatasetInfo({
        name: info.name || f.name,
        columns: info.columns || [],
        rowCount: info.rowCount ?? null,
        preview: info.preview || [],
        datasetId: info.datasetId,
      });
    } catch (err) {
      console.error(err);
      setDatasetError(err.message || "CSV 업로드 중 오류가 발생했습니다.");
      setDatasetInfo(null);
      setFileName(null);
  } finally {
    setIsParsing(false);
    setUploadProgress(0);
  }
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
        업로드한 흐름 데이터에서 특징을 선정하고, 사전 학습된 모델에 적용해 추론 결과를 비교합니다.
        모든 단계를 하나의 화면에서 빠르게 체험해보세요.
      </p>

      <section className="uploader">
        <div className="uploader-box">
          <p className="uploader-title">데이터셋 CSV를 업로드하세요</p>
          <p className="uploader-hint">
            열 구조만 분석하므로 개인 식별 정보는 포함하지 마세요.
          </p>
         <label className="file-label">
           <span>{isParsing ? "분석 중..." : "파일 선택"}</span>
           <input type="file" accept=".csv" onChange={handleFileChange} disabled={isParsing} />
         </label>
          {isParsing && (
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              <span className="progress-label">{uploadProgress}%</span>
            </div>
          )}
          <div className="file-info">
            {isParsing && "CSV를 분석하는 중입니다..."}
            {!isParsing &&
              (fileName ? `선택된 파일: ${fileName}` : "아직 데이터가 업로드되지 않았습니다.")}
          </div>
          {datasetError && <div className="file-error">{datasetError}</div>}
        </div>
  </section>

      {datasetInfo && (
        <section className="dataset-preview card">
          <div className="dataset-meta">
            <div>
              <p className="stat-label">데이터셋 이름</p>
              <p className="stat-value">{datasetInfo.name}</p>
            </div>
            <div>
              <p className="stat-label">행(Row)</p>
              <p className="stat-value">{datasetInfo.rowCount}</p>
            </div>
            <div>
              <p className="stat-label">열(Column)</p>
              <p className="stat-value">{datasetInfo.columns.length}</p>
            </div>
          </div>
          {datasetInfo.preview?.length > 0 && (
            <table className="preview-table">
              <thead>
                <tr>
                  {datasetInfo.columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datasetInfo.preview.map((row, idx) => (
                  <tr key={idx}>
                    {datasetInfo.columns.map((col) => (
                      <td key={col}>{row[col] ?? ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

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
              datasetInfo={datasetInfo}
              selectedFeatures={selectedFeatures}
              onSelectionChange={setSelectedFeatures}
            />
          )}
          {currentTab?.id === "step2" && (
            <Step2
              datasetInfo={datasetInfo}
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
function fetchWithProgress(url, options, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || "GET", url, true);
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    }
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };
    xhr.onload = () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: () => Promise.resolve(JSON.parse(xhr.responseText || "{}")),
      });
    };
    xhr.onerror = () => reject(new Error("업로드 중 네트워크 오류가 발생했습니다."));
    xhr.send(options.body);
  });
}
