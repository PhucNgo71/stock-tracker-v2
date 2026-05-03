// app/api/quotes/route.js
// Fetches LAST CLOSE prices for VN stocks from TCBS daily history endpoint.
// Always uses the latest available close (Friday on weekends, yesterday after-hours).
// Cached for 30 min — closes don't change throughout the day.

export const revalidate = 1800;
export const dynamic = "force-dynamic";

const TCBS_BASE = "https://apipubaws.tcbs.com.vn/stock-insight/v1";

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
  const url = `${TCBS_BASE}/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&countBack=2`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const bars = Array.isArray(json?.data) ? json.data : [];
    if (bars.length === 0) return null;

    const last = bars[bars.length - 1];
    const prev = bars.length >= 2 ? bars[bars.length - 2] : null;

    const close = Number(last.close ?? last.c ?? 0) * 1000;
    const prevClose = prev ? Number(prev.close ?? prev.c ?? 0) * 1000 : close;
    const change = close - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    return {
      ticker,
      price: Math.round(close),
      change: Math.round(change),
      changePct: Number(changePct.toFixed(2)),
      tradeDate: last.tradingDate ?? last.date ?? null,
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
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}