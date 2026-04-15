import express from 'express'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import Logger from '@/utilities/Logger'

// Reference for GC prevention
let activeServer: any = null

export async function launchSetupServer (port: number = 3000, host: string = '127.0.0.1') {
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.get('/', (req, res) => {
    res.send(getSetupHtml())
  })

  app.post('/setup', (req, res) => {
    const { BOT_TOKEN, DEV_ID, DB_URL } = req.body

    if (!BOT_TOKEN || !DEV_ID) {
      return res.status(400).json({ error: 'BOT_TOKEN and DEV_ID are required' })
    }

    // Load existing config to preserve API_KEY and other values
    const envPath = path.join(process.cwd(), '.env')
    let existingApiKey = ''
    let existingSystemLogs = ''
    let existingLogs = ''

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const apiKeyMatch = content.match(/^API_KEY=(.*)$/m)
      const systemLogsMatch = content.match(/^SYSTEM_LOGS_CHANNEL=(.*)$/m)
      const logsMatch = content.match(/^LOGS_CHANNEL=(.*)$/m)
      
      if (apiKeyMatch) existingApiKey = apiKeyMatch[1].trim()
      if (systemLogsMatch) existingSystemLogs = systemLogsMatch[1].trim()
      if (logsMatch) existingLogs = logsMatch[1].trim()
    }

    const API_KEY = existingApiKey || crypto.randomBytes(32).toString('hex')
    const ALLOWED_ORIGINS = 'https://aometry.finneh.xyz,http://localhost:4321'

    const envContent = [
      '# Bot Configuration',
      `BOT_TOKEN=${BOT_TOKEN}`,
      `DEV_ID=${DEV_ID}`,
      `DB_URL=${DB_URL || ''}`,
      '',
      '# API and Web Management',
      `API_KEY=${API_KEY}`,
      `ALLOWED_ORIGINS=${ALLOWED_ORIGINS}`,
      'WEBUI_PORT=3000',
      '',
      '# Default Logging Channels (Configure via Dashboard later)',
      `SYSTEM_LOGS_CHANNEL=${existingSystemLogs}`,
      `LOGS_CHANNEL=${existingLogs}`
    ].join('\n')

    try {
      fs.writeFileSync(envPath, envContent)
      res.json({ success: true, apiKey: API_KEY })

      Logger.success('Configuration saved to .env!', '💾')
      Logger.info('Aometry Setup Wizard complete. Please restart your container/process.')
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to write .env file' })
    }
  })

  activeServer = app.listen(port, host, () => {
    Logger.line()
    Logger.gradient('🚀 AOMETRY SETUP MODE', ['cyan', 'magenta'])
    Logger.info(`Setup Wizard is ready at http://localhost:${port}`)
    Logger.info('Please visit the URL above to configure your bot.')
    Logger.line()
  })
}

function getSetupHtml () {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aometry | Setup Wizard</title>
    <style>
        :root {
            --bg: #0a0a0b;
            --card-bg: rgba(20, 20, 22, 0.7);
            --accent-violet: #8b5cf6;
            --accent-cyan: #06b6d4;
            --text: #e2e8f0;
            --text-dim: #94a3b8;
        }

        body {
            background-color: var(--bg);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
        }

        /* Animated Background */
        .mesh-gradient {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: 
                radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
            z-index: -1;
        }

        .container {
            width: 100%;
            max-width: 500px;
            padding: 2rem;
            z-index: 1;
        }

        .card {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        h1 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            background: linear-gradient(to right, var(--accent-cyan), var(--accent-violet));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        p.subtitle {
            font-size: 0.875rem;
            color: var(--text-dim);
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        label {
            display: block;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            color: var(--text-dim);
        }

        input {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: white;
            font-size: 0.9375rem;
            box-sizing: border-box;
            transition: all 0.2s;
        }

        input:focus {
            outline: none;
            border-color: var(--accent-violet);
            box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        button {
            width: 100%;
            background: linear-gradient(to right, var(--accent-cyan), var(--accent-violet));
            border: none;
            border-radius: 12px;
            padding: 0.875rem;
            color: white;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 1rem;
        }

        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.4);
        }

        button:active {
            transform: translateY(0);
        }

        .success-screen {
            display: none;
            text-align: center;
        }

        .api-key-container {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 12px;
            padding: 1rem;
            margin: 1.5rem 0;
            font-family: monospace;
            word-break: break-all;
            border: 1px solid var(--accent-cyan);
            color: var(--accent-cyan);
            position: relative;
        }

        .copy-btn {
            background: transparent;
            border: 1px solid var(--accent-cyan);
            color: var(--accent-cyan);
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            margin-top: 0.5rem;
            width: auto;
            display: inline-block;
        }

        .copy-btn:hover {
            background: var(--accent-cyan);
            color: black;
            box-shadow: none;
        }
    </style>
</head>
<body>
    <div class="mesh-gradient"></div>
    <div class="container">
        <div class="card" id="setupCard">
            <h1>Aometry</h1>
            <p class="subtitle">Complete the setup to launch your bot.</p>
            
            <form id="setupForm">
                <div class="form-group">
                    <label>Discord Bot Token</label>
                    <input type="password" id="BOT_TOKEN" placeholder="MTIzNDU2Nzg5MDEyMzQ1Njc4..." required>
                </div>
                <div class="form-group">
                    <label>Developer Discord ID</label>
                    <input type="text" id="DEV_ID" placeholder="125791979689869312" required>
                </div>
                <div class="form-group">
                    <label>Database URL (Optional)</label>
                    <input type="text" id="DB_URL" placeholder="mongodb://localhost:27017/aometry">
                    <p style="font-size: 11px; color: var(--text-dim); margin-top: 4px;">Leave blank to use SQLite (Recommended for starters).</p>
                </div>
                <button type="submit" id="submitBtn">Initialize Bot</button>
            </form>
        </div>

        <div class="card success-screen" id="successCard">
            <h1 style="color: var(--accent-cyan)">Successfully Initialized!</h1>
            <p>Your configuration has been saved. <strong>Please copy your API Key below.</strong> You'll need it to add this instance to your dashboard.</p>
            
            <div class="api-key-container">
                <span id="apiKeyDisplay"></span>
                <br>
                <button class="copy-btn" onclick="copyKey()">Copy to Clipboard</button>
            </div>

            <p style="color: var(--accent-violet); font-weight: 600;">Action Required: Restart your container now.</p>
        </div>
    </div>

    <script>
        const form = document.getElementById('setupForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Initializing...';

            const payload = {
                BOT_TOKEN: document.getElementById('BOT_TOKEN').value,
                DEV_ID: document.getElementById('DEV_ID').value,
                DB_URL: document.getElementById('DB_URL').value
            };

            try {
                const res = await fetch('/setup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('setupCard').style.display = 'none';
                    document.getElementById('successCard').style.display = 'block';
                    document.getElementById('apiKeyDisplay').textContent = data.apiKey;
                } else {
                    alert('Error: ' + data.error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Initialize Bot';
                }
            } catch (err) {
                alert('Connection failed. Is the server still running?');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Initialize Bot';
            }
        };

        function copyKey() {
            const key = document.getElementById('apiKeyDisplay').textContent;
            navigator.clipboard.writeText(key).then(() => {
                alert('API Key copied to clipboard!');
            });
        }
    </script>
</body>
</html>
  `
}
