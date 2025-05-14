const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Simulated obfuscation mapping (to be replaced with Pastebin content)
let obfuscationMap = {
  'a': 'xX', 'b': 'yY', 'c': 'zZ', 'p': 'qQ', 'r': 'sS', 'i': 'tT', 'n': 'uU', 't': 'vV'
  // Add more mappings as needed
};

// Fetch and parse the Pastebin mapping
async function loadMapping() {
  try {
    const response = await axios.get('https://pastebin.com/raw/qt4H9EQM');
    // Assuming the Pastebin content is a Lua table like { ["a"] = "xX", ["b"] = "yY" }
    // Simplified parsing (use luaparse for real Lua tables)
    const luaTable = response.data;
    const cleaned = luaTable
      .replace(/\s*\[\s*"(.*?)"\s*\]\s*=\s*"(.*?)"\s*/g, '"$1": "$2"')
      .replace(/{/, '{')
      .replace(/}/, '}');
    obfuscationMap = JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to load mapping:', error);
  }
}

// Load mapping on startup
loadMapping();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Obfuscation endpoint
app.post('/obfuscate', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  // Simple character substitution
  let obfuscatedCode = '';
  for (let char of code) {
    obfuscatedCode += obfuscationMap[char] || char;
  }

  res.json({ obfuscated: obfuscatedCode });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
