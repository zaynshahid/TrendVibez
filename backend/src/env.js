// This module MUST be imported first in server.js and db.js.
// ES module imports are hoisted, so dotenv.config() placed inline in server.js
// runs AFTER all other imported modules have already initialised —
// meaning JWT_SECRET would be undefined when middleware and routes load.
// Importing this file as the very first import guarantees env vars are set
// before any other module code runs.
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Try loading backend/.env
const backendEnvPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}

// 2. Also try loading root .env if present
const rootEnvPath = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// 3. Fallback to current working directory
dotenv.config();
