const express = require('express');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.use(fileUpload());

app.post('/obfuscate', (req, res) => {
  const inputCode = req.files?.luafile;
  if (!inputCode) return res.status(400).send("No file uploaded.");

  const inputPath = './temp_input.lua';
  const outputPath = './temp_output.lua';

  fs.writeFileSync(inputPath, inputCode.data.toString());

  exec(`lua obfuscator.lua ${inputPath} ${outputPath}`, (err) => {
    if (err) return res.status(500).send("Obfuscation failed.");

    const obfuscated = fs.readFileSync(outputPath, 'utf8');
    res.send(obfuscated);
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
