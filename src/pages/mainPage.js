import React, { useState } from "react";
import StepCard from "../components/StepCard";

export default function MainPage() {
  const [fileName, setFileName] = useState(null);

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFileName(f ? f.name : null);
    // 향후: 파일을 서버로 업로드하거나 클라이언트에서 파싱
  }

  return (
    <div className="container">
      <h1 className="title">데이터 전처리 & 모델링 데모</h1>

      <section className="uploader">
        <label className="file-label">
          CSV 파일 선택
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </label>
        <div className="file-info">
          {fileName ? `선택된 파일: ${fileName}` : "파일이 선택되지 않았습니다."}
        </div>
      </section>

      <section className="steps">
        <StepCard
          title="1단계: 특징 선택/추출"
          description="데이터에서 특징을 선택하거나 추출합니다."
          to="/step1"
        />
        <StepCard
          title="2단계: 모델 학습"
          description="선택된 특징으로 모델을 학습합니다."
          to="/step2"
        />
        <StepCard
          title="3단계: 성능 비교/시각화"
          description="학습된 모델들의 성능을 비교하고 시각화합니다."
          to="/step3"
        />
      </section>
    </div>
  );
}