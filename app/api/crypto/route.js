import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTCUSDT";

  try {
    
    const chartRes = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=15m&limit=150`
    );
    const chartJson = await chartRes.json();
    
    const formattedChart = chartJson.map(item => ({
      time: new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
    }));

    const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr`);
    const allTickers = await tickerRes.json();
    const filteredTickers = allTickers.filter(t => t.symbol.endsWith("USDT"));

    return NextResponse.json({ tickerData: filteredTickers, chartData: formattedChart });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}