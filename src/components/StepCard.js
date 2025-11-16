import React from "react";
import { useNavigate } from "react-router-dom";

export default function StepCard({ title, description, to }) {
  const nav = useNavigate();
  return (
    <div className="step-card" onClick={() => nav(to)}>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="btn">입장</button>
    </div>
  );
}