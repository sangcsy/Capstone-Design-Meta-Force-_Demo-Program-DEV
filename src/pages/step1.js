import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Step1() {
  const navigate = useNavigate();
  const [featureFile, setFeatureFile] = useState(null);
  const [labelFile, setLabelFile] = useState(null);
  const [featureColumns, setFeatureColumns] = useState([]);
  const [labelRowCount, setLabelRowCount] = useState(0);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [trainRatio, setTrainRatio] = useState(80);
  const [isUploadingFeature, setIsUploadingFeature] = useState(false);
  const [isUploadingLabel, setIsUploadingLabel] = useState(false);
  const [featureFilepath, setFeatureFilepath] = useState("");
  const [labelFilepath, setLabelFilepath] = useState("");
  const [featureRowCount, setFeatureRowCount] = useState(0);
  const [recentFiles, setRecentFiles] = useState([]);

  // Fetch recent files on mount
  React.useEffect(() => {
    fetch('http://localhost:5000/files')
      .then(res => res.json())
      .then(data => {
        if (data.files) {
          setRecentFiles(data.files);
        }
      })
      .catch(err => console.error('Failed to fetch recent files:', err));
  }, []);

  async function loadExistingFile(filepath, type) {
    try {
      const response = await fetch('http://localhost:5000/file_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath })
      });

      if (!response.ok) {
        throw new Error('Failed to get file info');
      }

      const data = await response.json();

      if (type === 'feature') {
        setFeatureFile({ name: data.filename });
        setFeatureColumns(data.columns);
        setFeatureFilepath(data.filepath);
        setFeatureRowCount(data.rowCount);
        setSelectedFeatures([]);
      } else if (type === 'label') {
        setLabelFile({ name: data.filename });
        setLabelFilepath(data.filepath);
        setLabelRowCount(data.rowCount);
      }

    } catch (error) {
      console.error('Load file error:', error);
      alert('파일 불러오기 실패. 서버를 확인해주세요.');
    }
  }

  async function handleFeatureFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setFeatureFile(null);
      setFeatureColumns([]);
      setSelectedFeatures([]);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("CSV 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploadingFeature(true);
    setFeatureFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setFeatureColumns(data.columns);
      setFeatureFilepath(data.filepath);
      setFeatureRowCount(data.rowCount);
      setIsUploadingFeature(false);

      // Refresh file list
      fetch('http://localhost:5000/files')
        .then(res => res.json())
        .then(data => data.files && setRecentFiles(data.files));

      console.log(`Feature 파일 업로드 완료: ${data.rowCount} 행, ${data.columns.length} 컬럼`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 업로드 실패. Python 서버가 실행 중인지 확인해주세요.');
      setIsUploadingFeature(false);
      setFeatureFile(null);
    }
  }

  async function handleLabelFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setLabelFile(null);
      setLabelRowCount(0);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("CSV 파일만 업로드 가능합니다.");
      return;
    }

    setIsUploadingLabel(true);
    setLabelFile(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setLabelFilepath(data.filepath);
      setLabelRowCount(data.rowCount);
      setIsUploadingLabel(false);

      // Refresh file list
      fetch('http://localhost:5000/files')
        .then(res => res.json())
        .then(data => data.files && setRecentFiles(data.files));

      console.log(`Label 파일 업로드 완료: ${data.rowCount} 행`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('파일 업로드 실패. Python 서버가 실행 중인지 확인해주세요.');
      setIsUploadingLabel(false);
      setLabelFile(null);
    }
  }

  function toggleFeature(feature) {
    setSelectedFeatures((prev) => {
      const newSelection = prev.includes(feature)
        ? prev.filter((item) => item !== feature)
        : [...prev, feature];

      console.log("선택된 특징:", newSelection);
      return newSelection;
    });
  }

  function handleComplete() {
    if (!featureFile || !labelFile) {
      alert("Feature 파일과 Label 파일을 모두 업로드해주세요.");
      return;
    }

    if (selectedFeatures.length === 0) {
      alert("최소 1개 이상의 피쳐를 선택해주세요.");
      return;
    }

    if (featureRowCount !== labelRowCount) {
      alert(`경고: Feature 행 수(${featureRowCount})와 Label 행 수(${labelRowCount})가 다릅니다.`);
      return;
    }

    const step1Data = {
      completed: true,
      featureFileName: featureFile.name,
      labelFileName: labelFile.name,
      featureFilepath: featureFilepath,
      labelFilepath: labelFilepath,
      selectedFeatures: selectedFeatures,
      trainRatio: trainRatio,
      rowCount: featureRowCount
    };

    localStorage.setItem("step1Data", JSON.stringify(step1Data));
    navigate("/step2", { state: step1Data });
  }

  return (
    <div className="container">
      <h2>1단계: 데이터 선택 및 업로드</h2>

      {recentFiles.length > 0 && (
        <section className="upload-section" style={{ marginBottom: "24px" }}>
          <h3>📂 최근 업로드한 파일</h3>
          <p>이전에 업로드한 파일을 다시 사용할 수 있습니다.</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "12px",
            marginTop: "16px"
          }}>
            {recentFiles.slice(0, 6).map((file, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#06b6d4"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
              >
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", marginBottom: "8px" }}>
                  {file.filename}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => loadExistingFile(file.filepath, 'feature')}
                    style={{
                      flex: 1,
                      padding: "6px",
                      background: "#06b6d4",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    Feature로 사용
                  </button>
                  <button
                    onClick={() => loadExistingFile(file.filepath, 'label')}
                    style={{
                      flex: 1,
                      padding: "6px",
                      background: "#8b5cf6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    Label로 사용
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="upload-section">
        <h3>Feature CSV 파일 업로드</h3>
        <p>학습에 사용할 특성(Feature)들이 포함된 CSV 파일을 업로드하세요.</p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFeatureFileChange}
          disabled={isUploadingFeature}
          style={{
            padding: "12px",
            border: "2px dashed #06b6d4",
            borderRadius: "10px",
            width: "100%",
            cursor: isUploadingFeature ? "not-allowed" : "pointer",
            marginBottom: "8px"
          }}
        />

        {isUploadingFeature && (
          <div style={{ marginTop: "8px", color: "#06b6d4", fontWeight: "600" }}>
            ⏳ Feature 파일 업로드 중...
          </div>
        )}

        {featureFile && !isUploadingFeature && (
          <div style={{
            marginTop: "8px",
            padding: "12px",
            background: "#f0f9ff",
            borderRadius: "10px",
            border: "1px solid #06b6d4"
          }}>
            <p style={{ margin: "0", fontWeight: "600", color: "#0891b2", fontSize: "14px" }}>
              ✅ {featureFile.name} ({featureRowCount.toLocaleString()}행, {featureColumns.length}컬럼)
            </p>
          </div>
        )}
      </section>

      <section className="upload-section" style={{ marginTop: "24px" }}>
        <h3>Label CSV 파일 업로드</h3>
        <p>정답 레이블(Label)이 포함된 CSV 파일을 업로드하세요 (Feature와 행 수가 같아야 합니다).</p>

        <input
          type="file"
          accept=".csv"
          onChange={handleLabelFileChange}
          disabled={isUploadingLabel}
          style={{
            padding: "12px",
            border: "2px dashed #06b6d4",
            borderRadius: "10px",
            width: "100%",
            cursor: isUploadingLabel ? "not-allowed" : "pointer",
            marginBottom: "8px"
          }}
        />

        {isUploadingLabel && (
          <div style={{ marginTop: "8px", color: "#06b6d4", fontWeight: "600" }}>
            ⏳ Label 파일 업로드 중...
          </div>
        )}

        {labelFile && !isUploadingLabel && (
          <div style={{
            marginTop: "8px",
            padding: "12px",
            background: "#f0f9ff",
            borderRadius: "10px",
            border: "1px solid #06b6d4"
          }}>
            <p style={{ margin: "0", fontWeight: "600", color: "#0891b2", fontSize: "14px" }}>
              ✅ {labelFile.name} ({labelRowCount.toLocaleString()}행)
            </p>
          </div>
        )}
      </section>

      {featureColumns.length > 0 && (
        <>
          <section className="feature-selection" style={{ marginTop: "32px" }}>
            <h3>피쳐 선택</h3>
            <p>학습에 사용할 피쳐들을 선택하세요</p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
              marginTop: "16px"
            }}>
              {featureColumns.map((feature) => (
                <div
                  key={feature}
                  onClick={() => toggleFeature(feature)}
                  style={{
                    padding: "12px 16px",
                    background: selectedFeatures.includes(feature) ? "#06b6d4" : "#f1f5f9",
                    color: selectedFeatures.includes(feature) ? "#fff" : "#475569",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    textAlign: "center",
                    transition: "all 0.2s",
                    border: selectedFeatures.includes(feature) ? "2px solid #0891b2" : "2px solid transparent",
                  }}
                >
                  {feature}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", fontSize: "14px", color: "#64748b" }}>
              선택된 피쳐: {selectedFeatures.length}개
            </div>
          </section>

          <section className="train-test-split" style={{ marginTop: "32px" }}>
            <h3>Train/Test 비율 설정</h3>
            <p>학습 데이터와 테스트 데이터의 비율을 설정하세요</p>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px" }}>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={trainRatio}
                onChange={(e) => setTrainRatio(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#06b6d4", minWidth: "120px" }}>
                {trainRatio}% / {100 - trainRatio}%
              </div>
            </div>

            <div style={{ marginTop: "12px", fontSize: "14px", color: "#64748b" }}>
              Train: {trainRatio}% ({Math.floor(featureRowCount * trainRatio / 100).toLocaleString()}행)
              / Test: {100 - trainRatio}% ({Math.ceil(featureRowCount * (100 - trainRatio) / 100).toLocaleString()}행)
            </div>
          </section>

          <button
            onClick={handleComplete}
            disabled={selectedFeatures.length === 0 || !labelFile}
            style={{
              marginTop: "32px",
              width: "100%",
              padding: "16px",
              fontSize: "18px",
              fontWeight: "700",
              background: selectedFeatures.length > 0 && labelFile ? "#06b6d4" : "#94a3b8",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              cursor: selectedFeatures.length > 0 && labelFile ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            다음 단계로 이동 (Step 2)
          </button>
        </>
      )}
    </div>
  );
}
