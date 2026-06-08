"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (err) {
      console.error("Login failed:", err);
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "stretch",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflowY: "auto",
      }}
    >
      {/* ── LEFT PANEL: Bento grid ── */}
      <div
        style={{
          width: "55%",
          minHeight: "100vh",
          position: "relative",
          display: "none",
          flexDirection: "column",
          padding: "32px",
          backgroundImage: "url('/bento-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="md-left-panel"
      >
        {/* 3×3 bento grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr 1fr",
            gap: "12px",
            width: "100%",
            height: "100%",
            flex: 1,
          }}
        >
          {/* Cell 1 — top-left transparent */}
          <div style={{ borderRadius: "20px", background: "rgba(0,0,0,0.25)" }} />

          {/* Cell 2 — top-center: Purple card with tagline */}
          <div
            style={{
              borderRadius: "20px",
              background: "#c084fc",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* dot grid overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
                borderRadius: "20px",
              }}
            />
            <h3
              style={{
                position: "relative",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: 1.25,
                color: "#1a0a2e",
                margin: 0,
              }}
            >
              Channel
              <br />
              Intelligence.
            </h3>
          </div>

          {/* Cell 3 — top-right transparent */}
          <div style={{ borderRadius: "20px", background: "rgba(0,0,0,0.2)" }} />

          {/* Cell 4 — mid-left: Purple logo card */}
          <div
            style={{
              borderRadius: "20px",
              background: "#a855f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                background: "rgba(0,0,0,0.25)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="rgba(0,0,0,0.8)" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Cell 5 — mid-center: Yellow card with text */}
          <div
            style={{
              borderRadius: "20px",
              background: "#e9e8a0",
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "20px", color: "#333", fontWeight: 400, lineHeight: 1 }}>+</span>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#2a2a0a", lineHeight: 1.4 }}>
              AI-powered
              <br />
              reply drafts
            </p>
          </div>

          {/* Cell 6 — mid-right transparent */}
          <div style={{ borderRadius: "20px", background: "rgba(0,0,0,0.2)" }} />

          {/* Cell 7 — bottom-left: Yellow card */}
          <div
            style={{
              borderRadius: "20px",
              background: "#e9e8a0",
              padding: "20px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "20px", color: "#555", fontWeight: 400, lineHeight: 1 }}>+</span>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "#2a2a0a", lineHeight: 1.4 }}>
              Own
              <br />
              your growth
            </p>
          </div>

          {/* Cell 8 — bottom-center: dark transparent */}
          <div style={{ borderRadius: "20px", background: "rgba(15,10,30,0.55)" }} />

          {/* Cell 9 — bottom-right transparent */}
          <div style={{ borderRadius: "20px", background: "rgba(0,0,0,0.2)" }} />
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth form ── */}
      <div
        className="auth-panel"
        style={{
          flex: 1,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
        }}
      >
        <div
          className="auth-card animate-fade-in"
          style={{ width: "100%", maxWidth: "340px" }}
        >
          {/* Logo Brand Mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "#ffffff",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <img
                src="/logo.png"
                alt="Clarity Logo"
                style={{ width: "36px", height: "36px", objectFit: "cover" }}
              />
            </div>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.5px",
              }}
            >
              Clarity
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "42px",
              fontWeight: 300,
              color: "#ffffff",
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            Sign In
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.38)",
              margin: "0 0 36px 0",
              lineHeight: 1.6,
            }}
          >
            Connect your YouTube channel to access
            <br />
            AI-powered analytics and insights.
          </p>

          {/* Google sign-in button (primary action) */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="transition-all duration-200 hover:scale-[1.015] active:scale-[0.975] disabled:opacity-75 disabled:cursor-not-allowed"
            style={{
              width: "100%",
              height: "50px",
              background: "#ffffff",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              opacity: isLoggingIn ? 0.75 : 1,
              marginBottom: "20px",
              letterSpacing: "0.01em",
            }}
          >
            {isLoggingIn ? (
              <Loader2 style={{ width: "16px", height: "16px" }} className="animate-spin" />
            ) : (
              <svg style={{ width: "18px", height: "18px", flexShrink: 0 }} viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.8 0 3.2.6 4.1 1.4l3.1-3.1C17.3 1.6 14.9 1 12 1 7.3 1 3.4 3.7 1.5 7.7l3.7 2.9c.9-2.7 3.4-4.6 6.8-4.6z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                <path fill="#FBBC05" d="M5.2 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.5 7.4C.5 9.3 0 11.6 0 14s.5 4.7 1.5 6.6l3.7-2.8z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.2 1.2-3.4 0-5.9-1.9-6.8-4.6l-3.7 2.9C3.4 20.3 7.3 23 12 23z" />
              </svg>
            )}
            {isLoggingIn ? "Connecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>Or</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          </div>

          {/* YouTube sign-in (secondary) */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="transition-all duration-200 hover:scale-[1.015] hover:bg-[rgba(255,255,255,0.07)] active:scale-[0.975] disabled:opacity-75 disabled:cursor-not-allowed"
            style={{
              width: "100%",
              height: "46px",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              opacity: isLoggingIn ? 0.75 : 1,
              letterSpacing: "0.01em",
            }}
          >
            <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
            </svg>
            Sign in with YouTube
          </button>

          {/* Footer */}
          <p
            style={{
              marginTop: "36px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.2)",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            By signing in you agree to our{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer", textUnderlineOffset: "3px" }}>
              Terms
            </span>{" "}
            &amp;{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer", textUnderlineOffset: "3px" }}>
              Privacy Policy
            </span>
            .
          </p>
        </div>
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 767px) {
          .auth-panel {
            background-image: 
              radial-gradient(circle at top right, rgba(168, 85, 247, 0.08), transparent 50%),
              radial-gradient(circle at bottom left, rgba(233, 232, 160, 0.04), transparent 50%),
              url('/bento-bg.png') !important;
            background-size: cover !important;
            background-position: center !important;
            padding: 24px 16px !important;
          }
          .auth-card {
            background: rgba(10, 10, 10, 0.72) !important;
            backdrop-filter: blur(20px) saturate(140%) !important;
            -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            border-radius: 24px !important;
            padding: 32px 24px !important;
            box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5) !important;
            width: 100% !important;
            max-width: 360px !important;
          }
        }
        @media (min-width: 768px) {
          .md-left-panel {
            display: flex !important;
          }
          .auth-card {
            background: transparent !important;
            backdrop-filter: none !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
