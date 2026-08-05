// This module MUST be imported first in server.js.
// ES module imports are hoisted, so dotenv.config() placed inline in server.js
// runs AFTER all other imported modules have already initialised —
// meaning JWT_SECRET would be undefined when middleware and routes load.
// Importing this file as the very first import guarantees env vars are set
// before any other module code runs.
import dotenv from 'dotenv';
dotenv.config();
