const { promises: fs } = require('fs');
const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const Busboy = require('busboy');

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
        log(reqId, 'Parsing FormData with Busboy');
        const fields = {};
        const files = {};
        await new Promise((resolve, reject) => {
            const busboy = Busboy({ headers: req.headers });
            busboy.on('field', (name, value) => {
                fields[name] = value;
                log(reqId, 'Parsed field', { name, value: value.slice(0, 50) });
            });
            busboy.on('file', (name, file, info) => {
                const chunks = [];
                file.on('data', chunk => chunks.push(chunk));
                file.on('end', () => {
                    files[name] = { data: Buffer.concat(chunks), info };
                    log(reqId, 'Parsed file', { name, filename: info.filename, size: files[name].data.length });
                });
            });
            busboy.on('finish', () => {
                log(reqId, 'FormData parsing complete', { fields: Object.keys(fields), files: Object.keys(files) });
                resolve();
            });
            busboy.on('error', err => {
                log(reqId, 'FormData parsing error', { error: err.message });
                reject(err);
            });
            req.pipe(busboy);
        });

        let inputCode;
        if (files.luafile) {
            inputCode = files.luafile.data.toString('utf8');
            log(reqId, 'Received Lua file', { filename: files.luafile.info.filename, length: inputCode.length });
        } else if (fields.code) {
            inputCode = fields.code;
            log(reqId, 'Received Lua code', { length: inputCode.length });
        } else {
            log(reqId, 'No code provided');
            return res.status(400).json({ error: 'No Lua code or file provided' });
        }

        const preset = fields.preset || '';
        let flags = [];
        if (preset === 'custom') {
            try {
                flags = JSON.parse(fields.flags || '[]');
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

        // Mock Hercules execution (replace with Lua when binary added)
        const obfuscatedCode = `-- Mocked output\n${inputCode}\n-- Preset: ${preset}\n-- Flags: ${flags.join(', ')}`;
        log(reqId, 'Mocked obfuscation successful', { outputLength: obfuscatedCode.length });

        /*
        // Uncomment for actual Hercules execution with Lua binary
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        log(reqId, 'Created temp directory', { tempDir });

        const uniqueId = Date.now() + Math.random().toString(36).substring(2);
        const inputFile = path.join(tempDir, `input_${uniqueId}.lua`);
        const outputFile = path.join(tempDir, `output_${uniqueId}.lua`);

        await fs.writeFile(inputFile, inputCode);
        log(reqId, 'Wrote input file', { inputFile });

        const args = preset && preset !== 'custom' ? preset : flags.join(' ');
        const command = `./hercules-obfuscator-main/lua hercules-obfuscator-main/src/hercules.lua ${args} --sanity -i ${inputFile} -o ${outputFile}`;
        log(reqId, 'Executing Hercules', { command });

        try {
            await execPromise(command, { env: { ...process.env, LUA_PATH: './hercules-obfuscator-main/modules/?.lua' } });
            log(reqId, 'Hercules execution successful');
        } catch (err) {
            log(reqId, 'Hercules execution failed', { error: err.message });
            return res.status(500).json({ error: 'Obfuscation failed', details: err.message });
        }

        let obfuscatedCode;
        try {
            obfuscatedCode = await fs.readFile(outputFile, 'utf8');
            log(reqId, 'Read obfuscated output', { outputFile, length: obfuscatedCode.length });
        } catch (err) {
            log(reqId, 'Output read error', { error: err.message });
            return res.status(500).json({ error: 'Failed to read obfuscated output', details: err.message });
        }

        await Promise.all([
            fs.unlink(inputFile).catch(() => log(reqId, 'Failed to delete input file')),
            fs.unlink(outputFile).catch(() => log(reqId, 'Failed to delete output file'))
        ]);
        log(reqId, 'Cleaned up temp files');
        */

        log(reqId, 'Sending response', { status: 200 });
        res.status(200).json({ obfuscated: obfuscatedCode });
    } catch (err) {
        log(reqId, 'Server error', { error: err.message, stack: err.stack });
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
