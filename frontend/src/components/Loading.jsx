import React from "react";

export default function Loading({ label = "Analyzing project signals" }) {
  return (
    <div className="loading">
      <span />
      <p>{label}</p>
    </div>
  );
}
