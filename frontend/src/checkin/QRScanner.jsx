import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner = null;
    let isMounted = true;

    // Short delay to let previous unmount cycle complete cleanly
    const initTimeout = setTimeout(() => {
      if (!isMounted) return;

      const container = document.getElementById("qr-reader");
      if (container) {
        container.innerHTML = ""; // Clear any leftover duplicate video elements
      }

      try {
        scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (scanner) {
              scanner.stop()
                .then(() => onScan(decodedText))
                .catch(() => onScan(decodedText));
            }
          },
          () => {}
        ).then(() => {
          if (isMounted) setScanning(true);
        }).catch(() => {
          if (isMounted) setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        });
      } catch (e) {
        if (isMounted) setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {});
        } else {
          // If unmounting before start completes, wait slightly and stop
          setTimeout(() => {
            try {
              scanner.stop().catch(() => {});
            } catch (err) {}
          }, 300);
        }
      }
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15, 41, 66, 0.75)",
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        padding: "0",
        width: "100%",
        maxWidth: 400,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: '20px 24px',
          borderBottom: '1px solid #E8EAED',
          background: '#FAFBFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: '#E3F2FD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <QrCodeScannerIcon style={{ fontSize: 22, color: '#1976D2' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a2340' }}>
                Scanner le QR Code
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: '12px', color: '#7A8A99' }}>
                Pointez la caméra vers le QR code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36,
              borderRadius: "10px",
              border: "1px solid #E8EAED",
              background: "#F5F6FA",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#FFEBEE'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#F5F6FA'}
          >
            <CloseIcon style={{ fontSize: 18, color: '#7A8A99' }} />
          </button>
        </div>

        {/* Scanner viewport */}
        <div style={{
          background: "#0D1117",
          position: "relative",
          overflow: 'hidden',
        }}>
          <div id="qr-reader" style={{ width: "100%" }} />

          {/* Corner markers overlay */}
          {scanning && (
            <div style={{
              position: "absolute", inset: 0,
              pointerEvents: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 220, height: 220, position: "relative" }}>
                {["topLeft", "topRight", "bottomLeft", "bottomRight"].map((corner) => (
                  <div key={corner} style={{
                    position: "absolute",
                    width: 28, height: 28,
                    borderColor: "#42A5F5",
                    borderStyle: "solid",
                    borderWidth: 0,
                    ...(corner === "topLeft" && { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderRadius: "6px 0 0 0" }),
                    ...(corner === "topRight" && { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderRadius: "0 6px 0 0" }),
                    ...(corner === "bottomLeft" && { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderRadius: "0 0 0 6px" }),
                    ...(corner === "bottomRight" && { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: "0 0 6px 0" }),
                  }} />
                ))}
                {/* Scan line */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, #42A5F5, transparent)',
                  animation: 'scanLine 2s ease-in-out infinite',
                  top: '50%',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px' }}>
          {error ? (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: "12px 16px",
              background: "#FFEBEE",
              border: "1px solid #FFCDD2",
              borderRadius: "10px",
              fontSize: '13px', color: "#C62828",
            }}>
              <ErrorOutlineIcon style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          ) : (
            <p style={{
              textAlign: "center",
              fontSize: '13px',
              color: '#7A8A99',
              margin: 0,
              fontWeight: 500,
            }}>
              {scanning ? "🔍 Recherche en cours..." : "⏳ Démarrage de la caméra..."}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 5%; opacity: 0.8; }
          50% { top: 95%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
