import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");
    const symbol = searchParams.get("symbol") || "BTCUSDT";

    if (mode === "symbols") {
      const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
      const data = await res.json();
      const symbols = data.symbols
        .filter(s => s.quoteAsset === "USDT" && s.status === "TRADING")
        .map(s => s.symbol);
      return NextResponse.json(symbols);
    }

    const [tickerRes, klinesRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
      fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`)
    ]);

    if (!tickerRes.ok) throw new Error("Symbol not found");
    const tickerData = await tickerRes.json();
    const klinesData = await klinesRes.json();

    const chartData = klinesData.map(item => ({
      time: new Date(item[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(item[4]),
    }));

    return NextResponse.json({ tickerData: [tickerData], chartData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const { symbol, price, change, type, risk } = await req.json();
    
    
    const systemPrompt = `You are an elite crypto strategist. Analyze ${symbol} at $${price} (${change}% 24h). User intent: ${type} position, ${risk} risk. 
    IMPORTANT: Provide concise, text-only responses. No markdown, no bolding (**), and no LaTeX.`;

    const agents = [
      { role: "Technical Analyst", p: "Analyze RSI, MACD, and Liquidity briefly." },
      { role: "Risk Manager", p: "Provide specific SL and Drawdown levels." }
    ];

    const agentResponses = await Promise.all(agents.map(a => 
      generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `${systemPrompt} Role: ${a.role}`,
        prompt: a.p
      })
    ));

     
    const final = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are a Crypto CIO. You must output ONLY a valid JSON object. 
      Do not include any conversational text or markdown code blocks.
      Structure: {"signal": "string", "entry": number, "tp": number, "sl": number, "rr": "string", "confidence": number, "decision": "string"}`,
      prompt: `Synthesize these reports: \n${agentResponses.map(r => r.text).join("\n")}`
    });

     
    const cleanJsonString = final.text.replace(/```json|```/gi, '').trim();
    const parsedDecision = JSON.parse(cleanJsonString);

    return NextResponse.json({
      discussions: agentResponses.map((r, i) => ({ 
        role: agents[i].role, 
        content: r.text.replace(/\*\*|\#|`/g, '')  
      })),
      ...parsedDecision
    });
  } catch (e) { 
    console.error(e);
    return NextResponse.json({ error: "Failed to parse AI response. Try again." }, { status: 500 }); 
  }
}