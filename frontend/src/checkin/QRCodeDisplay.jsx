import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

export default function QRCodeDisplay() {
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(3600);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchQRCode = async () => {
    try {
      const res = await api.get("/pointage/qr");
      setQrData(res.data);
      setTimeLeft(3600);
      setLastRefresh(new Date());
      setError("");
    } catch {
      setError("Impossible de charger le QR Code");
    }
  };

  useEffect(() => {
    fetchQRCode();
    intervalRef.current = setInterval(fetchQRCode, 3600000);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const progress = ((3600 - timeLeft) / 3600) * 100;
  const now = new Date();
  const timeString = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-background-tertiary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      fontFamily: "var(--font-sans)"
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{
          fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--color-text-secondary)", margin: "0 0 6px", fontWeight: 500
        }}>
          Borne de pointage
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)" }}>
          {timeString}
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0, textTransform: "capitalize" }}>
          {dateString}
        </p>
      </div>

      {/* QR Card */}
      <div style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        border: "0.5px solid var(--color-border-tertiary)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        width: "100%",
        maxWidth: 380
      }}>

        {error ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>⚠️</p>
            <p style={{ color: "#A32D2D", fontSize: 14, fontWeight: 500, margin: "0 0 12px" }}>{error}</p>
            <button onClick={fetchQRCode} style={{
              padding: "8px 20px", borderRadius: "var(--border-radius-md)",
              background: "#1D9E75", color: "white", border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 500
            }}>
              Réessayer
            </button>
          </div>
        ) : qrData ? (
          <>
            {/* QR Image */}
            <div style={{
              background: "white",
              padding: 16,
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-tertiary)"
            }}>
              <img
                src={qrData.image}
                alt="QR Code de pointage"
                width={240}
                height={240}
                style={{ display: "block" }}
              />
            </div>

            {/* Instruction */}
            <p style={{
              fontSize: 14, color: "var(--color-text-secondary)",
              textAlign: "center", margin: 0, lineHeight: 1.6
            }}>
              Scannez ce code avec l'application pour enregistrer votre présence
            </p>

            {/* Expiry progress */}
            <div style={{ width: "100%" }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 8
              }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Expire dans
                </span>
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: timeLeft < 300 ? "#A32D2D" : "#0F6E56",
                  fontVariantNumeric: "tabular-nums"
                }}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                height: 4, background: "var(--color-background-secondary)",
                borderRadius: 2, overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: timeLeft < 300 ? "#E24B4A" : "#1D9E75",
                  borderRadius: 2,
                  transition: "width 1s linear, background 0.3s"
                }} />
              </div>
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchQRCode}
              style={{
                width: "100%", padding: "10px",
                borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-secondary)",
                fontSize: 13, cursor: "pointer"
              }}
            >
              🔄 Nouveau code
            </button>
          </>
        ) : (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
            <p style={{ fontSize: 28, margin: "0 0 12px" }}>⏳</p>
            <p style={{ fontSize: 14, margin: 0 }}>Chargement du QR Code...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {lastRefresh && (
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: "1.5rem" }}>
          Dernière mise à jour : {lastRefresh.toLocaleTimeString("fr-FR")}
        </p>
      )}
    </div>
  );
}