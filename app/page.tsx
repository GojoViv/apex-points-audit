"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Card Definitions ─────────────────────────────────────────────────────────
const CARDS = [
  {
    id: "amex_gold",
    name: "Amex Gold",
    issuer: "American Express",
    network: "Amex",
    program: "Membership Rewards",
    color: "#c9a84c",
    earn: { travel: 2, dining: 2, shopping: 1, utilities: 1, others: 1 },
    pointValue: 1.5,
    perUnit: 50,
    annualFee: 4999,
  },
  {
    id: "icici_emirates",
    name: "Emirates Emeralde",
    issuer: "ICICI Bank",
    network: "Visa Signature",
    program: "Emirates Skywards",
    color: "#c8102e",
    earn: { travel: 1.5, dining: 1, shopping: 1, utilities: 0.5, others: 0.5 },
    pointValue: 2.0,
    perUnit: 100,
    annualFee: 12000,
  },
  {
    id: "sbi_etihad",
    name: "Etihad Guest",
    issuer: "SBI Card",
    network: "Visa Signature",
    program: "Etihad Guest Miles",
    color: "#7d2b8b",
    earn: { travel: 3, dining: 1.5, shopping: 1.5, utilities: 1, others: 1 },
    pointValue: 1.5,
    perUnit: 100,
    annualFee: 4999,
  },
  {
    id: "hdfc_diners",
    name: "Diners Club",
    issuer: "HDFC Bank",
    network: "Diners",
    program: "HDFC Reward Points",
    color: "#004a97",
    earn: { travel: 5, dining: 5, shopping: 5, utilities: 5, others: 5 },
    pointValue: 0.7,
    perUnit: 150,
    annualFee: 5000,
  },
  {
    id: "axis_horizon",
    name: "Axis Horizon",
    issuer: "Axis Bank",
    network: "Mastercard World",
    program: "Edge Miles",
    color: "#97144d",
    earn: { travel: 5, dining: 2, shopping: 2, utilities: 1, others: 2 },
    pointValue: 0.6,
    perUnit: 100,
    annualFee: 3000,
  },
  {
    id: "axis_vistara",
    name: "Club Vistara",
    issuer: "Axis Bank",
    network: "Visa",
    program: "Air India Flying Returns",
    color: "#e31e24",
    earn: { travel: 4, dining: 2, shopping: 1, utilities: 1, others: 1 },
    pointValue: 0.7,
    perUnit: 200,
    annualFee: 3000,
  },
  {
    id: "idfc_mayura",
    name: "Mayura",
    issuer: "IDFC FIRST",
    network: "Mastercard World",
    program: "FIRST Rewards",
    color: "#6b3fa0",
    earn: { travel: 10, dining: 6, shopping: 3, utilities: 3, others: 3 },
    pointValue: 0.25,
    perUnit: 100,
    annualFee: 2500,
  },
  {
    id: "hdfc_discover",
    name: "Discover Pulse",
    issuer: "HDFC Bank",
    network: "Discover",
    program: "HDFC Reward Points",
    color: "#ff6600",
    earn: { travel: 5, dining: 5, shopping: 5, utilities: 5, others: 5 },
    pointValue: 0.65,
    perUnit: 150,
    annualFee: 3500,
  },
];

const CATEGORIES = [
  { id: "travel", label: "✈️ Travel", placeholder: "15,000" },
  { id: "dining", label: "🍽️ Dining", placeholder: "8,000" },
  { id: "shopping", label: "🛍️ Shopping", placeholder: "20,000" },
  { id: "utilities", label: "⚡ Utilities", placeholder: "5,000" },
  { id: "others", label: "💳 Others", placeholder: "10,000" },
];

// Simulated Gmail scan results
const GMAIL_PREFILL = {
  travel: "22000",
  dining: "9500",
  shopping: "31000",
  utilities: "6200",
  others: "14000",
};

// Simulated statement scan results
const STATEMENT_PREFILL = {
  travel: "18500",
  dining: "7200",
  shopping: "24000",
  utilities: "5800",
  others: "11000",
};

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function parseAmount(val: string): number {
  return parseFloat(val.replace(/,/g, "") || "0") || 0;
}

