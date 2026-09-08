/*
  SAFE CONFIG:
  Do NOT put a real OpenAI API key in this file if the site is public/GitHub Pages.
  Browser code exposes anything shipped to the user.

  Recommended later:
  1) Keep OPENAI_API_KEY on a server/serverless function.
  2) Frontend calls /api/chat.
  3) That server function calls OpenAI.
*/
window.APP_CONFIG = {
  OPENAI_PROXY_URL: "",       // e.g. https://your-domain.example/api/chat
  OPENAI_MODEL: "gpt-5.6-mini",
  DEFAULT_LANGUAGE: "en-US"
};
