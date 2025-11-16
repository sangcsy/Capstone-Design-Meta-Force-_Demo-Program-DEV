import React from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./pages/mainPage";
import Step1 from "./pages/step1";
import Step2 from "./pages/step2";
import Step3 from "./pages/step3";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/step1" element={<Step1 />} />
          <Route path="/step2" element={<Step2 />} />
          <Route path="/step3" element={<Step3 />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}