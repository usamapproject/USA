export default async function handler(req, res) {
    // Basic CORS for cross-origin calls from a static page
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { steamid } = req.query;
    if (!steamid) {
        return res.status(400).json({ error: 'Missing steamid' });
    }

    // Quick format validation for SteamID64 (17 digits)
    if (!/^\d{17}$/.test(String(steamid))) {
        return res.status(400).json({ error: 'Invalid steamid format. Expect 17-digit SteamID64.' });
    }

    const apiKey = process.env.STEAM_API_KEY; // stored on Vercel
    if (!apiKey) {
        return res.status(500).json({ error: 'Server misconfiguration: STEAM_API_KEY is missing' });
    }

    // Limit payload by filtering to the ATS app id only
    const params = new URLSearchParams({
        key: apiKey,
        steamid: String(steamid),
        include_appinfo: 'false',
        include_played_free_games: 'true',
        // IPlayerService supports appids_filter[0]=<id>
        // We add it via append to preserve bracket notation
    });
    params.append('appids_filter[0]', '270880');

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${params.toString()}`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            return res.status(502).json({ error: 'Steam API request failed', status: response.status });
        }

        const data = await response.json();

        const games = data?.response?.games || [];
        const gameCount = data?.response?.game_count || games.length;

        // With filter, having any game means ATS is owned; keep a direct check too
        const ownsATS = gameCount > 0 || games.some((game) => game.appid === 270880);

        return res.status(200).json({ ownsATS: Boolean(ownsATS) });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch from Steam API' });
    }
}
