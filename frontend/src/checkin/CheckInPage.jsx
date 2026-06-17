import { useState, useEffect } from "react";
import api from "../api/axios";
import QRScanner from "./QRScanner";
import { useNavigate } from "react-router-dom";

const STATUS = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", ERROR: "error" };

export default function CheckInPage() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [pointageType, setPointageType] = useState("entree");
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  useEffect(() => { getLocation(); }, []);

  const getLocation = () => {
    setGettingLocation(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Géolocalisation non supportée.");
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
      },
      () => {
        setLocationError("Accès refusé. Activez la géolocalisation.");
        setGettingLocation(false);
      }
    );
  };

  const handleQRScan = async (qrCode) => {
    setShowScanner(false);
    if (!location) {
      setStatus(STATUS.ERROR);
      setErrorMsg("Position GPS non disponible.");
      return;
    }
    setStatus(STATUS.LOADING);
    try {
      const res = await api.post("/pointage", {
        userId,
        type: pointageType,
        latitude: location.lat,
        longitude: location.lng,
        qrCode,
      });
      setStatus(STATUS.SUCCESS);
      setResult(res.data);
    } catch (err) {
      setStatus(STATUS.ERROR);
      setErrorMsg(err.response?.data?.message || "Erreur lors du pointage.");
    }
  };

  const reset = () => {
    setStatus(STATUS.IDLE);
    setResult(null);
    setErrorMsg("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Présence
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>
            Pointage
          </h1>
        </div>

        {/* SUCCESS — Bonjour nom */}
        {status === STATUS.SUCCESS && result && (
          <div style={{
            background: "var(--color-background-primary)",
            borderRadius: "var(--border-radius-lg)",
            border: result.valide ? "2px solid #1D9E75" : "2px solid #E24B4A",
            padding: "2rem", textAlign: "center", marginBottom: "1rem"
          }}>
            <div style={{ fontSize: 56, marginBottom: "1rem" }}>
              {result.valide ? "✅" : "❌"}
            </div>

            {result.valide ? (
              <>
                <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  Bonjour {result.nom} !
                </h2>
                <p style={{ margin: "0 0 1.5rem", fontSize: 15, color: "#0F6E56", fontWeight: 500 }}>
                  {pointageType === "entree" ? "Entrée" : "Sortie"} enregistrée à {result.heure}
                </p>
              </>
            ) : (
              <>
                <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 500, color: "#A32D2D" }}>
                  Pointage refusé
                </h2>
                <p style={{ margin: "0 0 1.5rem", fontSize: 14, color: "var(--color-text-secondary)" }}>
                  {!result.qrValide && "QR Code invalide. "}
                  {!result.gpsValide && "Vous n'êtes pas dans la zone autorisée."}
                </p>
              </>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: "1.5rem" }}>
              <span style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 500,
                background: result.qrValide ? "#9FE1CB" : "#F5C4B3",
                color: result.qrValide ? "#04342C" : "#4A1B0C"
              }}>
                QR Code {result.qrValide ? "✓" : "✗"}
              </span>
              <span style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 500,
                background: result.gpsValide ? "#9FE1CB" : "#F5C4B3",
                color: result.gpsValide ? "#04342C" : "#4A1B0C"
              }}>
                GPS {result.gpsValide ? "✓" : "✗"}
              </span>
            </div>

            <button onClick={reset} style={{
              padding: "10px 24px",
              background: result.valide ? "#1D9E75" : "var(--color-background-secondary)",
              color: result.valide ? "white" : "var(--color-text-primary)",
              border: "none", borderRadius: "var(--border-radius-md)",
              fontSize: 14, fontWeight: 500, cursor: "pointer"
            }}>
              Nouveau pointage
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === STATUS.ERROR && (
          <div style={{
            background: "#FCEBEB", border: "0.5px solid #F09595",
            borderRadius: "var(--border-radius-lg)", padding: "1.5rem",
            textAlign: "center", marginBottom: "1rem"
          }}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>❌</p>
            <p style={{ margin: "0 0 12px", fontWeight: 500, color: "#501313" }}>{errorMsg}</p>
            <button onClick={reset} style={{
              padding: "8px 20px", background: "#A32D2D", color: "white",
              border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: 13
            }}>
              Réessayer
            </button>
          </div>
        )}

        {/* IDLE */}
        {status === STATUS.IDLE && (
          <>
            <div style={{
              background: "var(--color-background-primary)",
              borderRadius: "var(--border-radius-lg)",
              border: "0.5px solid var(--color-border-tertiary)",
              padding: "1.25rem", marginBottom: "1rem"
            }}>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Type de pointage
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {["entree", "sortie"].map((t) => (
                  <button key={t} onClick={() => setPointageType(t)} style={{
                    flex: 1, padding: "10px",
                    borderRadius: "var(--border-radius-md)",
                    border: pointageType === t ? "2px solid #1D9E75" : "0.5px solid var(--color-border-tertiary)",
                    background: pointageType === t ? "#E1F5EE" : "var(--color-background-secondary)",
                    color: pointageType === t ? "#0F6E56" : "var(--color-text-secondary)",
                    fontWeight: pointageType === t ? 500 : 400,
                    fontSize: 14, cursor: "pointer"
                  }}>
                    {t === "entree" ? "🟢 Entrée" : "🔴 Sortie"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: "var(--color-background-primary)",
              borderRadius: "var(--border-radius-lg)",
              border: "0.5px solid var(--color-border-tertiary)",
              padding: "1rem 1.25rem", marginBottom: "1rem",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: location ? "#E1F5EE" : locationError ? "#FCEBEB" : "#F1EFE8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
                }}>
                  {gettingLocation ? "⏳" : location ? "📍" : "❌"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 13, color: "var(--color-text-primary)" }}>
                    Géolocalisation
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: location ? "#0F6E56" : locationError ? "#993C1D" : "var(--color-text-secondary)" }}>
                    {gettingLocation ? "Localisation en cours..."
                      : location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                      : locationError || "Non disponible"}
                  </p>
                </div>
              </div>
              {!location && !gettingLocation && (
                <button onClick={getLocation} style={{ fontSize: 12, padding: "6px 12px", borderRadius: "var(--border-radius-md)" }}>
                  Réessayer
                </button>
              )}
            </div>

            <button
              onClick={() => setShowScanner(true)}
              disabled={!location || gettingLocation}
              style={{
                width: "100%", padding: "16px",
                background: location ? "#1D9E75" : "var(--color-background-secondary)",
                color: location ? "white" : "var(--color-text-secondary)",
                border: "none", borderRadius: "var(--border-radius-lg)",
                fontSize: 16, fontWeight: 500,
                cursor: location ? "pointer" : "not-allowed",
                marginBottom: "1rem"
              }}
            >
              {gettingLocation ? "⏳ Localisation..." : location ? "📷 Scanner le QR Code" : "📍 GPS requis"}
            </button>
          </>
        )}

        {/* LOADING */}
        {status === STATUS.LOADING && (
          <div style={{
            background: "var(--color-background-primary)",
            borderRadius: "var(--border-radius-lg)",
            border: "0.5px solid var(--color-border-tertiary)",
            padding: "3rem", textAlign: "center", marginBottom: "1rem"
          }}>
            <p style={{ fontSize: 28, margin: "0 0 12px" }}>⏳</p>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
              Vérification en cours...
            </p>
          </div>
        )}

        {status !== STATUS.LOADING && (
          <button onClick={() => navigate("/history")} style={{
            width: "100%", padding: "12px",
            background: "transparent",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
            fontSize: 14, color: "var(--color-text-secondary)", cursor: "pointer"
          }}>
            Voir mon historique →
          </button>
        )}
      </div>

      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
}