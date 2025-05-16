const { promises: fs } = require('fs');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Valid Hercules flags and presets
const validFlags = [
    '-cf', '--control_flow',
    '-se', '--string_encoding',
    '-vr', '--variable_renaming',
    '-gci', '--garbage_code',
    '-opi', '--opaque_preds',
    '-be', '--bytecode_encoder',
    '-st', '--string_to_expr',
    '-vm', '--virtual_machine',
    '-wif', '--wrap_in_func',
    '-fi', '--func_inlining',
    '-dc', '--dynamic_code',
    '-c', '--compressor',
    '-at', '--antitamper'
];
const validPresets = ['--min', '--mid', '--max'];

// Vercel serverless function
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse FormData
        const inputCode = req.files?.luafile?.data.toString('utf8') || req.body.code;
        if (!inputCode) {
            return res.status(400).json({ error: 'No Lua code or file provided' });
        }

        // Validate preset or flags
        const preset = req.body.preset || '';
        let flags = [];
        if (preset === 'custom') {
            try {
                flags = JSON.parse(req.body.flags || '[]');
                if (!Array.isArray(flags) || flags.some(f => !validFlags.includes(f))) {
                    return res.status(400).json({ error: 'Invalid flags provided' });
                }
            } catch {
                return res.status(400).json({ error: 'Invalid flags format' });
            }
        } else if (preset && !validPresets.includes(preset)) {
            return res.status(400).json({ error: 'Invalid preset provided' });
        }

        // Create temp directory
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        // Generate unique filenames
        const uniqueId = Date.now() + Math.random().toString(36).substring(2);
        const inputFile = path.join(tempDir, `input_${uniqueId}.lua`);
        const outputFile = path.join(tempDir, `output_${uniqueId}.lua`);

        // Write input code
        await fs.writeFile(inputFile, inputCode);

        // Construct Hercules command
        const args = preset && preset !== 'custom' ? preset : flags.join(' ');
        const command = `lua hercules-obfuscator-main/src/hercules.lua ${args} --sanity -i ${inputFile} -o ${outputFile}`;

        // Execute Hercules
        try {
            await execPromise(command, { env: { ...process.env, LUA_PATH: 'hercules-obfuscator-main/modules/?.lua' } });
        } catch (err) {
            return res.status(500).json({ error: 'Obfuscation failed', details: err.message });
        }

        // Read output
        let obfuscatedCode;
        try {
            obfuscatedCode = await fs.readFile(outputFile, 'utf8');
        } catch (err) {
            return res.status(500).json({ error: 'Failed to read obfuscated output', details: err.message });
        }

        // Clean up
        await Promise.all([
            fs.unlink(inputFile).catch(() => {}),
            fs.unlink(outputFile).catch(() => {})
        ]);

        res.status(200).json({ obfuscated: obfuscatedCode });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
