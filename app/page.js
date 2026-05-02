"use client";
import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, Cell, XAxis, YAxis,
  LineChart, Line, Legend, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Plus, X, Trash2, Award, Filter,
  Briefcase, Compass, Eye, Activity, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

// ============================================================================
// MOCK DATA — replace with /api routes (TCBS + VNDirect) in production
// ============================================================================
const UNIVERSE = {
  VIC:  { name: "Vingroup JSC",          exchange: "HOSE", sector: "Real Estate",       price: 42500,  change:  800, changePct:  1.92, pe: 18.4, pb: 1.42, roe:  8.2, divYield: 0.0, revGrowth: 12.4, epsGrowth:  -4.2, marketCap: 162400 },
  FPT:  { name: "FPT Corporation",       exchange: "HOSE", sector: "Technology",        price: 138400, change: 2100, changePct:  1.54, pe: 22.8, pb: 4.20, roe: 28.4, divYield: 1.8, revGrowth: 21.4, epsGrowth:  24.8, marketCap: 203700 },
  VNM:  { name: "Vinamilk",              exchange: "HOSE", sector: "Consumer Staples",  price: 67200,  change: -400, changePct: -0.59, pe: 16.4, pb: 4.10, roe: 24.8, divYield: 5.8, revGrowth:  4.2, epsGrowth:   6.8, marketCap: 140400 },
  HPG:  { name: "Hoa Phat Group",        exchange: "HOSE", sector: "Materials",         price: 27850,  change:  350, changePct:  1.27, pe: 14.2, pb: 1.60, roe: 11.4, divYield: 0.0, revGrowth: 16.2, epsGrowth: 142.4, marketCap: 178200 },
  MWG:  { name: "Mobile World",          exchange: "HOSE", sector: "Consumer Disc.",    price: 58900,  change:  600, changePct:  1.03, pe: 19.8, pb: 3.10, roe: 18.2, divYield: 0.8, revGrowth: 14.8, epsGrowth:  31.4, marketCap:  86200 },
  TCB:  { name: "Techcombank",           exchange: "HOSE", sector: "Banks",             price: 24650,  change:  150, changePct:  0.61, pe:  8.4, pb: 1.10, roe: 16.8, divYield: 4.2, revGrowth:  8.4, epsGrowth:  12.1, marketCap:  86400 },
  ACB:  { name: "Asia Commercial Bank",  exchange: "HOSE", sector: "Banks",             price: 26100,  change: -200, changePct: -0.76, pe:  6.8, pb: 1.40, roe: 22.4, divYield: 6.4, revGrowth: 11.2, epsGrowth:  14.8, marketCap:  98700 },
  GAS:  { name: "PetroVietnam Gas",      exchange: "HOSE", sector: "Energy",            price: 81200,  change:  900, changePct:  1.12, pe: 15.2, pb: 2.40, roe: 18.4, divYield: 7.2, revGrowth:  3.4, epsGrowth:   9.8, marketCap: 155800 },
  DGC:  { name: "Duc Giang Chemicals",   exchange: "HOSE", sector: "Materials",         price: 102500, change: 1500, changePct:  1.49, pe: 12.4, pb: 2.80, roe: 28.2, divYield: 2.8, revGrowth: 24.8, epsGrowth:  38.4, marketCap:  38900 },
  PNJ:  { name: "Phu Nhuan Jewelry",     exchange: "HOSE", sector: "Consumer Disc.",    price: 96400,  change: -300, changePct: -0.31, pe: 14.8, pb: 3.40, roe: 24.2, divYield: 2.2, revGrowth: 18.4, epsGrowth:  22.1, marketCap:  31600 },
};

const SECTORS = ["Banks", "Real Estate", "Technology", "Materials", "Energy", "Consumer Staples", "Consumer Disc."];

const SECTOR_BENCH = { pe: 14, pb: 1.8, roe: 12, revGrowth: 8, epsGrowth: 6, divYield: 2.5 };

const SAMPLE_HOLDINGS = [
  { id: "h1", symbol: "FPT", quantity: 200,  buyPrice: 105000, buyDate: "2024-08-15" },
  { id: "h2", symbol: "HPG", quantity: 1000, buyPrice:  24800, buyDate: "2024-11-02" },
  { id: "h3", symbol: "VNM", quantity: 300,  buyPrice:  72000, buyDate: "2024-06-20" },
];

// ----- FLOW DATA (mock — replace with VNDirect /foreigns + HSX summary in prod) -----
function genFlowData(days, ticker = null) {
  const seed = ticker ? ticker.charCodeAt(0) : 0;
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dow = date.getDay();
    const phase = i / 5 + seed / 10;
    const foreign = Math.sin(phase) * 180 + Math.cos(i / 11) * 90 + (dow === 5 ? -60 : 0) + (Math.random() - 0.5) * 80;
    const institutional = -foreign * 0.4 + Math.cos(phase + 1) * 70 + (Math.random() - 0.5) * 50;
    const retail = -(foreign + institutional) * 0.6 + Math.sin(i / 7) * 60 + (Math.random() - 0.5) * 70;
    const scale = ticker ? 0.05 : 1;
    data.push({
      date: date.toISOString().slice(5, 10),
      dateFull: date.toISOString().slice(0, 10),
      foreign: Math.round(foreign * scale * 10) / 10,
      institutional: Math.round(institutional * scale * 10) / 10,
      retail: Math.round(retail * scale * 10) / 10,
    });
  }
  return data;
}

