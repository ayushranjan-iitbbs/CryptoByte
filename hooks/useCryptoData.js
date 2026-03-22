import { useState, useEffect } from "react";

export function useCryptoData(activeSymbol = "BTCUSDT") {
  const [data, setData] = useState({ tickerData: [], chartData: [], loading: true });

  const updateData = async () => {
    try {
      const res = await fetch(`/api/crypto?symbol=${activeSymbol}`);
      const json = await res.json();
      if (!json.error) {
        setData(prev => ({ 
          tickerData: json.tickerData, 
          chartData: json.chartData, 
          loading: false 
        }));
      }
    } catch (err) {
      console.error("Hook Error:", err);
    }
  };

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 10000);
    return () => clearInterval(interval);
  }, [activeSymbol]);  

  return data;
}