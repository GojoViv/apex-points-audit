import { NextRequest, NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const NOTION_DB_ID = process.env.NOTION_DB_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, cards, monthlySpend, missedValue, potentialAnnual, shareToken, source } = body;

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          Name: {
            title: [{ text: { content: email } }],
          },
          Email: { email },
          Cards: {
            rich_text: [{ text: { content: cards || "" } }],
          },
          "Monthly Spend (₹)": { number: monthlySpend || 0 },
          "Missed Points Value (₹)": { number: missedValue || 0 },
          "Potential Annual Value (₹)": { number: potentialAnnual || 0 },
          "Signed Up At": {
            date: { start: new Date().toISOString() },
          },
          Source: { select: { name: source || "Direct" } },
          "Share Token": {
            rich_text: [{ text: { content: shareToken || "" } }],
          },
          Status: { select: { name: "Waitlist" } },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Notion error:", err);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
