#!/usr/bin/env node
import { createHash } from 'node:crypto';
const key = process.argv[2];
if (!key) { console.error('Usage: npm run dev-key -- "key"'); process.exit(1); }
console.log(createHash('sha256').update(key.trim().toLowerCase()).digest('hex'));
