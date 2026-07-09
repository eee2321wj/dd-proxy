module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  var body = req.body;
  body.stream = body.stream !== false;

  var resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.DEEPSEEK_KEY,
    },
    body: JSON.stringify(body),
  });

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (body.stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    var reader = resp.body.getReader();
    try {
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        res.write(chunk.value);
      }
    } finally {
      reader.releaseLock();
      res.end();
    }
    return;
  }

  var data = await resp.json();
  if (!resp.ok) {
    res.status(resp.status).json(data);
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
};
