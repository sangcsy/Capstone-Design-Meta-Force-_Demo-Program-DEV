import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MODELS = ["Random Forest", "Decision Tree", "XGBoost", "KNN"];

export default function Step2() {
  const navigate = useNavigate();
  const location = useLocation();
  const logEndRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [learningRate, setLearningRate] = useState("0.1");
  const [logs, setLogs] = useState(["Ready to train..."]);
  const [isTraining, setIsTraining] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step1Data, setStep1Data] = useState(null);
  const [step1Completed, setStep1Completed] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer;
    if (isTraining) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTraining]);

  useEffect(() => {
    if (location.state && location.state.completed) {
      console.log("Loaded data from location.state");
      setStep1Data(location.state);
      setStep1Completed(true);
      return;
    }

    const savedData = localStorage.getItem("step1Data");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.completed) {
          console.log("Loaded data from localStorage");
          setStep1Data(parsed);
          setStep1Completed(true);
        }
      } catch (e) {
        console.error("Failed to parse step1Data", e);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  function addLog(message) {
    setLogs((prev) => [...prev, message]);
  }

  function handleStartTraining() {
    if (isTraining || !step1Data || !step1Data.featureFilepath || !step1Data.labelFilepath) return;

    setIsTraining(true);
    setIsCompleted(false);
    setProgress(0);
    setElapsedTime(0);
    setLogs(["Ready to train...", `[INFO] Model: ${selectedModel}`, "[INFO] Sending request to Python backend..."]);

    fetch('http://localhost:5000/train', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        featureFilepath: step1Data.featureFilepath,
        labelFilepath: step1Data.labelFilepath,
        selectedFeatures: step1Data.selectedFeatures,
        trainRatio: step1Data.trainRatio,
        selectedModel: selectedModel,
        learningRate: learningRate
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        addLog(`[INFO] Training completed successfully.`);
        addLog(`[INFO] Accuracy: ${data.accuracy.toFixed(2)}%`);

        setIsTraining(false);
        setIsCompleted(true);
        setProgress(100);
        localStorage.setItem("step2Data", JSON.stringify(data));
        alert("학습 완료!");
      })
      .catch(error => {
        console.error('Error:', error);
        addLog(`[ERROR] ${error.message}`);
        addLog(`[TIP] 파이썬 서버가 실행 중인지 확인해 주세요 (python backend/app.py)`);
        setIsTraining(false);
      });
  }

  function handleComplete() {
    if (isCompleted) {
      navigate("/step3");
    }
  }

  if (!step1Completed) {
    return (
      <div className="container">
        <h2>2단계: 모델 학습</h2>
        <div style={{
          padding: "40px",
          textAlign: "center",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginTop: "24px"
        }}>
          <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "16px" }}>
            Step1을 먼저 완료해주세요.
          </p>
          <button
            onClick={() => navigate("/step1")}
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
            Step1으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>2단계: 모델 학습</h2>

      {step1Data && (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            padding: "20px",
            marginTop: "20px",
            marginBottom: "20px",
            border: "1px solid #e5e7eb",
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "12px" }}>
            Step1 설정 요약
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Feature 파일: </span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#06b6d4" }}>
                {step1Data.featureFileName || "N/A"}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Label 파일: </span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#06b6d4" }}>
                {step1Data.labelFileName || "N/A"}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>총 행 수: </span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#06b6d4" }}>
                {step1Data.rowCount?.toLocaleString() || 0}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>선택된 피쳐: </span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#06b6d4" }}>
                {step1Data.selectedFeatures?.length || 0}개
              </span>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Train/Test: </span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#06b6d4" }}>
                {step1Data.trainRatio}% / {100 - (step1Data.trainRatio || 80)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <section
          style={{
            flex: "1 1 320px",
            background: "#fff",
            borderRadius: "18px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
            padding: "24px",
            minHeight: "320px",
          }}
        >
          <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", margin: "0 0 6px" }}>
            Model Setup
          </p>
          <h3 style={{ margin: "0 0 18px", color: "#0f172a" }}>설정 패널</h3>

          <label style={{ display: "block", marginBottom: "16px" }}>
            <span style={{ fontSize: "14px", color: "#475569", display: "block", marginBottom: "6px" }}>모델 선택</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d0d7e3",
                fontSize: "15px",
              }}
            >
              {MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          {selectedModel === "XGBoost" && (
            <label style={{ display: "block", marginBottom: "24px" }}>
              <span style={{ fontSize: "14px", color: "#475569", display: "block", marginBottom: "6px" }}>
                학습률 (Learning Rate)
              </span>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={learningRate}
                onChange={(e) => setLearningRate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #d0d7e3",
                  fontSize: "15px",
                }}
              />
            </label>
          )}

          <button
            onClick={isCompleted ? handleComplete : handleStartTraining}
            disabled={isTraining}
            style={{
              width: "100%",
              background: "#06B6D4",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: isTraining ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: isTraining ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isTraining ? (
              <>
                <span role="status" aria-live="polite">
                  ⏳
                </span>
                학습 중... ({Math.round(progress)}% - {elapsedTime}s)
              </>
            ) : isCompleted ? (
              "학습 완료 (다음 단계로)"
            ) : (
              "학습 시작"
            )}
          </button>
        </section>

        <section
          style={{
            flex: "1 1 320px",
            background: "#0f172a",
            borderRadius: "18px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.2)",
            padding: "24px",
            color: "#10b981",
            minHeight: "320px",
            fontFamily: "Consolas, SFMono-Regular, ui-monospace, Menlo, monospace",
          }}
        >
          <p style={{ margin: "0 0 12px", color: "#38ef7d", letterSpacing: "0.05em" }}>Training Logs</p>
          <div
            style={{
              background: "#050915",
              borderRadius: "12px",
              padding: "16px",
              height: "260px",
              overflowY: "auto",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
          >
            {logs.map((line, idx) => (
              <div key={`${line}-${idx}`} style={{ marginBottom: "6px" }}>
                {line}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </section>
      </div>
    </div>
  );
}