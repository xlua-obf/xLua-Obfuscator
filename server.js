const { promises: fs } = require('fs');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const formidable = require('formidable');

const execPromise = util.promisify(exec);

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

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'ok' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = formidable({ multiples: false });
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });

        let inputCode;
        if (files.luafile?.[0]) {
            inputCode = await fs.readFile(files.luafile[0].filepath, 'utf8');
        } else if (fields.code?.[0]) {
            inputCode = fields.code[0];
        } else {
            console.error('No code provided');
            return res.status(400).json({ error: 'No Lua code or file provided' });
        }

        const preset = fields.preset?.[0] || '';
        let flags = [];
        if (preset === 'custom') {
            try {
                flags = JSON.parse(fields.flags?.[0] || '[]');
                if (!Array.isArray(flags) || flags.some(f => !validFlags.includes(f))) {
                    console.error('Invalid flags:', flags);
                    return res.status(400).json({ error: 'Invalid flags provided' });
                }
            } catch (err) {
                console.error('Flags parsing error:', err);
                return res.status(400).json({ error: 'Invalid flags format' });
            }
        } else if (preset && !validPresets.includes(preset)) {
            console.error('Invalid preset:', preset);
            return res.status(400).json({ error: 'Invalid preset provided' });
        }

        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const uniqueId = Date.now() + Math.random().toString(36).substring(2);
        const inputFile = path.join(tempDir, `input_${uniqueId}.lua`);
        const outputFile = path.join(tempDir, `output_${uniqueId}.lua`);

        await fs.writeFile(inputFile, inputCode);

        const args = preset && preset !== 'custom' ? preset : flags.join(' ');
        const command = `hercules-obfuscator-main/src/hercules.lua ${args} --sanity -i ${inputFile} -o ${outputFile}`;

        try {
            console.log('Executing command:', command);
            await execPromise(command, { env: { ...process.env, LUA_PATH: 'hercules-obfuscator-main/modules/?.lua' } });
        } catch (err) {
            console.error('Execution error:', err);
            return res.status(500).json({ error: 'Obfuscation failed', details: err.message });
        }

        let obfuscatedCode;
        try {
            obfuscatedCode = await fs.readFile(outputFile, 'utf8');
        } catch (err) {
            console.error('Output read error:', err);
            return res.status(500).json({ error: 'Failed to read obfuscated output', details: err.message });
        }

        await Promise.all([
            fs.unlink(inputFile).catch(() => {}),
            fs.unlink(outputFile).catch(() => {})
        ]);

        res.status(200).json({ obfuscated: obfuscatedCode });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
