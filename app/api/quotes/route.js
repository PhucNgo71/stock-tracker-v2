// app/api/quotes/route.js
// Fetches LAST CLOSE prices for VN stocks from VNDirect's free dchart API.
// VNDirect doesn't block cloud IPs, unlike TCBS.

export const revalidate = 1800;
export const dynamic = "force-dynamic";

const VND_BASE = "https://dchart-api.vndirect.com.vn/dchart";

const TICKERS = [
  "VCB", "BID", "CTG", "TCB", "ACB", "MBB", "VPB", "STB", "HDB", "EIB", "MSB",
  "VIC", "VHM", "VRE", "NVL", "DXG", "KDH", "KBC", "BCM",
  "FPT", "DGW",
  "HPG", "DGC", "DCM", "GVR",
  "VNM", "MSN", "SAB",
  "MWG", "PNJ", "FRT",
  "GAS", "PLX", "POW",
  "SSI", "VND", "MBS",
  "REE", "CTD", "VSC", "GMD",
];

async function fetchLastClose(ticker) {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 14 * 24 * 60 * 60; // last 14 days, plenty for "last 2 closes"
  const url = `${VND_BASE}/history?symbol=${ticker}&resolution=D&from=${from}&to=${to}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // VNDirect returns: { s: "ok", t: [timestamps], o: [opens], h: [highs], l: [lows], c: [closes], v: [volumes] }
    if (json?.s !== "ok" || !Array.isArray(json.c) || json.c.length === 0) return null;

    const closes = json.c;
    const times = json.t;
    const lastClose = Number(closes[closes.length - 1]);
    const prevClose = closes.length >= 2 ? Number(closes[closes.length - 2]) : lastClose;
    const change = lastClose - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;
    const lastTs = times[times.length - 1];
    const tradeDate = lastTs ? new Date(lastTs * 1000).toISOString() : null;

    return {
      ticker,
      price: Math.round(lastClose),
      change: Math.round(change),
      changePct: Number(changePct.toFixed(2)),
      tradeDate,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const results = await Promise.all(TICKERS.map(fetchLastClose));
  const quotes = {};
  let lastTradeDate = null;
  results.forEach(r => {
    if (r && r.price > 0) {
      quotes[r.ticker] = r;
      if (r.tradeDate) lastTradeDate = r.tradeDate;
    }
  });

  return Response.json(
    {
      quotes,
      updatedAt: new Date().toISOString(),
      tradeDate: lastTradeDate,
      count: Object.keys(quotes).length,
      source: "VNDirect dchart",
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}