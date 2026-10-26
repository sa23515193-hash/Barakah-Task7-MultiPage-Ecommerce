import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Search,
  RefreshCw,
  Star,
  Globe,
  AlertCircle,
} from "lucide-react";
import "./style.css";

// Sample market data used when the API is unavailable
const fallback = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    current_price: 67240,
    price_change_percentage_24h: 2.84,
    market_cap: 1320000000000,
    image: "",
    sparkline_in_7d: {
      price: [62000, 63100, 62800, 65000, 64100, 66300, 67240],
    },
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "eth",
    current_price: 3480,
    price_change_percentage_24h: 1.63,
    market_cap: 418000000000,
    image: "",
    sparkline_in_7d: {
      price: [3200, 3250, 3190, 3320, 3370, 3410, 3480],
    },
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "sol",
    current_price: 158.2,
    price_change_percentage_24h: -0.72,
    market_cap: 71000000000,
    image: "",
    sparkline_in_7d: {
      price: [165, 162, 164, 159, 160, 157, 158],
    },
  },
  {
    id: "binancecoin",
    name: "BNB",
    symbol: "bnb",
    current_price: 590.4,
    price_change_percentage_24h: 0.92,
    market_cap: 86000000000,
    image: "",
    sparkline_in_7d: {
      price: [570, 578, 575, 584, 581, 587, 590],
    },
  },
  {
    id: "ripple",
    name: "XRP",
    symbol: "xrp",
    current_price: 0.62,
    price_change_percentage_24h: 3.21,
    market_cap: 34000000000,
    image: "",
    sparkline_in_7d: {
      price: [0.57, 0.58, 0.56, 0.59, 0.6, 0.61, 0.62],
    },
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "doge",
    current_price: 0.14,
    price_change_percentage_24h: -1.18,
    market_cap: 20000000000,
    image: "",
    sparkline_in_7d: {
      price: [0.15, 0.148, 0.146, 0.145, 0.143, 0.142, 0.14],
    },
  },
];

// Format a number as currency
const money = (number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: number < 1 ? 5 : 2,
  }).format(number || 0);

