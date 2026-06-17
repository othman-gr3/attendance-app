import { useState, useEffect } from "react";
import api from "../api/axios";

const today = new Date().toISOString().split("T")[0];

function Badge({ valide }) {
  return (
    <span style={{
      fontSize: 11,
      padding: "2px 10px",
      borderRadius: 20,
      fontWeight: 500,
      background: valide ? "#9FE1CB" : "#F5C4B3",
      color: valide ? "#04342C" : "#4A1B0C"
    }}>
      {valide ? "Validé" : "Invalide"}
    </span>
  );
}

function TypeBadge({ type }) {
  const isEntree = type === "entree";
  return (
    <span style={{
      fontSize: 11,
      padding: "2px 10px",
      borderRadius: 20,
      background: isEntree ? "#E1F5EE" : "#FAECE7",
      color: isEntree ? "#0F6E56" : "#993C1D",
      fontWeight: 500
    }}>
      {isEntree ? "Entrée" : "Sortie"}
    </span>
  );
}

export default function AttendanceHistory() {
  const [pointages, setPointages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(today);

  const userId = localStorage.getItem("userId");

  const fetchPointages = async (selectedDate) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/pointage?userId=${userId}&date=${selectedDate}`);
      setPointages(res.data);
    } catch {
      setError("Impossible de charger les pointages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPointages(date);
  }, [date]);

  // Compute daily summary
  const entrees = pointages.filter((p) => p.type === "entree");
  const sorties = pointages.filter((p) => p.type === "sortie");
  const premEntree = entrees[0]?.heure || "--";
  const dernSortie = sorties[sorties.length - 1]?.heure || "--";

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Mes pointages
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>
            Historique
          </h1>
        </div>

        {/* Date picker */}
        <div style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          padding: "1.25rem",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Date</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            style={{
              flex: 1,
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-tertiary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)"
            }}
          />
        </div>

        {/* Summary cards */}
        {pointages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: "1rem" }}>
            {[
              { label: "1ère entrée", value: premEntree },
              { label: "Dernière sortie", value: dernSortie },
              { label: "Total pointages", value: pointages.length }
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "var(--color-background-secondary)",
                borderRadius: "var(--border-radius-md)",
                padding: "12px",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-lg)",
          border: "0.5px solid var(--color-border-tertiary)",
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <p style={{ fontSize: 14 }}>⏳ Chargement...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ color: "#A32D2D", fontSize: 14 }}>❌ {error}</p>
              <button onClick={() => fetchPointages(date)} style={{ marginTop: 8, fontSize: 13 }}>
                Réessayer
              </button>
            </div>
          ) : pointages.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
                Aucun pointage ce jour
              </p>
              <p style={{ fontSize: 13, margin: 0 }}>Sélectionnez une autre date ou effectuez un check-in.</p>
            </div>
          ) : (
            pointages.map((p, i) => (
              <div
                key={p._id || i}
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: i < pointages.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                {/* Time */}
                <div style={{
                  minWidth: 52, height: 52,
                  borderRadius: "var(--border-radius-md)",
                  background: p.type === "entree" ? "#E1F5EE" : "#FAECE7",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: p.type === "entree" ? "#0F6E56" : "#993C1D" }}>
                    {p.heure || "--"}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <TypeBadge type={p.type} />
                    <Badge valide={p.valide} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                    📍 {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
