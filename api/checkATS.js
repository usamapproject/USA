export default async function handler(req, res) {
  // nastavíme CORS pro všechny domény (nebo můžeš omezit jen na github.io)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // když přijde OPTIONS (preflight), odpovíme hned
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { steamid } = req.query;
  if (!steamid) {
    return res.status(400).json({ error: "Missing steamid" });
  }

  const apiKey = process.env.STEAM_API_KEY;
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamid}&include_appinfo=false`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const ownsATS = data.response?.games?.some(
      (game) => game.appid === 270880
    );

    res.status(200).json({ ownsATS: !!ownsATS });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch from Steam API" });
  }
}
