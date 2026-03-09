"use client";

import { useState, useEffect } from "react";

// ─── Card Definitions ─────────────────────────────────────────────────────────
const CARDS = [
  {
    id: "amex_gold",
    name: "Amex Gold",
    issuer: "American Express",
    network: "Amex",
    program: "Membership Rewards",
    color: "#c9a84c",
    earn: { travel: 2, dining: 2, shopping: 1, utilities: 1, others: 1 }, // per ₹50
    pointValue: 1.5, // ₹ per point (transfer value)
    perUnit: 50,
  },
  {
    id: "icici_emirates",
    name: "Emirates Skywards Emeralde",
    issuer: "ICICI Bank",
    network: "Visa Signature",
    program: "Emirates Skywards",
    color: "#c8102e",
    earn: { travel: 1.5, dining: 1, shopping: 1, utilities: 0.5, others: 0.5 }, // per ₹100
    pointValue: 2.0,
    perUnit: 100,
  },
  {
    id: "sbi_etihad",
    name: "Etihad Guest",
    issuer: "SBI Card",
    network: "Visa Signature",
    program: "Etihad Guest Miles",
    color: "#7d2b8b",
    earn: { travel: 3, dining: 1.5, shopping: 1.5, utilities: 1, others: 1 }, // per ₹100
    pointValue: 1.5,
    perUnit: 100,
  },
  {
    id: "hdfc_diners",
    name: "Diners Club International",
    issuer: "HDFC Bank",
    network: "Diners",
    program: "HDFC Reward Points",
    color: "#004a97",
    earn: { travel: 5, dining: 5, shopping: 5, utilities: 5, others: 5 }, // per ₹150
    pointValue: 0.7,
    perUnit: 150,
  },
  {
    id: "axis_horizon",
    name: "Horizon",
    issuer: "Axis Bank",
    network: "Mastercard World",
    program: "Edge Miles",
    color: "#97144d",
    earn: { travel: 5, dining: 2, shopping: 2, utilities: 1, others: 2 }, // per ₹100
    pointValue: 0.6,
    perUnit: 100,
  },
  {
    id: "axis_vistara",
    name: "Club Vistara",
    issuer: "Axis Bank",
    network: "Visa",
    program: "Air India Flying Returns",
    color: "#e31e24",
    earn: { travel: 4, dining: 2, shopping: 1, utilities: 1, others: 1 }, // per ₹200
    pointValue: 0.7,
    perUnit: 200,
  },
  {
    id: "idfc_mayura",
    name: "Mayura",
    issuer: "IDFC FIRST Bank",
    network: "Mastercard World",
    program: "FIRST Rewards",
    color: "#6b3fa0",
    earn: { travel: 10, dining: 6, shopping: 3, utilities: 3, others: 3 }, // per ₹100
    pointValue: 0.25,
    perUnit: 100,
  },
  {
    id: "hdfc_discover",
    name: "Discover Pulse",
    issuer: "HDFC Bank",
    network: "Discover",
    program: "HDFC Reward Points",
    color: "#ff6600",
    earn: { travel: 5, dining: 5, shopping: 5, utilities: 5, others: 5 }, // per ₹150
    pointValue: 0.65,
    perUnit: 150,
  },
];

const CATEGORIES = [
  { id: "travel", label: "✈️ Travel & Flights", placeholder: "₹15,000" },
  { id: "dining", label: "🍽️ Dining & Food", placeholder: "₹8,000" },
  { id: "shopping", label: "🛍️ Shopping", placeholder: "₹20,000" },
  { id: "utilities", label: "⚡ Utilities & Bills", placeholder: "₹5,000" },
  { id: "others", label: "💳 Others", placeholder: "₹10,000" },
];