// Sector flow generator — different rotation patterns
function genSectorFlowData(days) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const row = {
      date: date.toISOString().slice(5, 10),
      dateFull: date.toISOString().slice(0, 10),
    };
    SECTORS.forEach((sec, idx) => {
      const seed = idx + 1;
      // Each sector has its own phase — creates rotation pattern
      const base = Math.sin((i / 8) + seed * 0.7) * 120;
      const trend = Math.cos((i / 14) + seed) * 80;
      const noise = (Math.random() - 0.5) * 60;
      // Boost certain sectors lately (mock recent rotation: into Banks/Tech, out of Real Estate)
      const recentBoost = i < days / 3
        ? (sec === "Banks" || sec === "Technology" ? 80 : sec === "Real Estate" ? -90 : 0)
        : 0;
      row[sec] = Math.round((base + trend + noise + recentBoost) * 10) / 10;
    });
    data.push(row);
  }
  return data;
}

const TOP_FOREIGN = {
  buying: [
    { symbol: "FPT", value:  142.4 }, { symbol: "MWG", value:   88.2 },
    { symbol: "HPG", value:   62.1 }, { symbol: "ACB", value:   48.4 },
    { symbol: "DGC", value:   31.8 },
  ],
  selling: [
    { symbol: "VIC",  value: -184.2 }, { symbol: "VNM",  value: -112.4 },
    { symbol: "GAS",  value:  -76.8 }, { symbol: "PNJ",  value:  -42.1 },
    { symbol: "TCB",  value:  -28.4 },
  ],
};

// ============================================================================
// HELPERS
// ============================================================================
const fmtVND = (v) => v == null ? "—" : new Intl.NumberFormat("vi-VN").format(Math.round(v));
const fmtPct = (v) => v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const fmtFlow = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
const daysBetween = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 86400000);

function computePosition(h) {
  const stock = UNIVERSE[h.symbol];
  if (!stock) return null;
  const cost = h.quantity * h.buyPrice;
  const currentValue = h.quantity * stock.price;
  const gain = currentValue - cost;
  const gainPct = (gain / cost) * 100;
  const todayGain = h.quantity * stock.change;
  const days = daysBetween(h.buyDate);
  return { ...h, stock, cost, currentValue, gain, gainPct, todayGain, days };
}

const SERIF = { fontFamily: '"Cormorant Garamond", Georgia, serif' };
const COLORS = {
  foreign:       "#d4b06a",
  institutional: "#7ec488",
  retail:        "#7aa6d9",
};
const SECTOR_COLORS = {
  "Banks":            "#7aa6d9",
  "Real Estate":      "#d4b06a",
  "Technology":       "#a78bd9",
  "Materials":        "#d97a7a",
  "Energy":           "#e89c5a",
  "Consumer Staples": "#7ec488",
  "Consumer Disc.":   "#d9a8d4",
};

