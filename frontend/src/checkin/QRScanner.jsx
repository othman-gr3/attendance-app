import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
      },
      () => {}
    ).then(() => setScanning(true))
     .catch(() => setError("Impossible d'accéder à la caméra. Vérifiez les permissions."));

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem"
    }}>
      <div style={{
        background: "var(--color-background-primary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.5rem",
        width: "100%",
        maxWidth: 360,
        boxSizing: "border-box"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, color: "var(--color-text-primary)" }}>
              Scanner le QR Code
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
              Pointez la caméra vers le QR code
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: "50%",
              border: "0.5px solid var(--color-border-tertiary)",
              background: "var(--color-background-secondary)",
              cursor: "pointer",
              fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            ✕
          </button>
        </div>

        {/* Scanner viewport */}
        <div style={{
          borderRadius: "var(--border-radius-md)",
          overflow: "hidden",
          border: "0.5px solid var(--color-border-tertiary)",
          background: "#000",
          position: "relative"
        }}>
          <div id="qr-reader" style={{ width: "100%" }} />

          {/* Corner markers overlay */}
          {scanning && (
            <div style={{
              position: "absolute", inset: 0,
              pointerEvents: "none",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{ width: 220, height: 220, position: "relative" }}>
                {["topLeft", "topRight", "bottomLeft", "bottomRight"].map((corner) => (
                  <div key={corner} style={{
                    position: "absolute",
                    width: 24, height: 24,
                    borderColor: "#1D9E75",
                    borderStyle: "solid",
                    borderWidth: 0,
                    ...(corner === "topLeft" && { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: "4px 0 0 0" }),
                    ...(corner === "topRight" && { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderRadius: "0 4px 0 0" }),
                    ...(corner === "bottomLeft" && { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: "0 0 0 4px" }),
                    ...(corner === "bottomRight" && { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: "0 0 4px 0" }),
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "1rem",
            padding: "10px 14px",
            background: "#FCEBEB",
            border: "0.5px solid #F09595",
            borderRadius: "var(--border-radius-md)",
            fontSize: 13,
            color: "#501313"
          }}>
            ❌ {error}
          </div>
        )}

        {/* Status */}
        {!error && (
          <p style={{
            textAlign: "center",
            fontSize: 12,
            color: "var(--color-text-secondary)",
            margin: "12px 0 0"
          }}>
            {scanning ? "🔍 Recherche en cours..." : "⏳ Démarrage de la caméra..."}
          </p>
        )}
      </div>
    </div>
  );
}
