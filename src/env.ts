// src/env.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// This file ensures that the environment variables from the .env file
// at the project root are loaded into the application's process.
// By importing this file into server-side modules (like firebase.ts),
// we guarantee that process.env will have the correct values.

config({ path: resolve(process.cwd(), '.env') });