function App() {
  const [coins, setCoins] = useState(fallback);
  const [source, setSource] = useState("sample");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [sort] = useState("market_cap_desc");

  const [watch, setWatch] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("coinpulse-watch") || "[]");
    } catch {
      return [];
    }
  });

  const [selected, setSelected] = useState("bitcoin");
  const [history, setHistory] = useState([]);
  const [updated, setUpdated] = useState(null);

  // Fetch current cryptocurrency market data
  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
          params: {
            vs_currency: currency,
            order: sort,
            per_page: 50,
            page: 1,
            sparkline: true,
            price_change_percentage: "24h",
          },
          timeout: 12000,
        }
      );

      if (!Array.isArray(response.data) || !response.data.length) {
        throw new Error("The API returned no market data.");
      }

      setCoins(response.data);
      setSource("live");
      setUpdated(new Date());
    } catch (e) {
      setError(
        e.response?.status === 429
          ? "The public API rate limit was reached. Showing sample data."
          : "Live market data could not be loaded. Showing sample data."
      );

      setCoins(fallback);
      setSource("sample");
      setUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }

  // Reload market data when the currency changes
  useEffect(() => {
    load();
  }, [currency, sort]);

  // Save watchlist in the current browser
  useEffect(() => {
    localStorage.setItem("coinpulse-watch", JSON.stringify(watch));
  }, [watch]);

  // Load seven-day price history for the selected asset
  useEffect(() => {
    let active = true;

    async function getHistory() {
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${selected}/market_chart`,
          {
            params: {
              vs_currency: currency,
              days: 7,
            },
            timeout: 10000,
          }
        );

        if (active) {
          setHistory(
            response.data.prices.map((point) => ({
              time: new Date(point[0]).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              price: point[1],
            }))
          );
        }
      } catch {
        if (active) {
          const coin = coins.find((item) => item.id === selected) || fallback[0];

          setHistory(
            (coin.sparkline_in_7d?.price || []).map((price, index) => ({
              time: [
                "Day 1",
                "Day 2",
                "Day 3",
                "Day 4",
                "Day 5",
                "Day 6",
                "Today",
              ][index],
              price,
            }))
          );
        }
      }
    }

    getHistory();

    return () => {
      active = false;
    };
  }, [selected, currency]);

  // Search coins by name or symbol
  const filtered = coins.filter((coin) =>
    `${coin.name} ${coin.symbol}`.toLowerCase().includes(q.toLowerCase())
  );

  const active = coins.find((coin) => coin.id === selected) || coins[0];

  // Add or remove a coin from the watchlist
  function toggleWatchlist(id) {
    setWatch((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <div className="app">
      {/* Navigation */}
      <header className="nav">
        <a className="brand" href="#">
          <span className="logo">
            <Activity />
          </span>
          CoinPulse
        </a>

        <nav>
          <a href="#market">Markets</a>
          <a href="#analytics">Analytics</a>
          <a href="#watchlist">Watchlist</a>
        </nav>

        <div className="nav-right">
          <span className="live-dot" />
          {source === "live" ? "Live API" : "Sample mode"}

          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            aria-label="Select currency"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
            <option value="pkr">PKR</option>
          </select>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="eyebrow">
            <Globe size={15} />
            YOUR MARKET, IN FOCUS
          </div>

          <h1>
            Crypto markets.
            <br />
            <span>Clearer by the minute.</span>
          </h1>

          <p>
            Track market movements, explore price history, and keep your
            favourite assets close.
          </p>

          <div className="hero-meta">
            <span className="status-pill">
              <span className="live-dot" />
              {source === "live"
                ? "Connected to public market API"
                : "Sample data mode"}
            </span>

            <span>
              {updated
                ? `Updated ${updated.toLocaleTimeString()}`
                : "Preparing market data…"}
            </span>

            <button
              className="refresh"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={loading ? "spin" : ""}
              />
              Refresh
            </button>
          </div>
        </section>

        {/* API notice */}
        {error && (
          <div className="notice">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Summary statistics */}
        <section className="stats">
          <article className="stat-card">
            <span>Tracked assets</span>
            <strong>{coins.length}</strong>
            <small>Market watch</small>
          </article>

          <article className="stat-card">
            <span>Gainers today</span>
            <strong>
              {coins.filter((coin) => coin.price_change_percentage_24h > 0).length}
            </strong>
            <small className="up">Positive 24h movement</small>
          </article>

          <article className="stat-card">
            <span>Watchlist</span>
            <strong>{watch.length}</strong>
            <small>Saved in this browser</small>
          </article>
        </section>

        {/* Analytics chart */}
        <section className="section" id="analytics">
          <div className="section-head">
            <div>
              <div className="eyebrow">PRICE EXPLORER</div>
              <h2>
                {active?.name || "Bitcoin"}{" "}
                <span className="muted">/ 7-day history</span>
              </h2>
            </div>

            <div className="current-price">
              {money(active?.current_price, currency)}

              <span
                className={
                  active?.price_change_percentage_24h >= 0 ? "up" : "down"
                }
              >
                {active?.price_change_percentage_24h >= 0 ? "+" : ""}
                {Number(
                  active?.price_change_percentage_24h || 0
                ).toFixed(2)}
                %
              </span>
            </div>
          </div>

          <div className="chart-card">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis dataKey="time" tickLine={false} />
                <YAxis domain={["auto", "auto"]} tickLine={false} width={80} />
                <Tooltip formatter={(value) => money(value, currency)} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#ffd600"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="muted small-note">
            Historical chart uses API data when available; fallback sample
            history is illustrative.
          </p>
        </section>

        {/* Market table */}
        <section className="section" id="market">
          <div className="section-head">
            <div>
              <div className="eyebrow">MARKET OVERVIEW</div>
              <h2>Explore assets</h2>
            </div>

            <div className="searchbox">
              <Search size={16} />
              <input
                placeholder="Search coin or symbol…"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Price</th>
                  <th>24h change</th>
                  <th>Market cap</th>
                  <th>Watch</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((coin) => (
                  <tr
                    key={coin.id}
                    onClick={() => setSelected(coin.id)}
                    className={selected === coin.id ? "selected" : ""}
                  >
                    <td>
                      <div className="coin">
                        <div className="coin-icon">
                          {coin.image ? (
                            <img src={coin.image} alt={coin.name} />
                          ) : (
                            coin.symbol.slice(0, 1).toUpperCase()
                          )}
                        </div>

                        <div>
                          <b>{coin.name}</b>
                          <small>{coin.symbol.toUpperCase()}</small>
                        </div>
                      </div>
                    </td>

                    <td>{money(coin.current_price, currency)}</td>

                    <td
                      className={
                        coin.price_change_percentage_24h >= 0 ? "up" : "down"
                      }
                    >
                      {coin.price_change_percentage_24h >= 0 ? "+" : ""}
                      {Number(
                        coin.price_change_percentage_24h || 0
                      ).toFixed(2)}
                      %
                    </td>

                    <td>{money(coin.market_cap, currency)}</td>

                    <td>
                      <button
                        className={`star ${
                          watch.includes(coin.id) ? "starred" : ""
                        }`}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleWatchlist(coin.id);
                        }}
                        aria-label={`Toggle ${coin.name} watchlist`}
                      >
                        <Star
                          size={18}
                          fill={
                            watch.includes(coin.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <p className="empty">No coins match your search.</p>
            )}
          </div>
        </section>

        {/* Watchlist */}
        <section className="section" id="watchlist">
          <div className="eyebrow">YOUR SHORTLIST</div>
          <h2>Watchlist</h2>

          <div className="watch-chips">
            {coins
              .filter((coin) => watch.includes(coin.id))
              .map((coin) => (
                <button
                  key={coin.id}
                  onClick={() => setSelected(coin.id)}
                >
                  {coin.name} · {money(coin.current_price, currency)}
                </button>
              ))}

            {watch.length === 0 && (
              <p className="muted">
                Tap a star in the market table to save an asset here.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <b>CoinPulse</b>
        <span>
          Educational frontend project · Not financial advice · No trading
          functionality
        </span>
      </footer>
    </div>
  );
}

export default App;
