import React from "react";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "1단계: 특징 선택/추출",
      desc: "데이터셋(CSV)을 업로드하고 학습에 필요한 특징(Feature)을 선택합니다.",
      path: "/step1",
      icon: "📊",
      color: "from-cyan-400 to-blue-500"
    },
    {
      id: 2,
      title: "2단계: 모델 학습",
      desc: "Random Forest, XGBoost 등 다양한 모델을 사용하여 학습을 진행합니다.",
      path: "/step2",
      icon: "🧠",
      color: "from-violet-400 to-purple-500"
    },
    {
      id: 3,
      title: "3단계: 성능 비교/시각화",
      desc: "학습된 모델의 정확도, 정밀도 등을 시각적으로 분석하고 리포트를 확인합니다.",
      path: "/step3",
      icon: "📈",
      color: "from-amber-400 to-orange-500"
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: "800",
          marginBottom: "16px",
          background: "linear-gradient(to right, #22d3ee, #818cf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.02em"
        }}>
          AI Encrypted Traffic Analysis
        </h1>
        <p style={{
          fontSize: "18px",
          color: "#94a3b8",
          maxWidth: "600px",
          margin: "0 auto",
          lineHeight: "1.6"
        }}>
          머신러닝 기반의 암호화 트래픽 및 악성 행위 탐지 플랫폼입니다.<br />
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        width: "100%",
        maxWidth: "1200px"
      }}>
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => navigate(step.path)}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "32px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }}
          >
            <div style={{
              fontSize: "40px",
              marginBottom: "20px",
              background: "rgba(255,255,255,0.1)",
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {step.icon}
            </div>
            <h3 style={{
              fontSize: "24px",
              fontWeight: "700",
              marginBottom: "12px",
              color: "#f1f5f9"
            }}>
              {step.title}
            </h3>
            <p style={{
              fontSize: "15px",
              color: "#94a3b8",
              lineHeight: "1.5"
            }}>
              {step.desc}
            </p>
            <div style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              color: "#38bdf8",
              fontWeight: "600",
              fontSize: "14px"
            }}>
              시작하기 <span style={{ marginLeft: "8px" }}>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}