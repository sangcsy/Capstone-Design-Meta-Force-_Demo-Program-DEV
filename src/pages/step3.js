import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Step3() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState([
    { label: "정확도 (Accuracy)", value: 0, color: "#10b981", highlight: true },
    { label: "정밀도 (Precision)", value: 0, color: "#3b82f6" },
    { label: "재현율 (Recall)", value: 0, color: "#8b5cf6" },
    { label: "F1-Score", value: 0, color: "#f59e0b" },
  ]);
  const [metricValues, setMetricValues] = useState([0, 0, 0, 0]);
  const [barProgress, setBarProgress] = useState(0);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [step2Data, setStep2Data] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);

  // Step1과 Step2 완료 여부 확인 및 데이터 로드
  useEffect(() => {
    const step1DataStr = localStorage.getItem("step1Data");
    const step2DataStr = localStorage.getItem("step2Data");

    if (step1DataStr) {
      const data = JSON.parse(step1DataStr);
      if (data.completed) {
        setStep1Completed(true);
      } else {
        alert("Step1을 먼저 완료해주세요.");
        navigate("/step1");
        return;
      }
    } else {
      alert("Step1을 먼저 완료해주세요.");
      navigate("/step1");
      return;
    }

    if (step2DataStr) {
      const data = JSON.parse(step2DataStr);
      if (data.completed) {
        setStep2Completed(true);
        setStep2Data(data);

        // 메트릭 업데이트
        const newMetrics = [
          { label: "정확도 (Accuracy)", value: data.metrics?.accuracy || data.accuracy || 0, color: "#10b981", highlight: true },
          { label: "정밀도 (Precision)", value: data.metrics?.precision || 0, color: "#3b82f6" },
          { label: "재현율 (Recall)", value: data.metrics?.recall || 0, color: "#8b5cf6" },
          { label: "F1-Score", value: data.metrics?.f1 || 0, color: "#f59e0b" },
        ];
        setMetrics(newMetrics);

        // 피쳐 중요도 데이터 변환
        if (data.featureImportance) {
          const importanceArray = Object.entries(data.featureImportance)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // 중요도 높은 순으로 정렬
          setFeatureImportance(importanceArray);
        } else {
          setFeatureImportance([]); // KNN 등 중요도 없는 경우
        }
      } else {
        alert("Step2를 먼저 완료해주세요.");
        navigate("/step2");
        return;
      }
    } else {
      alert("Step2를 먼저 완료해주세요.");
      navigate("/step2");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (!step1Completed || !step2Completed || !step2Data) return;

    const duration = 1500;
    const interval = 30;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const ratio = Math.min(currentStep / steps, 1);

      // 메트릭 값 애니메이션
      setMetricValues(
        metrics.map((metric) => parseFloat((metric.value * ratio).toFixed(1)))
      );

      setBarProgress(ratio);
      if (ratio === 1) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [step1Completed, step2Completed, step2Data, metrics]);

  function handleDownload() {
    if (!step2Data) return;

    const csvContent = [
      "Metric,Value,Model,Date",
      `Accuracy,${step2Data.accuracy || 0},${step2Data.model},${new Date().toISOString()}`,
      `Precision,${step2Data.metrics?.precision || 0},${step2Data.model},${new Date().toISOString()}`,
      `Recall,${step2Data.metrics?.recall || 0},${step2Data.model},${new Date().toISOString()}`,
      `F1-Score,${step2Data.metrics?.f1 || 0},${step2Data.model},${new Date().toISOString()}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Analysis_Report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!step1Completed || !step2Completed) {
    return (
      <div className="container">
        <h2>3단계: 성능 비교/시각화</h2>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginTop: "24px"
        }}>
          <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "16px" }}>
            {!step1Completed ? "Step1을 먼저 완료해주세요." : "Step2를 먼저 완료해주세요."}
          </p>
          <button
            onClick={() => navigate(!step1Completed ? "/step1" : "/step2")}
            style={{
              background: "#06b6d4",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {!step1Completed ? "Step1으로 이동" : "Step2로 이동"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>3단계: 성능 비교/시각화</h2>

      {/* Score Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginTop: "24px" }}>
        {metrics.map((metric, idx) => {
          const animated = metricValues[idx] ?? 0;
          return (
            <div
              key={metric.label}
              style={{
                background: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: metric.highlight ? "2px solid #10b981" : "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "12px" }}>
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: metric.color,
                  lineHeight: "1.2",
                }}
              >
                {`${animated.toFixed(1)}%`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px" }}>
        {/* Feature Importance */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: "0", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>
            특징 중요도 (Feature Importance)
          </h3>
          {featureImportance.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {featureImportance.map((item) => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", color: "#374151" }}>{item.name}</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#06b6d4" }}>
                      {item.value.toFixed(2)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "24px",
                      background: "#e5e7eb",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${barProgress * item.value}%`,
                        background: "linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)",
                        borderRadius: "12px",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "#6b7280"
            }}>
              <p>이 모델({step2Data?.model})은 피쳐 중요도를 제공하지 않습니다.</p>
            </div>
          )}
        </div>

        {/* Model Info / Comparison Placeholder */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: "0", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>
            모델 정보
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
              <span style={{ display: "block", fontSize: "12px", color: "#6b7280" }}>사용된 모델</span>
              <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151" }}>{step2Data?.model}</span>
            </div>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
              <span style={{ display: "block", fontSize: "12px", color: "#6b7280" }}>학습 데이터 비율</span>
              <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151" }}>
                Train {step2Data?.trainRatio}% / Test {100 - (step2Data?.trainRatio || 80)}%
              </span>
            </div>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "12px" }}>
              <span style={{ display: "block", fontSize: "12px", color: "#6b7280" }}>학습 완료 시간</span>
              <span style={{ fontSize: "16px", fontWeight: "600", color: "#374151" }}>
                {step2Data?.completedAt ? new Date(step2Data.completedAt).toLocaleString() : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Classification Report Table */}
      {step2Data?.classificationReport && (
        <div style={{ marginTop: "32px", background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h3 style={{ marginTop: "0", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>
            상세 탐지 리포트 (Detailed Detection Report)
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "12px", textAlign: "left", color: "#4b5563" }}>공격 유형 (Class)</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#4b5563" }}>정밀도 (Precision)</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#4b5563" }}>재현율 (Recall)</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#4b5563" }}>F1-Score</th>
                  <th style={{ padding: "12px", textAlign: "right", color: "#4b5563" }}>데이터 수 (Support)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(step2Data.classificationReport)
                  .filter(([key]) => !['accuracy', 'macro avg', 'weighted avg'].includes(key))
                  .map(([key, metrics]) => (
                    <tr key={key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#1f2937" }}>{key}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#374151" }}>{(metrics.precision * 100).toFixed(2)}%</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#374151" }}>{(metrics.recall * 100).toFixed(2)}%</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#374151" }}>{(metrics['f1-score'] * 100).toFixed(2)}%</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#6b7280" }}>{metrics.support}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Download Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
        <button
          onClick={handleDownload}
          style={{
            background: "#06b6d4",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "12px 24px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(6,182,212,0.3)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#0891b2";
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 4px 12px rgba(6,182,212,0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#06b6d4";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 6px rgba(6,182,212,0.3)";
          }}
        >
          상세 분석 리포트 다운로드 (.CSV)
        </button>
      </div>
    </div>
  );
}
