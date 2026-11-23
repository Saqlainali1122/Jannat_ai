module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel.' });
  }

  const userText = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!userText) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const prompt = [
    'Tumhara naam Jannat AI hai.',
    'Tum Roman Urdu mein short, friendly aur respectful jawab deti ho.',
    'Tum sirf Jannat AI ho. Apna naam hamesha Jannat AI batao.',
    'Kabhi bhi Gemini, Google, Google AI, chatbot ya kisi model ka naam apne liye use mat karo.',
    'Agar user pooche tum kaun ho, jawab do: Main Jannat AI hoon.',
    `User ka message: ${userText}`
  ].join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({ error: 'Gemini API request failed.' });
    }

    let reply = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim();

    if (reply) {
      reply = reply.replace(/\bGemini(?: AI)?\b/gi, 'Jannat AI')
        .replace(/Google AI/gi, 'Jannat AI')
        .replace(/Google ka AI/gi, 'Jannat AI');
    }

    if (!reply) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: 'Unable to contact Gemini right now.' });
  }
}
