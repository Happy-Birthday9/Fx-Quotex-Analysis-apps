# Quotex AI Signal Terminal — GitHub Pages PWA

এই প্রজেক্টটি আপনার দেওয়া ছবির ধারণা অনুসারে একটি mobile-first trading dashboard UI:
- বাম/মূল অংশে candle chart
- market selector: OTC + real-market style list
- 1M / 5M / 15M timeframe
- running candle countdown
- next-candle time
- SIGNAL ACTIVE → UP/DOWN demo analysis
- running candle signal entry হিসেবে ব্যবহার করা হয় না
- voice / text assistant
- PWA Install App button
- GitHub Pages compatible static files

## খুব গুরুত্বপূর্ণ: live market data
এই zip-এ chart/candles **demo/local simulation** হিসেবে চলছে। GitHub Pages একা থেকে Quotex-এর private/live candle feed নিরাপদভাবে নেওয়া যায় না। Real-time price/candles দরকার হলে বৈধ market-data provider বা আপনার নিজের backend adapter লাগবে।

## OpenAI API
`app-config.js`-এ **real API key রাখবেন না**। GitHub Pages-এ রাখা key সবাই দেখতে পারে এবং চুরি হতে পারে।

Frontend-এ এই proxy configuration রাখা আছে:

```js
window.APP_CONFIG = {
  OPENAI_PROXY_URL: "https://YOUR-DOMAIN/api/chat",
  OPENAI_MODEL: "gpt-5.6-mini"
};
```

আপনার server/serverless endpoint `/api/chat` OpenAI API-তে request পাঠাবে। পরে আপনি চাইলে আলাদা code/backend project-এ API key রাখবেন।

## GitHub Pages চালানো
1. এই zip extract করুন।
2. সব file একটি GitHub repository-র root-এ upload করুন।
3. Repository → Settings → Pages → Deploy from branch → `main` / root select করুন।
4. HTTPS URL-এ site খুলুন।
5. Chrome Android থেকে `Install App` বা browser-এর `Add to Home screen` ব্যবহার করুন।

## Real signal system করতে যা লাগবে
1. Real-time candle/price feed (WebSocket/API)
2. Market symbols-এর provider mapping
3. Server-side signal engine
4. OpenAI backend proxy
5. Timezone/expiry rules
6. Rate limiting + API-key protection
7. Optional user login/database

OpenAI-কে **signal generator হিসেবে একমাত্র source** না বানিয়ে, market-data + deterministic/technical analysis engine-এর উপর AI-কে explanation layer হিসেবে ব্যবহার করা বেশি নিরাপদ।