type Step = "cards" | "spend" | "results" | "signup" | "done";

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function generateToken() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState<Step>("cards");
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [spend, setSpend] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    current: number;
    optimal: number;
    missed: number;
    missedValue: number;
    potentialAnnual: number;
    breakdown: { card: string; program: string; value: number }[];
  } | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  // Animate the big number
  useEffect(() => {
    if (step === "results" && results) {
      let start = 0;
      const end = results.missedValue;
      const duration = 1500;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.round(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [step, results]);

  const toggleCard = (id: string) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const calculateResults = () => {
    const spendValues: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      spendValues[c.id] = parseFloat(spend[c.id]?.replace(/,/g, "") || "0") || 0;
    });

    const userCards = CARDS.filter((c) => selectedCards.includes(c.id));

    // What user earns with their current cards (assuming they use their best card per category)
    let currentValue = 0;
    CATEGORIES.forEach((cat) => {
      if (spendValues[cat.id] === 0) return;
      const bestUserCard = userCards.reduce(
        (best, card) => {
          const earn = (card.earn[cat.id as keyof typeof card.earn] / card.perUnit) * card.pointValue;
          return earn > best.earn ? { earn, card } : best;
        },
        { earn: 0, card: null as typeof CARDS[0] | null }
      );
      if (bestUserCard.card) {
        currentValue += spendValues[cat.id] * bestUserCard.earn;
      }
    });

    // What they COULD earn with the optimal card for each category (from all cards)
    let optimalValue = 0;
    const breakdown: { card: string; program: string; value: number }[] = [];

    CATEGORIES.forEach((cat) => {
      if (spendValues[cat.id] === 0) return;
      const best = CARDS.reduce(
        (b, card) => {
          const earn = (card.earn[cat.id as keyof typeof card.earn] / card.perUnit) * card.pointValue;
          return earn > b.earn ? { earn, card } : b;
        },
        { earn: 0, card: null as typeof CARDS[0] | null }
      );
      if (best.card) {
        const val = spendValues[cat.id] * best.earn;
        optimalValue += val;
        breakdown.push({
          card: `${best.card.issuer} ${best.card.name}`,
          program: best.card.program,
          value: val,
        });
      }
    });

    const missed = optimalValue - currentValue;
    const missedValue = Math.max(0, missed);
    const potentialAnnual = optimalValue * 12;

    setResults({
      current: currentValue,
      optimal: optimalValue,
      missed: missedValue,
      missedValue,
      potentialAnnual,
      breakdown,
    });
    setStep("results");
  };

  const handleSignup = async () => {
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    const token = generateToken();
    setShareToken(token);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cards: selectedCards
            .map((id) => CARDS.find((c) => c.id === id)?.name)
            .join(", "),
          monthlySpend: Object.values(spend)
            .map((v) => parseFloat(v.replace(/,/g, "") || "0"))
            .reduce((a, b) => a + b, 0),
          missedValue: results?.missedValue || 0,
          potentialAnnual: results?.potentialAnnual || 0,
          shareToken: token,
          source: document.referrer?.includes("apex") ? "Shared Link" : "Direct",
        }),
      });
    } catch (_) {}
    setSubmitting(false);
    setStep("done");
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?ref=${shareToken}`
      : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `I just found out I'm missing ${formatINR(results?.missedValue || 0)} in travel rewards every month 🤯\n\nCheck how much you're missing: ${shareUrl}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressSteps = { cards: 33, spend: 66, results: 100, signup: 100, done: 100 };
  const progress = progressSteps[step] || 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>
              ◆ APEX
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 12, color: "var(--text)" }}>
            {step === "done"
              ? "You're on the list 🖤"
              : "How much are your points really worth?"}
          </h1>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {step === "cards" && "Select the cards you own. We'll calculate your hidden travel wealth."}
            {step === "spend" && "Enter your average monthly spend by category."}
            {step === "results" && "Here's what you're missing every month."}
            {step === "signup" && "Enter your email to unlock your full APEX report."}
            {step === "done" && "We'll be in touch with your personalised travel wealth breakdown."}
          </p>
        </div>

        {/* Progress */}
        {step !== "done" && (
          <div className="progress-bar" style={{ marginBottom: 32 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* ── STEP 1: Select Cards ───────────────────────────── */}
        {step === "cards" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {CARDS.map((card) => (
                <button
                  key={card.id}
                  className={`card-chip ${selectedCards.includes(card.id) ? "selected" : ""}`}
                  onClick={() => toggleCard(card.id)}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: selectedCards.includes(card.id) ? "var(--indigo)" : "var(--border)",
                      flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                      {card.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {card.issuer}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", marginBottom: 20 }}>
              {selectedCards.length === 0
                ? "Select at least one card"
                : `${selectedCards.length} card${selectedCards.length > 1 ? "s" : ""} selected`}
            </p>

            <button
              className="btn-primary"
              disabled={selectedCards.length === 0}
              onClick={() => setStep("spend")}
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── STEP 2: Monthly Spend ──────────────────────────── */}
        {step === "spend" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6, fontWeight: 500 }}>
                    {cat.label}
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 15 }}>₹</span>
                    <input
                      className="input"
                      style={{ paddingLeft: 28 }}
                      type="number"
                      placeholder={cat.placeholder.replace("₹", "")}
                      value={spend[cat.id] || ""}
                      onChange={(e) => setSpend((p) => ({ ...p, [cat.id]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep("cards")}
                style={{
                  flex: "0 0 auto",
                  padding: "14px 20px",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 15,
                }}
              >
                ←
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={calculateResults}
              >
                Calculate My Points →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ────────────────────────────────── */}
        {step === "results" && results && (
          <div>
            {/* Big missed value */}
            <div
              className="card pulse-glow"
              style={{ padding: "36px 24px", textAlign: "center", marginBottom: 16, position: "relative", overflow: "hidden" }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
                Monthly Missed Rewards
              </div>
              <div className="shimmer" style={{ fontSize: "clamp(48px, 10vw, 72px)", fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                {formatINR(displayValue)}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                left on the table every month
              </div>
              <div style={{ marginTop: 20, padding: "10px 16px", background: "rgba(99,102,241,0.1)", borderRadius: 8, display: "inline-block" }}>
                <span style={{ fontSize: 13, color: "var(--indigo-light)" }}>
                  Potential annual value:{" "}
                  <strong style={{ color: "var(--gold-light)" }}>
                    {formatINR(results.potentialAnnual)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Comparison */}
            <div className="card" style={{ padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                    Currently Earning
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>
                    {formatINR(results.current)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>per month</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                    With APEX Guidance
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--success)" }}>
                    {formatINR(results.optimal)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>per month</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="card" style={{ padding: "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                🔒 Unlock Your Full APEX Report
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
                Get a detailed card-by-card breakdown, optimal spend strategy, and early access to the APEX platform.
              </div>
              <button className="btn-gold" onClick={() => setStep("signup")}>
                Get My Free Report →
              </button>
            </div>

            {/* Share */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => {
                  setShareToken(generateToken());
                  setStep("signup");
                }}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                Share this result first →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Signup ─────────────────────────────────── */}
        {step === "signup" && (
          <div>
            <div className="card" style={{ padding: "28px 24px", marginBottom: 20 }}>
              {results && (
                <div style={{ textAlign: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Your missed rewards</div>
                  <div className="shimmer" style={{ fontSize: 40, fontWeight: 900 }}>
                    {formatINR(results.missedValue)}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>per month</div>
                </div>
              )}

              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                Email address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginBottom: 16 }}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              />

              <button
                className="btn-gold"
                disabled={submitting || !email.includes("@")}
                onClick={handleSignup}
              >
                {submitting ? "Adding you..." : "Join the APEX Waitlist →"}
              </button>

              <p style={{ fontSize: 11, color: "var(--text-dim)", textAlign: "center", marginTop: 12 }}>
                No spam. Early access only. Unsubscribe anytime.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 5: Done ───────────────────────────────────── */}
        {step === "done" && (
          <div>
            <div className="card pulse-glow" style={{ padding: "36px 24px", textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🖤</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                You&apos;re in.
              </div>
              <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                We&apos;ll send your personalised APEX report to <strong style={{ color: "var(--text)" }}>{email}</strong>
              </div>
            </div>

            {/* Share card */}
            <div className="card" style={{ padding: "24px", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                📲 Share & earn early access
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                Every person who joins via your link moves you up the waitlist.
              </div>

              <div style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 12,
                wordBreak: "break-all",
                fontFamily: "monospace"
              }}>
                {typeof window !== "undefined" ? `${window.location.origin}?ref=${shareToken}` : "Loading..."}
              </div>

              <button className="btn-primary" onClick={handleCopy}>
                {copied ? "✓ Copied!" : "Copy Share Link"}
              </button>
            </div>

            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `I just found out I'm missing ${formatINR(results?.missedValue || 0)} in travel rewards every month 🤯\n\nSee how much YOU'RE missing: ${typeof window !== "undefined" ? window.location.origin : ""}?ref=${shareToken}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px",
                background: "#25D366",
                borderRadius: 10,
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Share on WhatsApp 📲
            </a>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 48, fontSize: 12, color: "var(--text-dim)" }}>
          APEX — The Global Traveller &nbsp;·&nbsp; Built by Metastart
        </div>
      </div>
    </div>
  );
}
