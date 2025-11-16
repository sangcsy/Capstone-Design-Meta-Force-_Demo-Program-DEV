import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <h3 className="brand"><Link to="/">Demo Program</Link></h3>
        <nav className="nav">
          <Link to="/step1">Step1</Link>
          <Link to="/step2">Step2</Link>
          <Link to="/step3">Step3</Link>
        </nav>
      </div>
    </header>
  );
}