
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";
import {
  Activity, Search, RefreshCw, Star, Globe, AlertCircle,
  TrendingUp, TrendingDown, Wallet, Coins, BarChart3,
  ArrowUpRight, ArrowDownRight, LayoutGrid, SlidersHorizontal,
  Clock3, ChevronDown, X, Menu,
} from "lucide-react";
import "./style.css";

const API = "https://api.coingecko.com/api/v3";

const sampleCoins = [
  { id:"bitcoin", name:"Bitcoin", symbol:"btc", current_price:67240, price_change_percentage_24h:2.84, market_cap:1320000000000, total_volume:28000000000, image:"", sparkline_in_7d:{price:[62000,63100,62800,65000,64100,66300,67240]} },
  { id:"ethereum", name:"Ethereum", symbol:"eth", current_price:3480, price_change_percentage_24h:1.63, market_cap:418000000000, total_volume:14000000000, image:"", sparkline_in_7d:{price:[3200,3250,3190,3320,3370,3410,3480]} },
  { id:"solana", name:"Solana", symbol:"sol", current_price:158.2, price_change_percentage_24h:-0.72, market_cap:71000000000, total_volume:2200000000, image:"", sparkline_in_7d:{price:[165,162,164,159,160,157,158]} },
  { id:"binancecoin", name:"BNB", symbol:"bnb", current_price:590.4, price_change_percentage_24h:0.92, market_cap:86000000000, total_volume:1500000000, image:"", sparkline_in_7d:{price:[570,578,575,584,581,587,590]} },
  { id:"ripple", name:"XRP", symbol:"xrp", current_price:0.62, price_change_percentage_24h:3.21, market_cap:34000000000, total_volume:1100000000, image:"", sparkline_in_7d:{price:[0.57,0.58,0.56,0.59,0.6,0.61,0.62]} },
  { id:"dogecoin", name:"Dogecoin", symbol:"doge", current_price:0.14, price_change_percentage_24h:-1.18, market_cap:20000000000, total_volume:600000000, image:"", sparkline_in_7d:{price:[0.15,0.148,0.146,0.145,0.143,0.142,0.14]} },
];

const money = (value, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: value < 1 ? 5 : 2,
    notation: Math.abs(value) >= 1e9 ? "compact" : "standard",
  }).format(value || 0);

const compact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value || 0);

const periods = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

