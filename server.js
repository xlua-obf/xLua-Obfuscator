const { promises: fs } = require('fs');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const formidable = require('formidable');

const execPromise = util.promisify(exec);

const validFlags = [
    '-cf', '-se', '-vr', '-gci', '-opi', '-be', '-st', '-vm', '-wif', '-fi', '-dc', '-c', '-at'
];
const validPresets = ['--min', '--mid', '--max'];

const log = (reqId, message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${reqId}] ${message}`, data);
};

module.exports = async (req, res) => {
    const reqId = Math.random().toString(36).substring(2, 10);
    log(reqId, 'Request received', { method: req.method, headers: req.headers });

    if (req.method === 'GET') {
        log(reqId, 'GET /api/server: Health check successful');
        return res.status(200).json({ status: 'ok' });
    }

    if (req.method !== 'POST') {
        log(reqId, 'Invalid method', { method: req.method });
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        log(reqId, 'Parsing FormData with formidable');
        const form = formidable({ multiples: false });
        const { fields, files } = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    log(reqId, 'FormData parsing error', { error: err.message });
                    reject(err);
                } else {
                    log(reqId, 'FormData parsing complete', { fields: Object.keys(fields), files: Object.keys(files) });
                    resolve({ fields, files });
                }
            });
        });

        let inputCode;
        if (files.luafile?.[0]) {
            inputCode = await fs.readFile(files.luafile[0].filepath, 'utf8');
            log(reqId, 'Received Lua file', { filename: files.luafile[0].originalFilename, length: inputCode.length });
        } else if (fields.code?.[0]) {
            inputCode = fields.code[0];
            log(reqId, 'Received Lua code', { length: inputCode.length });
        } else {
            log(reqId, 'No code provided');
            return res.status(400).json({ error: 'No Lua code or file provided' });
        }

        const preset = fields.preset?.[0] || '';
        let flags = [];
        if (preset === 'custom') {
            try {
                flags = JSON.parse(fields.flags?.[0] || '[]');
                if (!Array.isArray(flags) || flags.some(f => !validFlags.includes(f))) {
                    log(reqId, 'Invalid flags', { flags });
                    return res.status(400).json({ error: 'Invalid flags provided' });
                }
            } catch (err) {
                log(reqId, 'Flags parsing error', { error: err.message });
                return res.status(400).json({ error: 'Invalid flags format' });
            }
        } else if (preset && !validPresets.includes(preset)) {
            log(reqId, 'Invalid preset', { preset });
            return res.status(400).json({ error: 'Invalid preset provided' });
        }
        log(reqId, 'Validated options', { preset, flags });

        const obfuscatedCode = `-- Mocked output\n${inputCode}\n-- Preset: ${preset}\n-- Flags: ${flags.join(', ')}`;
        log(reqId, 'Mocked obfuscation successful', { outputLength: obfuscatedCode.length });

        log(reqId, 'Sending response', { status: 200 });
        res.status(200).json({ obfuscated: obfuscatedCode });
    } catch (err) {
        log(reqId, 'Server error', { error: err.message, stack: err.stack });
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
