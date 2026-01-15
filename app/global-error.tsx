"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111",
          padding: "1rem"
        }}>
          <div style={{
            maxWidth: "400px",
            width: "100%",
            padding: "1.5rem",
            borderRadius: "1rem",
            border: "1px solid #7f1d1d",
            backgroundColor: "#1f1515"
          }}>
            <h2 style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#fca5a5",
              marginBottom: "1rem"
            }}>
              Application Error
            </h2>
            <p style={{
              fontSize: "0.875rem",
              color: "#f87171",
              marginBottom: "0.5rem"
            }}>
              {error.message}
            </p>
            {error.digest && (
              <p style={{
                fontSize: "0.75rem",
                color: "#ef4444",
                marginBottom: "1rem"
              }}>
                Digest: {error.digest}
              </p>
            )}
            <pre style={{
              fontSize: "0.75rem",
              backgroundColor: "#0f0f0f",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              overflow: "auto",
              maxHeight: "10rem",
              marginBottom: "1rem",
              color: "#f87171"
            }}>
              {error.stack}
            </pre>
            <button
              onClick={() => reset()}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                backgroundColor: "#dc2626",
                color: "white",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer"
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