function calcEarnRate(card: typeof CARDS[0], cat: string): number {
  return (card.earn[cat as keyof typeof card.earn] / card.perUnit) * card.pointValue;
}

// Fix: baseline = user's PRIMARY card for all spend (not best card)
// This ensures missed value is always meaningful
function calculateResults(selectedIds: string[], spend: Record<string, string>) {
  const spendVals: Record<string, number> = {};
  CATEGORIES.forEach((c) => {
    spendVals[c.id] = parseAmount(spend[c.id]);
  });

  const totalSpend = Object.values(spendVals).reduce((a, b) => a + b, 0);
  if (totalSpend === 0 || selectedIds.length === 0) return null;

  const userCards = CARDS.filter((c) => selectedIds.includes(c.id));
  // Primary card = first selected (user's default card for everything)
  const primaryCard = userCards[0];

  // Current: using primary card for ALL spend
  let currentValue = 0;
  CATEGORIES.forEach((cat) => {
    if (spendVals[cat.id] === 0) return;
    currentValue += spendVals[cat.id] * calcEarnRate(primaryCard, cat.id);
  });

  // Optimal: best card from ALL CARDS (not just user's) per category
  let optimalValue = 0;
  const breakdown: { category: string; card: string; issuer: string; value: number; program: string }[] = [];

  CATEGORIES.forEach((cat) => {
    if (spendVals[cat.id] === 0) return;
    const best = CARDS.reduce(
      (b, card) => {
        const earn = calcEarnRate(card, cat.id);
        return earn > b.earn ? { earn, card } : b;
      },
      { earn: 0, card: null as typeof CARDS[0] | null }
    );
    if (best.card) {
      const val = spendVals[cat.id] * best.earn;
      optimalValue += val;
      breakdown.push({
        category: cat.label,
        card: best.card.name,
        issuer: best.card.issuer,
        value: val,
        program: best.card.program,
      });
    }
  });

  const missedValue = Math.max(0, optimalValue - currentValue);

  return {
    current: currentValue,
    optimal: optimalValue,
    missedValue,
    potentialAnnual: optimalValue * 12,
    currentAnnual: currentValue * 12,
    breakdown,
    totalSpend,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [spend, setSpend] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ReturnType<typeof calculateResults>>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [gmailScanning, setGmailScanning] = useState(false);
  const [gmailDone, setGmailDone] = useState(false);
  const [uploadScanning, setUploadScanning] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [displayMissed, setDisplayMissed] = useState(0);
  const [displayOptimal, setDisplayOptimal] = useState(0);
  const prevMissed = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Recalculate on any change
  useEffect(() => {
    const r = calculateResults(selectedCards, spend);
    setResults(r);
  }, [selectedCards, spend]);

  // Animate number changes
  useEffect(() => {
    if (!results) {
      setDisplayMissed(0);
      setDisplayOptimal(0);
      prevMissed.current = 0;
      return;
    }
    const target = results.missedValue;
    const optTarget = results.potentialAnnual;
    const duration = 600;
    const steps = 30;
    let step = 0;
    const startMissed = prevMissed.current;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayMissed(Math.round(startMissed + (target - startMissed) * eased));
      setDisplayOptimal(Math.round(optTarget * eased));
      if (step >= steps) {
        clearInterval(timer);
        prevMissed.current = target;
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [results?.missedValue]);

  const toggleCard = useCallback((id: string) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const handleGmailScan = async () => {
    setGmailScanning(true);
    await new Promise((r) => setTimeout(r, 2200));
    setSpend(GMAIL_PREFILL);
    // Auto-select the top cards too
    setSelectedCards(["amex_gold", "hdfc_diners", "axis_horizon", "icici_emirates"]);
    setGmailScanning(false);
    setGmailDone(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadScanning(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSpend(STATEMENT_PREFILL);
    setUploadScanning(false);
    setUploadDone(true);
  };

  const handleSignup = async () => {
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    setShareToken(token);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cards: selectedCards.map((id) => CARDS.find((c) => c.id === id)?.name).join(", "),
          monthlySpend: Object.values(spend).map(parseAmount).reduce((a, b) => a + b, 0),
          missedValue: results?.missedValue || 0,
          potentialAnnual: results?.potentialAnnual || 0,
          shareToken: token,
          source: typeof document !== "undefined" && document.referrer?.includes("apex") ? "Shared Link" : "Direct",
        }),
      });
    } catch (_) {}
    setSubmitting(false);
    setSubmitted(true);
  };

  const hasSpend = Object.values(spend).some((v) => parseAmount(v) > 0);
  const hasCards = selectedCards.length > 0;
  const showResults = hasCards && hasSpend && results;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?ref=${shareToken}` : "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ textAlign: "center", paddingBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>
              ◆ APEX
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 10, color: "var(--text)" }}>
            How much are your points<br />
            <span className="shimmer">really worth?</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
            Most cardholders leave ₹15,000–60,000 in rewards on the table every year. Find out exactly where yours are going.
          </p>
        </div>

        {/* ── Quick Scan Buttons ───────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          <button
            onClick={handleGmailScan}
            disabled={gmailScanning || gmailDone}
            style={{
              background: gmailDone ? "rgba(34,197,94,0.1)" : "var(--bg-card)",
              border: `1px solid ${gmailDone ? "var(--success)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "14px 16px",
              cursor: gmailScanning || gmailDone ? "default" : "pointer",
              color: gmailDone ? "var(--success)" : "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 18 }}>{gmailDone ? "✓" : gmailScanning ? "⏳" : "📧"}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {gmailDone ? "Gmail scanned" : gmailScanning ? "Scanning..." : "Scan Gmail"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginTop: 1 }}>
                {gmailDone ? "Spend auto-filled" : "Auto-detect transactions"}
              </div>
            </div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadScanning || uploadDone}
            style={{
              background: uploadDone ? "rgba(34,197,94,0.1)" : "var(--bg-card)",
              border: `1px solid ${uploadDone ? "var(--success)" : "var(--border)"}`,
              borderRadius: 12,
              padding: "14px 16px",
              cursor: uploadScanning || uploadDone ? "default" : "pointer",
              color: uploadDone ? "var(--success)" : "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 18 }}>{uploadDone ? "✓" : uploadScanning ? "⏳" : "📸"}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {uploadDone ? "Statement read" : uploadScanning ? "Reading..." : "Upload Statement"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400, marginTop: 1 }}>
                {uploadDone ? "Spend auto-filled" : "Bank or card statement"}
              </div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>

        <div className="divider" style={{ marginBottom: 28 }} />

        {/* ── Your Cards ──────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Your Cards
            </div>
            {hasCards && (
              <div style={{ fontSize: 12, color: "var(--indigo-light)" }}>
                {selectedCards.length} selected
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CARDS.map((card) => {
              const sel = selectedCards.includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  style={{
                    background: sel ? "rgba(99,102,241,0.1)" : "var(--bg-input)",
                    border: `1px solid ${sel ? "var(--indigo)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: sel ? card.color : "var(--border)",
                      flexShrink: 0,
                      transition: "background 0.2s",
                      boxShadow: sel ? `0 0 6px ${card.color}` : "none",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                      {card.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
                      {card.issuer}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!hasCards && (
            <p style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", marginTop: 12 }}>
              Select the cards you hold to begin
            </p>
          )}
        </div>

        <div className="divider" style={{ marginBottom: 28 }} />

        {/* ── Monthly Spend ────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>
            Monthly Spend
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.id}
                style={i === 4 ? { gridColumn: "1 / -1" } : {}}
              >
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 5, fontWeight: 500 }}>
                  {cat.label}
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-muted)", fontSize: 14, pointerEvents: "none",
                  }}>₹</span>
                  <input
                    className="input"
                    style={{ paddingLeft: 24, fontSize: 14 }}
                    type="number"
                    placeholder={cat.placeholder}
                    value={spend[cat.id] || ""}
                    onChange={(e) => setSpend((p) => ({ ...p, [cat.id]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Results (always visible once cards + spend entered) ── */}
        {showResults && (
          <>
            <div className="divider" style={{ marginBottom: 28 }} />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>
                Your Points Report
              </div>

              {/* Big missed value */}
              <div
                className="card pulse-glow"
                style={{ padding: "32px 24px", textAlign: "center", marginBottom: 12, position: "relative", overflow: "hidden" }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "var(--text-muted)", marginBottom: 10,
                }}>
                  Left on the table every month
                </div>
                <div className="shimmer" style={{ fontSize: "clamp(52px, 12vw, 76px)", fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>
                  {formatINR(displayMissed)}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  in unclaimed travel rewards
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ background: "var(--bg)", padding: "14px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      You earn today
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
                      {formatINR(results.current)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>/mo</div>
                  </div>
                  <div style={{ background: "var(--bg)", padding: "14px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      With APEX
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--success)" }}>
                      {formatINR(results.optimal)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>/mo</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
                  Annual uplift:{" "}
                  <strong style={{ color: "var(--gold-light)" }}>
                    {formatINR(displayOptimal - results.currentAnnual)}
                  </strong>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="card" style={{ padding: "16px 20px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                  Best card by category
                </div>
                {results.breakdown.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < results.breakdown.length - 1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{b.category}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                        {b.card} · {b.issuer}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold-light)" }}>
                      {formatINR(b.value)}/mo
                    </div>
                  </div>
                ))}
              </div>

              {/* Email capture */}
              {!submitted ? (
                <div className="card" style={{ padding: "22px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                    🔒 Get your full APEX report
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                    Personalised card recommendations + optimal spend strategy delivered to your inbox.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                      style={{ flex: 1, fontSize: 14 }}
                    />
                    <button
                      className="btn-gold"
                      style={{ width: "auto", padding: "12px 20px", flexShrink: 0, whiteSpace: "nowrap" }}
                      disabled={submitting || !email.includes("@")}
                      onClick={handleSignup}
                    >
                      {submitting ? "..." : "Join →"}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8, textAlign: "center" }}>
                    No spam. Early access only.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Success state */}
                  <div className="card pulse-glow" style={{ padding: "28px 20px", textAlign: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🖤</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>You&apos;re in.</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                      Your APEX report is on its way to{" "}
                      <strong style={{ color: "var(--text)" }}>{email}</strong>
                    </div>
                  </div>

                  {/* Share */}
                  <div className="card" style={{ padding: "20px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                      📲 Share & move up the waitlist
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6 }}>
                      Every friend who joins via your link moves you closer to early access.
                    </div>
                    <div style={{
                      background: "var(--bg-input)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "10px 12px", fontSize: 12,
                      color: "var(--text-muted)", marginBottom: 10, wordBreak: "break-all",
                      fontFamily: "monospace",
                    }}>
                      {shareUrl || "Generating link..."}
                    </div>
                    <button
                      className="btn-primary"
                      style={{ marginBottom: 8 }}
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `I just found out I'm missing ${formatINR(results?.missedValue || 0)} in travel rewards every month 🤯\n\nSee how much YOU'RE missing: ${shareUrl}`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? "✓ Copied!" : "Copy Share Link"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `I just found out I'm missing ${formatINR(results?.missedValue || 0)} in travel rewards every month 🤯\n\nSee how much YOU'RE missing: ${shareUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block", textAlign: "center", padding: "13px",
                        background: "#25D366", borderRadius: 10, color: "white",
                        fontWeight: 700, fontSize: 14, textDecoration: "none",
                      }}
                    >
                      Share on WhatsApp 📲
                    </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Placeholder when nothing entered yet */}
        {!showResults && (
          <div style={{
            textAlign: "center", padding: "40px 20px",
            color: "var(--text-dim)", fontSize: 13, lineHeight: 1.8,
          }}>
            Select your cards and enter your monthly spend<br />
            to see your points audit live ↑
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, fontSize: 11, color: "var(--text-dim)" }}>
          APEX — The Global Traveller &nbsp;·&nbsp; Built by Metastart
        </div>
      </div>
    </div>
  );
}