// ============================================================================
// SHARED UI
// ============================================================================
function Tab({ active, onClick, icon: Icon, children }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.15em] uppercase transition-all border-b-2 whitespace-nowrap ${
        active ? "text-amber-100 border-amber-200/60" : "text-stone-500 border-transparent hover:text-stone-300"
      }`}>
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  );
}

function Stat({ label, value, sub, tone = "default" }) {
  const toneClass = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-rose-300" : "text-stone-100";
  return (
    <div>
      <div className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mb-1">{label}</div>
      <div className={`font-serif text-xl ${toneClass} tabular-nums`} style={SERIF}>{value}</div>
      {sub && <div className="text-[11px] text-stone-500 mt-0.5 tabular-nums">{sub}</div>}
    </div>
  );
}

function Section({ title, subtitle, children, action }) {
  return (
    <div className="bg-stone-900/40 border border-stone-800/60 p-5 rounded-sm">
      <div className="mb-4 pb-3 border-b border-stone-800/60 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-amber-100/90" style={SERIF}>{title}</h3>
          {subtitle && <p className="text-stone-500 text-[11px] italic mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function PillToggle({ value, onChange, options }) {
  return (
    <div className="flex border border-stone-800 rounded-sm overflow-hidden">
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-xs tracking-wider uppercase transition-colors whitespace-nowrap ${
            value === opt.value ? "bg-amber-100/10 text-amber-100" : "text-stone-500 hover:text-stone-300"
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// FORMS
// ============================================================================
function AddHoldingForm({ onAdd, onCancel }) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyDate, setBuyDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const submit = () => {
    const sym = symbol.toUpperCase();
    if (!UNIVERSE[sym]) { setError(`Ticker "${sym}" not in universe. Try: ${Object.keys(UNIVERSE).slice(0, 5).join(", ")}…`); return; }
    if (!quantity || Number(quantity) <= 0) { setError("Quantity must be greater than 0"); return; }
    if (!buyPrice || Number(buyPrice) <= 0) { setError("Buy price must be greater than 0"); return; }
    onAdd({ id: `h_${Date.now()}`, symbol: sym, quantity: Number(quantity), buyPrice: Number(buyPrice), buyDate });
  };

  return (
    <div className="bg-stone-900/60 border border-amber-200/20 p-5 rounded-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-serif text-lg text-amber-100" style={SERIF}>Add Holding</h4>
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-300"><X className="w-4 h-4"/></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-[10px] text-stone-500 tracking-wider uppercase">Ticker</label>
          <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="FPT"
            className="w-full mt-1 bg-stone-900 border border-stone-800 px-3 py-2 text-sm focus:outline-none focus:border-amber-200/30"/>
        </div>
        <div>
          <label className="text-[10px] text-stone-500 tracking-wider uppercase">Quantity</label>
          <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" placeholder="100"
            className="w-full mt-1 bg-stone-900 border border-stone-800 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-amber-200/30"/>
        </div>
        <div>
          <label className="text-[10px] text-stone-500 tracking-wider uppercase">Buy Price (₫)</label>
          <input value={buyPrice} onChange={e => setBuyPrice(e.target.value)} type="number" placeholder="105000"
            className="w-full mt-1 bg-stone-900 border border-stone-800 px-3 py-2 text-sm tabular-nums focus:outline-none focus:border-amber-200/30"/>
        </div>
        <div>
          <label className="text-[10px] text-stone-500 tracking-wider uppercase">Buy Date</label>
          <input value={buyDate} onChange={e => setBuyDate(e.target.value)} type="date"
            className="w-full mt-1 bg-stone-900 border border-stone-800 px-3 py-2 text-sm focus:outline-none focus:border-amber-200/30"/>
        </div>
      </div>
      {error && <div className="mt-3 text-xs text-rose-300">{error}</div>}
      <button onClick={submit} className="mt-3 px-4 py-2 bg-amber-100/10 border border-amber-200/30 text-amber-100 text-xs tracking-wider uppercase hover:bg-amber-100/20">Confirm</button>
    </div>
  );
}

function AddWatchForm({ existing, onAdd, onCancel }) {
  const [symbol, setSymbol] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    const sym = symbol.toUpperCase();
    if (!UNIVERSE[sym]) { setError(`"${sym}" not in universe.`); return; }
    if (existing.includes(sym)) { setError(`${sym} already in watchlist.`); return; }
    onAdd(sym);
  };
  return (
    <div className="bg-stone-900/60 border border-amber-200/20 p-5 rounded-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-serif text-lg text-amber-100" style={SERIF}>Add to Watchlist</h4>
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-300"><X className="w-4 h-4"/></button>
      </div>
      <div className="flex gap-3">
        <input value={symbol} onChange={e => { setSymbol(e.target.value.toUpperCase()); setError(""); }} placeholder="Ticker (e.g. MWG)"
          className="flex-1 bg-stone-900 border border-stone-800 px-3 py-2 text-sm focus:outline-none focus:border-amber-200/30"/>
        <button onClick={submit} className="px-4 py-2 bg-amber-100/10 border border-amber-200/30 text-amber-100 text-xs tracking-wider uppercase hover:bg-amber-100/20">Add</button>
      </div>
      {error && <div className="mt-3 text-xs text-rose-300">{error}</div>}
    </div>
  );
}

// ============================================================================
// HOLDINGS
// ============================================================================
function HoldingsView({ holdings, onAdd, onRemove }) {
  const positions = useMemo(() => holdings.map(computePosition).filter(Boolean), [holdings]);
  const [showForm, setShowForm] = useState(false);

  const totals = useMemo(() => {
    if (!positions.length) return null;
    const cost = positions.reduce((s, p) => s + p.cost, 0);
    const value = positions.reduce((s, p) => s + p.currentValue, 0);
    const gain = value - cost;
    const todayGain = positions.reduce((s, p) => s + p.todayGain, 0);
    return { cost, value, gain, gainPct: (gain / cost) * 100, todayGain, todayPct: (todayGain / value) * 100 };
  }, [positions]);

  const sorted = [...positions].sort((a, b) => b.gainPct - a.gainPct);
  const best = sorted[0];
  const contribData = sorted.map(p => ({ symbol: p.symbol, contribPct: totals ? (p.gain / totals.cost) * 100 : 0 }));

  if (!positions.length) {
    return (
      <div>
        <div className="text-center py-20">
          <Briefcase className="w-12 h-12 mx-auto text-stone-700 mb-4" />
          <p className="text-stone-400 mb-6">No holdings yet. Add your first position.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="px-5 py-2 bg-amber-100/10 border border-amber-200/30 text-amber-100 text-xs tracking-wider uppercase hover:bg-amber-100/20">Add Holding</button>
          )}
        </div>
        {showForm && <AddHoldingForm onAdd={(h) => { onAdd(h); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-stone-900/60 to-stone-900/20 border border-stone-800/60 p-7 rounded-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[10px] text-stone-500 tracking-[0.3em] uppercase">Portfolio Value</div>
            <div className="font-serif text-5xl text-stone-100 tabular-nums mt-1" style={SERIF}>
              {fmtVND(totals.value)} <span className="text-xl text-stone-500">₫</span>
            </div>
            <div className={`flex items-center gap-2 mt-2 ${totals.gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totals.gain >= 0 ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
              <span className="tabular-nums">
                {totals.gain >= 0 ? "+" : ""}{fmtVND(totals.gain)} ₫ ({fmtPct(totals.gainPct)})
              </span>
              <span className="text-stone-600 mx-2">·</span>
              <span className="text-stone-400 text-sm">all-time</span>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-100/10 border border-amber-200/30 text-amber-100 text-xs tracking-wider uppercase hover:bg-amber-100/20">
            <Plus className="w-3.5 h-3.5"/> Add
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5 border-t border-stone-800/60">
          <Stat label="Invested" value={`${fmtVND(totals.cost)} ₫`} />
          <Stat label="Today's P&L" value={`${totals.todayGain >= 0 ? "+" : ""}${fmtVND(totals.todayGain)} ₫`} sub={fmtPct(totals.todayPct)} tone={totals.todayGain >= 0 ? "good" : "bad"} />
          <Stat label="Positions" value={positions.length} />
          <Stat label="Top Performer" value={best.symbol} sub={fmtPct(best.gainPct)} tone="good" />
        </div>
      </div>

      {showForm && <AddHoldingForm onAdd={(h) => { onAdd(h); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Section title="Contribution to Portfolio" subtitle="Each position's gain as % of total invested capital">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contribData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 10 }} tickFormatter={v => `${v.toFixed(1)}%`} />
                <YAxis dataKey="symbol" type="category" axisLine={false} tickLine={false} tick={{ fill: "#a8a29e", fontSize: 12 }} width={50} />
                <Tooltip contentStyle={{ background: "#1c1814", border: "1px solid #44403c", borderRadius: 2, fontSize: 12 }} formatter={(v) => [`${v.toFixed(2)}%`, "Contribution"]} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="contribPct" radius={[0, 2, 2, 0]}>
                  {contribData.map((d, i) => <Cell key={i} fill={d.contribPct >= 0 ? "#7ec488" : "#d97a7a"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Section title="Top Performer" action={<Award className="w-4 h-4 text-amber-200"/>}>
            <div className="font-serif text-4xl text-amber-100 mb-1" style={SERIF}>{best.symbol}</div>
            <div className="text-sm text-stone-400 mb-4">{best.stock.name}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Bought</span><span className="tabular-nums">{fmtVND(best.buyPrice)} ₫</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Current</span><span className="tabular-nums">{fmtVND(best.stock.price)} ₫</span></div>
              <div className="flex justify-between"><span className="text-stone-500">ROI</span><span className="text-emerald-300 tabular-nums">{fmtPct(best.gainPct)}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Held</span><span className="tabular-nums">{best.days} days</span></div>
            </div>
          </Section>
        </div>
      </div>

      <div className="bg-stone-900/40 border border-stone-800/60 rounded-sm overflow-hidden">
        <div className="p-5 border-b border-stone-800/60">
          <h3 className="font-serif text-lg text-amber-100/90" style={SERIF}>Positions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-[0.15em] uppercase text-stone-500 border-b border-stone-800/60">
                <th className="text-left p-4 font-normal">Stock</th>
                <th className="text-right p-4 font-normal">Qty</th>
                <th className="text-right p-4 font-normal">Buy</th>
                <th className="text-right p-4 font-normal">Current</th>
                <th className="text-right p-4 font-normal">Value</th>
                <th className="text-right p-4 font-normal">Today</th>
                <th className="text-right p-4 font-normal">Gain / Loss</th>
                <th className="text-right p-4 font-normal">ROI</th>
                <th className="text-right p-4 font-normal">Days</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-stone-800/40 hover:bg-stone-900/40 transition-colors">
                  <td className="p-4">
                    <div className="font-serif text-base text-amber-100" style={SERIF}>{p.symbol}</div>
                    <div className="text-[11px] text-stone-500">{p.stock.name}</div>
                  </td>
                  <td className="text-right p-4 tabular-nums">{fmtVND(p.quantity)}</td>
                  <td className="text-right p-4 tabular-nums text-stone-400">{fmtVND(p.buyPrice)}</td>
                  <td className="text-right p-4 tabular-nums">{fmtVND(p.stock.price)}</td>
                  <td className="text-right p-4 tabular-nums">{fmtVND(p.currentValue)}</td>
                  <td className={`text-right p-4 tabular-nums text-xs ${p.todayGain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {p.todayGain >= 0 ? "+" : ""}{fmtVND(p.todayGain)}
                  </td>
                  <td className={`text-right p-4 tabular-nums ${p.gain >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {p.gain >= 0 ? "+" : ""}{fmtVND(p.gain)}
                  </td>
                  <td className={`text-right p-4 tabular-nums font-medium ${p.gainPct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {fmtPct(p.gainPct)}
                  </td>
                  <td className="text-right p-4 tabular-nums text-stone-500">{p.days}</td>
                  <td className="p-4">
                    <button onClick={() => onRemove(p.id)} className="text-stone-600 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WATCHLIST
// ============================================================================
function WatchlistView({ watchlist, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const items = watchlist.map(s => ({ symbol: s, ...UNIVERSE[s] })).filter(x => x.name);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-amber-100" style={SERIF}>Watchlist</h2>
          <p className="text-stone-500 text-sm mt-1">Stocks you're tracking but haven't bought.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-100/10 border border-amber-200/30 text-amber-100 text-xs tracking-wider uppercase hover:bg-amber-100/20">
          <Plus className="w-3.5 h-3.5"/> Add
        </button>
      </div>

      {showForm && <AddWatchForm existing={watchlist} onAdd={(s) => { onAdd(s); setShowForm(false); }} onCancel={() => setShowForm(false)} />}

      {!items.length ? (
        <div className="text-center py-16 text-stone-500">
          <Eye className="w-10 h-10 mx-auto text-stone-700 mb-3"/>
          Your watchlist is empty. Add a ticker to start tracking.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(s => (
            <div key={s.symbol} className="bg-stone-900/40 border border-stone-800/60 p-5 rounded-sm hover:border-amber-200/20 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-serif text-2xl text-amber-100" style={SERIF}>{s.symbol}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{s.name}</div>
                  <div className="text-[10px] text-stone-600 tracking-wider uppercase mt-0.5">{s.sector}</div>
                </div>
                <button onClick={() => onRemove(s.symbol)} className="opacity-0 group-hover:opacity-100 text-stone-600 hover:text-rose-400 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5"/>
                </button>
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-serif text-2xl text-stone-100 tabular-nums" style={SERIF}>{fmtVND(s.price)}</span>
                <span className="text-xs text-stone-500">₫</span>
                <span className={`text-xs tabular-nums ml-auto ${s.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(s.changePct)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-800/60 text-center">
                <div><div className="text-[10px] text-stone-500 tracking-wider uppercase">P/E</div><div className="text-sm tabular-nums mt-0.5">{s.pe.toFixed(1)}</div></div>
                <div><div className="text-[10px] text-stone-500 tracking-wider uppercase">ROE</div><div className="text-sm tabular-nums mt-0.5">{s.roe.toFixed(1)}%</div></div>
                <div><div className="text-[10px] text-stone-500 tracking-wider uppercase">Yield</div><div className="text-sm tabular-nums mt-0.5">{s.divYield.toFixed(1)}%</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DISCOVER
// ============================================================================
function DiscoverView() {
  const [filters, setFilters] = useState({ undervalued: true, growth: false, dividend: false });
  const candidates = useMemo(() => {
    return Object.entries(UNIVERSE).map(([symbol, s]) => {
      const passes = {
        undervalued: s.pe < SECTOR_BENCH.pe && s.pb < SECTOR_BENCH.pb,
        growth: s.revGrowth > SECTOR_BENCH.revGrowth && s.epsGrowth > SECTOR_BENCH.epsGrowth,
        dividend: s.divYield > SECTOR_BENCH.divYield,
      };
      const score = (passes.undervalued ? 1 : 0) + (passes.growth ? 1 : 0) + (passes.dividend ? 1 : 0);
      const matchesActive = Object.entries(filters).filter(([_, on]) => on).every(([k]) => passes[k]);
      return { symbol, ...s, passes, score, matchesActive };
    }).filter(c => c.matchesActive).sort((a, b) => b.score - a.score);
  }, [filters]);

  const toggle = (k) => setFilters(f => ({ ...f, [k]: !f[k] }));
  const FilterChip = ({ k, label, hint }) => (
    <button onClick={() => toggle(k)}
      className={`px-3 py-2 text-xs tracking-wider transition-all text-left ${
        filters[k] ? "bg-amber-100/10 text-amber-100 border border-amber-200/40" : "bg-stone-900/40 text-stone-400 border border-stone-800 hover:border-stone-700"
      }`}>
      <div className="font-medium">{label}</div>
      <div className="text-[10px] text-stone-500 mt-0.5">{hint}</div>
    </button>
  );
  const anyActive = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6">
      <Section title="Filters" subtitle="Stack to narrow results" action={<Filter className="w-4 h-4 text-amber-200"/>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FilterChip k="undervalued" label="Undervalued" hint={`P/E < ${SECTOR_BENCH.pe} & P/B < ${SECTOR_BENCH.pb}`}/>
          <FilterChip k="growth"      label="High Growth" hint={`Rev > ${SECTOR_BENCH.revGrowth}% & EPS > ${SECTOR_BENCH.epsGrowth}%`}/>
          <FilterChip k="dividend"    label="Dividend"    hint={`Yield > ${SECTOR_BENCH.divYield}%`}/>
        </div>
      </Section>
      <div className="text-[11px] text-stone-500 tracking-[0.2em] uppercase">
        {anyActive ? `${candidates.length} match${candidates.length !== 1 ? "es" : ""}` : "Pick at least one filter"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((c) => (
          <div key={c.symbol} className="bg-stone-900/40 border border-stone-800/60 p-5 rounded-sm hover:border-amber-200/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-2xl text-amber-100" style={SERIF}>{c.symbol}</span>
                  <span className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">{c.sector}</span>
                </div>
                <div className="text-sm text-stone-400">{c.name}</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-xl text-stone-100 tabular-nums" style={SERIF}>{fmtVND(c.price)}</div>
                <div className={`text-xs tabular-nums ${c.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtPct(c.changePct)}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-800/60">
              <div className={`text-center py-2 rounded-sm border ${c.passes.undervalued ? "border-emerald-400/30 bg-emerald-400/5" : "border-stone-800 opacity-40"}`}>
                <div className="text-[10px] tracking-wider uppercase text-stone-500">P/E · P/B</div>
                <div className={`text-sm tabular-nums mt-0.5 ${c.passes.undervalued ? "text-emerald-300" : "text-stone-500"}`}>{c.pe.toFixed(1)} · {c.pb.toFixed(2)}</div>
              </div>
              <div className={`text-center py-2 rounded-sm border ${c.passes.growth ? "border-emerald-400/30 bg-emerald-400/5" : "border-stone-800 opacity-40"}`}>
                <div className="text-[10px] tracking-wider uppercase text-stone-500">Rev · EPS</div>
                <div className={`text-sm tabular-nums mt-0.5 ${c.passes.growth ? "text-emerald-300" : "text-stone-500"}`}>{c.revGrowth.toFixed(0)}% · {c.epsGrowth.toFixed(0)}%</div>
              </div>
              <div className={`text-center py-2 rounded-sm border ${c.passes.dividend ? "border-emerald-400/30 bg-emerald-400/5" : "border-stone-800 opacity-40"}`}>
                <div className="text-[10px] tracking-wider uppercase text-stone-500">Yield</div>
                <div className={`text-sm tabular-nums mt-0.5 ${c.passes.dividend ? "text-emerald-300" : "text-stone-500"}`}>{c.divYield.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MARKET FLOW — with Whole Market / Per Ticker / By Sector
// ============================================================================
function aggregateBy(daily, period, keys) {
  if (period === "daily") return daily;
  const buckets = {};
  daily.forEach(d => {
    const dt = new Date(d.dateFull);
    let key;
    if (period === "weekly") {
      const monday = new Date(dt);
      const day = monday.getDay() || 7;
      monday.setDate(monday.getDate() - day + 1);
      key = monday.toISOString().slice(5, 10);
    } else {
      key = dt.toISOString().slice(0, 7);
    }
    if (!buckets[key]) {
      buckets[key] = { date: key };
      keys.forEach(k => buckets[key][k] = 0);
    }
    keys.forEach(k => buckets[key][k] += (d[k] || 0));
  });
  return Object.values(buckets);
}

function FlowView() {
  const [scope, setScope] = useState("market"); // 'market' | 'ticker' | 'sector'
  const [ticker, setTicker] = useState("FPT");
  const [period, setPeriod] = useState("daily");

  // Data sets
  const investorDaily = useMemo(
    () => genFlowData(period === "monthly" ? 180 : period === "weekly" ? 90 : 30, scope === "ticker" ? ticker : null),
    [scope, ticker, period]
  );
  const investorAgg = useMemo(() => aggregateBy(investorDaily, period, ["foreign", "institutional", "retail"]), [investorDaily, period]);

  const sectorDaily = useMemo(
    () => genSectorFlowData(period === "monthly" ? 180 : period === "weekly" ? 90 : 30),
    [period]
  );
  const sectorAgg = useMemo(() => aggregateBy(sectorDaily, period, SECTORS), [sectorDaily, period]);

  // Investor totals + half-period comparison
  const investorTotals = useMemo(() => investorAgg.reduce(
    (acc, d) => ({ foreign: acc.foreign + d.foreign, institutional: acc.institutional + d.institutional, retail: acc.retail + d.retail }),
    { foreign: 0, institutional: 0, retail: 0 }
  ), [investorAgg]);
  const half = Math.floor(investorAgg.length / 2);
  const prevHalf = investorAgg.slice(0, half).reduce((s, d) => s + d.foreign, 0);
  const currHalf = investorAgg.slice(half).reduce((s, d) => s + d.foreign, 0);

  // Sector totals (over the period) — for ranking
  const sectorTotals = useMemo(() => {
    return SECTORS.map(sec => ({
      sector: sec,
      total: sectorAgg.reduce((s, d) => s + (d[sec] || 0), 0),
    })).sort((a, b) => b.total - a.total);
  }, [sectorAgg]);

  // Heatmap cell helpers
  const sectorHeatMax = useMemo(() => {
    let max = 0;
    sectorAgg.forEach(d => SECTORS.forEach(sec => {
      const v = Math.abs(d[sec] || 0);
      if (v > max) max = v;
    }));
    return max || 1;
  }, [sectorAgg]);

  const heatColor = (v) => {
    const intensity = Math.min(1, Math.abs(v) / sectorHeatMax);
    if (v > 0) return `rgba(126, 196, 136, ${0.15 + intensity * 0.7})`;
    if (v < 0) return `rgba(217, 122, 122, ${0.15 + intensity * 0.7})`;
    return "rgba(120, 113, 108, 0.1)";
  };

  const periodLabel = period === "daily" ? "30d" : period === "weekly" ? "13w" : "6mo";

  return (
    <div className="space-y-6">
      {/* Scope + period controls */}
      <div className="flex flex-wrap items-center gap-3">
        <PillToggle
          value={scope}
          onChange={setScope}
          options={[
            { value: "market", label: "Whole Market" },
            { value: "ticker", label: "Per Ticker" },
            { value: "sector", label: "By Sector" },
          ]}
        />
        {scope === "ticker" && (
          <select value={ticker} onChange={e => setTicker(e.target.value)} className="bg-stone-900 border border-stone-800 px-3 py-2 text-sm focus:outline-none focus:border-amber-200/30">
            {Object.keys(UNIVERSE).map(s => <option key={s} value={s}>{s} — {UNIVERSE[s].name}</option>)}
          </select>
        )}
        <div className="ml-auto">
          <PillToggle
            value={period}
            onChange={setPeriod}
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </div>
      </div>

      {/* INVESTOR-GROUP VIEW */}
      {(scope === "market" || scope === "ticker") && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-stone-900/60 to-stone-900/20 border border-stone-800/60 p-5 rounded-sm">
              <div className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">Foreign Net · {periodLabel}</div>
              <div className={`font-serif text-3xl tabular-nums mt-1 ${investorTotals.foreign >= 0 ? "text-emerald-300" : "text-rose-300"}`} style={SERIF}>
                {fmtFlow(investorTotals.foreign)} <span className="text-sm text-stone-500">tỷ ₫</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                {currHalf >= prevHalf ? <ArrowUpRight className="w-3 h-3 text-emerald-400"/> : <ArrowDownRight className="w-3 h-3 text-rose-400"/>}
                vs prior half: {fmtFlow(currHalf - prevHalf)}
              </div>
            </div>
            <div className="bg-stone-900/40 border border-stone-800/60 p-5 rounded-sm">
              <div className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">Institutional Net</div>
              <div className={`font-serif text-3xl tabular-nums mt-1 ${investorTotals.institutional >= 0 ? "text-emerald-300" : "text-rose-300"}`} style={SERIF}>
                {fmtFlow(investorTotals.institutional)} <span className="text-sm text-stone-500">tỷ ₫</span>
              </div>
            </div>
            <div className="bg-stone-900/40 border border-stone-800/60 p-5 rounded-sm">
              <div className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">Retail Net</div>
              <div className={`font-serif text-3xl tabular-nums mt-1 ${investorTotals.retail >= 0 ? "text-emerald-300" : "text-rose-300"}`} style={SERIF}>
                {fmtFlow(investorTotals.retail)} <span className="text-sm text-stone-500">tỷ ₫</span>
              </div>
            </div>
            <div className="bg-stone-900/40 border border-stone-800/60 p-5 rounded-sm">
              <div className="text-[10px] text-stone-500 tracking-[0.2em] uppercase">Pattern</div>
              <div className="font-serif text-xl text-amber-100 mt-1" style={SERIF}>
                {investorTotals.foreign < 0 && investorTotals.retail > 0 ? "Distribution" :
                 investorTotals.foreign > 0 && investorTotals.retail > 0 ? "Accumulation" :
                 investorTotals.foreign > 0 && investorTotals.retail < 0 ? "Foreign-led" : "Mixed"}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                {investorTotals.foreign < 0 && investorTotals.retail > 0 ? "Foreigners selling, retail absorbing" :
                 investorTotals.foreign > 0 && investorTotals.retail > 0 ? "Broad-based buying" :
                 investorTotals.foreign > 0 && investorTotals.retail < 0 ? "Smart money buying" : "No clear pattern"}
              </div>
            </div>
          </div>

          <Section title="Net Flow by Investor Group" subtitle={`${period.charAt(0).toUpperCase() + period.slice(1)} · ${scope === "market" ? "Whole VN market" : ticker} · tỷ VND`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={investorAgg}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#44403c" />
                <Tooltip
                  contentStyle={{ background: "#1c1814", border: "1px solid #44403c", borderRadius: 2, fontSize: 12 }}
                  formatter={(v, n) => [`${fmtFlow(v)} tỷ`, n.charAt(0).toUpperCase() + n.slice(1)]}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#a8a29e" }} />
                <Bar dataKey="foreign" name="Foreign" fill={COLORS.foreign} />
                <Bar dataKey="institutional" name="Institutional" fill={COLORS.institutional} />
                <Bar dataKey="retail" name="Retail" fill={COLORS.retail} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {scope === "market" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Section title="Foreign Top Buys" subtitle="Where foreigners are putting money in" action={<TrendingUp className="w-4 h-4 text-emerald-400"/>}>
                <div className="space-y-2">
                  {TOP_FOREIGN.buying.map(t => (
                    <div key={t.symbol} className="flex items-center justify-between py-2 border-b border-stone-800/40 last:border-0">
                      <span className="font-serif text-base text-amber-100" style={SERIF}>{t.symbol}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400/70" style={{ width: `${(t.value / TOP_FOREIGN.buying[0].value) * 100}%` }}/>
                        </div>
                        <span className="text-emerald-300 tabular-nums text-sm w-20 text-right">+{t.value.toFixed(1)} tỷ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="Foreign Top Sells" subtitle="Where foreigners are pulling money out" action={<TrendingDown className="w-4 h-4 text-rose-400"/>}>
                <div className="space-y-2">
                  {TOP_FOREIGN.selling.map(t => (
                    <div key={t.symbol} className="flex items-center justify-between py-2 border-b border-stone-800/40 last:border-0">
                      <span className="font-serif text-base text-amber-100" style={SERIF}>{t.symbol}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400/70" style={{ width: `${(Math.abs(t.value) / Math.abs(TOP_FOREIGN.selling[0].value)) * 100}%` }}/>
                        </div>
                        <span className="text-rose-300 tabular-nums text-sm w-20 text-right">{t.value.toFixed(1)} tỷ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </>
      )}

      {/* SECTOR VIEW */}
      {scope === "sector" && (
        <>
          {/* Top inflow / outflow stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-900/20 to-stone-900/20 border border-emerald-500/20 p-5 rounded-sm">
              <div className="text-[10px] text-emerald-300/80 tracking-[0.2em] uppercase mb-3">Top Inflows · {periodLabel}</div>
              <div className="space-y-2">
                {sectorTotals.slice(0, 3).filter(s => s.total > 0).map((s, i) => (
                  <div key={s.sector} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 text-xs tabular-nums w-4">{i + 1}.</span>
                      <span className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[s.sector] }}/>
                      <span className="font-serif text-base text-amber-100" style={SERIF}>{s.sector}</span>
                    </div>
                    <span className="text-emerald-300 tabular-nums text-sm">+{s.total.toFixed(1)} tỷ ₫</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-900/20 to-stone-900/20 border border-rose-500/20 p-5 rounded-sm">
              <div className="text-[10px] text-rose-300/80 tracking-[0.2em] uppercase mb-3">Top Outflows · {periodLabel}</div>
              <div className="space-y-2">
                {[...sectorTotals].reverse().slice(0, 3).filter(s => s.total < 0).map((s, i) => (
                  <div key={s.sector} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 text-xs tabular-nums w-4">{i + 1}.</span>
                      <span className="w-2 h-2 rounded-full" style={{ background: SECTOR_COLORS[s.sector] }}/>
                      <span className="font-serif text-base text-amber-100" style={SERIF}>{s.sector}</span>
                    </div>
                    <span className="text-rose-300 tabular-nums text-sm">{s.total.toFixed(1)} tỷ ₫</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sector ranking bar */}
          <Section title="Net Flow by Sector" subtitle={`Total over ${periodLabel} · ranked · tỷ VND`}>
            <ResponsiveContainer width="100%" height={Math.max(220, sectorTotals.length * 38)}>
              <BarChart data={sectorTotals} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 10 }} />
                <YAxis dataKey="sector" type="category" axisLine={false} tickLine={false} tick={{ fill: "#a8a29e", fontSize: 11 }} width={120} />
                <ReferenceLine x={0} stroke="#44403c" />
                <Tooltip contentStyle={{ background: "#1c1814", border: "1px solid #44403c", borderRadius: 2, fontSize: 12 }}
                  formatter={(v) => [`${fmtFlow(v)} tỷ ₫`, "Net flow"]}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}/>
                <Bar dataKey="total" radius={[0, 2, 2, 0]}>
                  {sectorTotals.map((d, i) => <Cell key={i} fill={d.total >= 0 ? "#7ec488" : "#d97a7a"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Sector flow over time — multi-line */}
          <Section title="Sector Flow Over Time" subtitle="Each line is one sector's net flow per period">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sectorAgg}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#78716c", fontSize: 10 }} />
                <ReferenceLine y={0} stroke="#44403c" />
                <Tooltip contentStyle={{ background: "#1c1814", border: "1px solid #44403c", borderRadius: 2, fontSize: 12 }}
                  formatter={(v, n) => [`${fmtFlow(v)} tỷ`, n]}/>
                <Legend wrapperStyle={{ fontSize: 11, color: "#a8a29e" }} />
                {SECTORS.map(sec => (
                  <Line key={sec} type="monotone" dataKey={sec} stroke={SECTOR_COLORS[sec]} strokeWidth={1.8} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Section>

          {/* Heatmap — sector × time */}
          <Section title="Rotation Heatmap" subtitle="Green = inflow, Red = outflow · spot rotation patterns at a glance">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* header row */}
                <div className="flex items-center pl-[120px] mb-2">
                  {sectorAgg.map(d => (
                    <div key={d.date} className="flex-1 text-[9px] text-stone-600 text-center tabular-nums">{d.date}</div>
                  ))}
                </div>
                {/* sector rows */}
                {SECTORS.map(sec => (
                  <div key={sec} className="flex items-center mb-1">
                    <div className="w-[120px] flex items-center gap-2 pr-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SECTOR_COLORS[sec] }}/>
                      <span className="text-xs text-stone-300 truncate">{sec}</span>
                    </div>
                    {sectorAgg.map(d => (
                      <div
                        key={d.date}
                        title={`${sec} · ${d.date}: ${fmtFlow(d[sec])} tỷ`}
                        className="flex-1 h-7 mx-[1px] rounded-sm border border-stone-800/40 cursor-help transition-transform hover:scale-110"
                        style={{ background: heatColor(d[sec]) }}
                      />
                    ))}
                  </div>
                ))}
                {/* legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-stone-500">
                  <span>Outflow</span>
                  <div className="flex h-2">
                    {[-1, -0.66, -0.33, 0, 0.33, 0.66, 1].map(v => (
                      <div key={v} className="w-5" style={{ background: heatColor(v * sectorHeatMax) }}/>
                    ))}
                  </div>
                  <span>Inflow</span>
                </div>
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

// ============================================================================
// ROOT APP
// ============================================================================
export default function StockTrackerApp() {
  const [tab, setTab] = useState("holdings");
  const [holdings, setHoldings] = useState(SAMPLE_HOLDINGS);
  const [watchlist, setWatchlist] = useState(["MWG", "ACB", "DGC"]);

  return (
    <div className="min-h-screen bg-[#16130f] text-stone-200" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
           style={{
             backgroundImage:
               'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
           }}/>
      <div className="relative max-w-[1400px] mx-auto px-8 py-6">
        <header className="flex items-center justify-between pb-5 mb-6 border-b border-stone-800/60">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-2xl text-amber-100/90 tracking-wider" style={SERIF}>LEDGER</h1>
            <span className="text-stone-600 text-[10px] tracking-[0.3em] uppercase">Vietnam Equity Tracker</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-stone-500">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 tracking-wider">VN-INDEX</span>
              <span className="text-emerald-400 tabular-nums">1,267.84</span>
              <span className="text-emerald-400 tabular-nums">+0.42%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="tracking-wider">MARKET OPEN</span>
            </div>
          </div>
        </header>

        <nav className="flex gap-1 mb-8 border-b border-stone-800/40 overflow-x-auto">
          <Tab active={tab === "holdings"}  onClick={() => setTab("holdings")}  icon={Briefcase}>My Holdings</Tab>
          <Tab active={tab === "watchlist"} onClick={() => setTab("watchlist")} icon={Eye}>Watchlist</Tab>
          <Tab active={tab === "discover"}  onClick={() => setTab("discover")}  icon={Compass}>Discover</Tab>
          <Tab active={tab === "flow"}      onClick={() => setTab("flow")}      icon={Activity}>Market Flow</Tab>
        </nav>

        {tab === "holdings"  && <HoldingsView holdings={holdings} onAdd={(h) => setHoldings(p => [...p, h])} onRemove={(id) => setHoldings(p => p.filter(x => x.id !== id))}/>}
        {tab === "watchlist" && <WatchlistView watchlist={watchlist} onAdd={(s) => setWatchlist(p => [...p, s])} onRemove={(s) => setWatchlist(p => p.filter(x => x !== s))}/>}
        {tab === "discover"  && <DiscoverView/>}
        {tab === "flow"      && <FlowView/>}

        <footer className="mt-12 pt-5 border-t border-stone-800/60 flex items-center justify-between text-[10px] text-stone-600 tracking-wider uppercase">
          <span>Data: TCBS · VNDirect · HSX · Delayed 15 min</span>
          <span>Ledger · Vietnam Markets</span>
        </footer>
      </div>
    </div>
  );
}