function App() {
  const [coins, setCoins] = useState(sampleCoins);
  const [source, setSource] = useState("sample");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("market_cap_desc");
  const [period, setPeriod] = useState(7);
  const [selected, setSelected] = useState("bitcoin");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [page, setPage] = useState("overview");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [watch, setWatch] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("coinpulse-watch") || "[]");
    } catch {
      return [];
    }
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API}/coins/markets`, {
        params: {
          vs_currency: currency,
          order: sort,
          per_page: 50,
          page: 1,
          sparkline: true,
          price_change_percentage: "24h",
        },
        timeout: 15000,
      });

      if (!Array.isArray(response.data) || !response.data.length) {
        throw new Error("No market data received.");
      }

      setCoins(response.data);
      setSource("live");
      setUpdated(new Date());
    } catch {
      setCoins(sampleCoins);
      setSource("sample");
      setUpdated(new Date());
      setError("Live market data is temporarily unavailable. Sample data is displayed.");
    } finally {
      setLoading(false);
    }
  }, [currency, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    localStorage.setItem("coinpulse-watch", JSON.stringify(watch));
  }, [watch]);

  const active = coins.find((coin) => coin.id === selected) || coins[0];

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      setHistoryLoading(true);

      try {
        const response = await axios.get(
          `${API}/coins/${selected}/market_chart`,
          {
            params: { vs_currency: currency, days: period },
            timeout: 15000,
          }
        );

        if (!cancelled) {
         
setHistory(
  response.data.prices.map(([timestamp, price]) => ({
    time: new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(period === 1
        ? {
            hour: "numeric",
            minute: "2-digit",
          }
        : {}),
    }),
    price,
  }))
);

        }
      } catch {
        if (!cancelled) {
          const coin = coins.find((item) => item.id === selected) || sampleCoins[0];
          setHistory(
            (coin.sparkline_in_7d?.price || []).map((price, index) => ({
              time: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"][index],
              price,
            }))
          );
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [selected, currency, period, coins]);

  const filteredCoins = useMemo(() => {
    let result = coins.filter((coin) =>
      `${coin.name} ${coin.symbol}`.toLowerCase().includes(query.toLowerCase())
    );

    if (filter === "gainers") {
      result = result.filter((coin) => coin.price_change_percentage_24h > 0);
    } else if (filter === "losers") {
      result = result.filter((coin) => coin.price_change_percentage_24h < 0);
    } else if (filter === "watchlist") {
      result = result.filter((coin) => watch.includes(coin.id));
    }

    return result;
  }, [coins, query, filter, watch]);

  const gainers = coins.filter((coin) => coin.price_change_percentage_24h > 0).length;
  const losers = coins.filter((coin) => coin.price_change_percentage_24h < 0).length;
  const watchCoins = coins.filter((coin) => watch.includes(coin.id));
  const marketCap = coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);

  function toggleWatch(id) {
    setWatch((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function navigate(nextPage) {
    setPage(nextPage);
    setMobileMenu(false);
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="app" id="top">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <a className="brand" href="#top" onClick={() => navigate("overview")}>
          <span className="brand-icon"><Activity size={22} /></span>
          <span>Coin<span className="gold">Pulse</span><small>MARKET TERMINAL</small></span>
        </a>

        <div className="side-label">WORKSPACE</div>
        <button className={`side-link ${page === "overview" ? "side-active" : ""}`} onClick={() => navigate("overview")}>
          <LayoutGrid size={18} /> Overview
        </button>
        <button className={`side-link ${page === "markets" ? "side-active" : ""}`} onClick={() => navigate("markets")}>
          <BarChart3 size={18} /> Markets
        </button>
        <button className={`side-link ${page === "watchlist" ? "side-active" : ""}`} onClick={() => navigate("watchlist")}>
          <Star size={18} /> Watchlist <span className="side-count">{watch.length}</span>
        </button>

        <div className="side-label">PREFERENCES</div>
        <label className="currency-label" htmlFor="currency">Display currency</label>
        <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="usd">USD — US Dollar</option>
          <option value="pkr">PKR — Pakistani Rupee</option>
          <option value="eur">EUR — Euro</option>
          <option value="gbp">GBP — British Pound</option>
        </select>

        <div className="sidebar-bottom">
          <div className="api-indicator">
            <span className={`live-dot ${source === "sample" ? "dot-muted" : ""}`} />
            <div><b>{source === "live" ? "API connected" : "Sample mode"}</b><small>{source === "live" ? "Market feed available" : "Illustrative prices"}</small></div>
          </div>
          <p>CoinPulse v2.0 · Educational project</p>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">
            {mobileMenu ? <X size={21} /> : <Menu size={21} />}
          </button>
          <div className="breadcrumb">Workspace <span>/</span> <b>{page === "overview" ? "Overview" : page === "markets" ? "Markets" : "Watchlist"}</b></div>
          <div className="topbar-right">
            <span className="market-status"><span className="live-dot" /> {source === "live" ? "LIVE DATA" : "SAMPLE DATA"}</span>
            <button className="icon-button" onClick={load} disabled={loading} title="Refresh market data">
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
            <div className="avatar">CP</div>
          </div>
        </header>

        <main className="dashboard">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><Globe size={14} /> CRYPTO MARKET INTELLIGENCE</div>
              <h1>{page === "watchlist" ? "Your watchlist." : page === "markets" ? "Market explorer." : "Market overview."}</h1>
              <p>Track the market. Follow your assets. Make informed observations.</p>
            </div>
            <button className="primary-button" onClick={load} disabled={loading}>
              <RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </section>

          {error && <div className="notice"><AlertCircle size={17} />{error}</div>}

          <section className="metric-grid">
            <article className="metric-card">
              <div className="metric-top"><span>Tracked assets</span><span className="metric-icon"><Coins size={19} /></span></div>
              <strong>{coins.length}</strong>
              <small><span className="gold">●</span> Assets in market feed</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Market cap · loaded assets</span><span className="metric-icon"><Wallet size={19} /></span></div>
              <strong>{money(marketCap, currency)}</strong>
              <small>Combined cap of displayed assets</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>24h gainers</span><span className="metric-icon positive-icon"><TrendingUp size={19} /></span></div>
              <strong>{gainers}</strong>
              <small className="positive-text"><ArrowUpRight size={14} /> Positive movement</small>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>24h losers</span><span className="metric-icon negative-icon"><TrendingDown size={19} /></span></div>
              <strong>{losers}</strong>
              <small className="negative-text"><ArrowDownRight size={14} /> Negative movement</small>
            </article>
          </section>

          {page === "overview" && (
            <section className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">PRICE PERFORMANCE</div>
                  <h2>{active?.name || "Bitcoin"} <span className="muted">/ price history</span></h2>
                </div>
                <div className="period-tabs">
                  {periods.map((item) => (
                    <button key={item.days} className={period === item.days ? "period-active" : ""} onClick={() => setPeriod(item.days)}>{item.label}</button>
                  ))}
                </div>
              </div>

              <div className="chart-summary">
                <strong>{money(active?.current_price, currency)}</strong>
                <span className={active?.price_change_percentage_24h >= 0 ? "positive-text" : "negative-text"}>
                  {active?.price_change_percentage_24h >= 0 ? "+" : ""}{Number(active?.price_change_percentage_24h || 0).toFixed(2)}% <small>24h</small>
                </span>
              </div>

              <div className="chart-container">
                {historyLoading && <span className="chart-loading">Updating chart…</span>}
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history} margin={{ top: 12, right: 12, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffd84d" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#ffd84d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#292929" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: "#858585", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={30} />
                    <YAxis tick={{ fill: "#858585", fontSize: 11 }} axisLine={false} tickLine={false} width={76} domain={["auto", "auto"]} tickFormatter={(value) => compact(value)} />
                    <Tooltip contentStyle={{ background: "#171717", border: "1px solid #444", borderRadius: 10, color: "#fff" }} formatter={(value) => [money(value, currency), "Price"]} />
                    <Area type="monotone" dataKey="price" stroke="#ffd84d" strokeWidth={2.5} fill="url(#goldFill)" activeDot={{ r: 5, fill: "#ffd84d", stroke: "#111", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-footer"><span><Clock3 size={14} /> {period}-day view</span><span>Selected asset: <b>{active?.symbol?.toUpperCase()}</b></span></div>
            </section>
          )}

          <section className="panel market-panel">
            <div className="panel-heading market-heading">
              <div>
                <div className="eyebrow">{page === "watchlist" ? "SAVED ASSETS" : "MARKET DATA"}</div>
                <h2>{page === "watchlist" ? "Your watchlist" : "Cryptocurrency markets"}</h2>
                <p className="panel-description">Select an asset to explore its price history.</p>
              </div>
              <div className="market-total"><span className="live-dot" /> {filteredCoins.length} assets</div>
            </div>

            <div className="table-tools">
              <div className="searchbox"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets…" /><kbd>/</kbd></div>
              <div className="filter-control"><SlidersHorizontal size={16} /><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter assets"><option value="all">All assets</option><option value="gainers">Gainers</option><option value="losers">Losers</option><option value="watchlist">Watchlist</option></select><ChevronDown size={14} /></div>
              <div className="filter-control"><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort market"><option value="market_cap_desc">Market cap ↓</option><option value="volume_desc">Volume ↓</option><option value="price_change_percentage_24h_desc">Top gainers</option><option value="price_change_percentage_24h_asc">Top losers</option></select><ChevronDown size={14} /></div>
            </div>

            <div className="table-scroll">
              <table className="market-table">
                <thead><tr><th># / ASSET</th><th>PRICE</th><th>24H CHANGE</th><th>24H VOLUME</th><th>MARKET CAP</th><th>WATCH</th></tr></thead>
                <tbody>
                  {filteredCoins.filter((coin) => page !== "watchlist" || watch.includes(coin.id)).map((coin, index) => (
                    <tr key={coin.id} onClick={() => { setSelected(coin.id); setPage("overview"); }} className={selected === coin.id ? "row-selected" : ""}>
                      <td><div className="coin-cell"><span className="rank">{index + 1}</span><div className="coin-icon">{coin.image ? <img src={coin.image} alt="" /> : coin.symbol.slice(0, 1).toUpperCase()}</div><div className="coin-details"><b>{coin.name}</b><span>{coin.symbol.toUpperCase()}</span></div></div></td>
                      <td className="price-cell">{money(coin.current_price, currency)}</td>
                      <td><span className={`change-pill ${coin.price_change_percentage_24h >= 0 ? "change-up" : "change-down"}`}>{coin.price_change_percentage_24h >= 0 ? "+" : ""}{Number(coin.price_change_percentage_24h || 0).toFixed(2)}%</span></td>
                      <td>{money(coin.total_volume || 0, currency)}</td>
                      <td>{money(coin.market_cap || 0, currency)}</td>
                      <td><button className={`star-button ${watch.includes(coin.id) ? "star-on" : ""}`} onClick={(event) => { event.stopPropagation(); toggleWatch(coin.id); }} aria-label="Toggle watchlist"><Star size={17} fill={watch.includes(coin.id) ? "currentColor" : "none"} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCoins.filter((coin) => page !== "watchlist" || watch.includes(coin.id)).length === 0 && <div className="empty-state"><Star size={25} /><b>No assets found</b><span>Try another search or add coins to your watchlist.</span></div>}
            </div>
            <div className="table-footer"><span>Market data is informational and may be delayed.</span><span>Last updated: {updated ? updated.toLocaleTimeString() : "Waiting…"}</span></div>
          </section>

          <section className="bottom-grid">
            <article className="panel insight-panel">
              <div className="eyebrow">MARKET SNAPSHOT</div>
              <h3>Today's market breadth</h3>
              <p>Positive versus negative 24-hour movements among loaded assets.</p>
              <div className="breadth-bar"><span style={{ width: `${coins.length ? gainers / coins.length * 100 : 0}%` }} /></div>
              <div className="breadth-legend"><span className="positive-text">● {gainers} gainers</span><span className="negative-text">● {losers} losers</span></div>
            </article>
            <article className="panel insight-panel">
              <div className="eyebrow">QUICK ACCESS</div>
              <h3>Starred assets</h3>
              <p>Your saved assets are stored locally in this browser.</p>
              <button className="secondary-button" onClick={() => navigate("watchlist")}><Star size={16} /> Open watchlist <ArrowUpRight size={15} /></button>
            </article>
          </section>

          <footer className="footer"><div><b>Coin<span className="gold">Pulse</span></b><span>Market intelligence dashboard</span></div><p>Educational project · Not financial advice · No trading functionality</p></footer>
        </main>
      </div>
    </div>
  );
}

export default App;
