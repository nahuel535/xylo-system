import { useEffect, useState } from "react";

const EXCHANGES = ["binance", "lemon", "ripio", "buenbit", "fiwind"];

export function useCriptoYa() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("https://criptoya.com/api/usdt/ars/1");
        const json = await res.json();

        const exchanges = EXCHANGES
          .filter((key) => json[key])
          .map((key) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            ask: json[key].ask,
            bid: json[key].bid,
          }));

        const asks = exchanges.map((e) => e.ask);
        const avg = asks.reduce((a, b) => a + b, 0) / asks.length;

        setData({ exchanges, avg });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, []);

  return { data, loading, error };
}