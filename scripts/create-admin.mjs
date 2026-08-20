#!/usr/bin/env node
/**
 * Creates (or updates the password of) an admin account.
 *
 *   node scripts/create-admin.mjs owner@example.com
 *
 * Prompts for the password with echo off, so it never lands in your shell
 * history. Remember to also add the address to ADMIN_EMAILS in .env.local —
 * a Supabase account on its own grants no admin access.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {
    /* fall back to the ambient environment */
  }
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const onData = (char) => {
      if (["\n", "\r", ""].includes(char.toString("utf8"))) {
        process.stdin.removeListener("data", onData);
      } else {
        process.stdout.write("[2K[200D" + question + "*".repeat(rl.line.length));
      }
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

loadEnv();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const password = await askHidden("Password (min 12 chars): ");
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: existing } = await supabase.auth.admin.listUsers();
const match = existing?.users?.find(
  (user) => user.email?.toLowerCase() === email.toLowerCase(),
);

if (match) {
  const { error } = await supabase.auth.admin.updateUserById(match.id, { password });
  if (error) {
    console.error("Could not update password:", error.message);
    process.exit(1);
  }
  console.log(`Password updated for ${email}`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Could not create user:", error.message);
    process.exit(1);
  }
  console.log(`Created admin user ${email}`);
}

console.log(`\nNext: make sure .env.local contains\n  ADMIN_EMAILS=${email}`);
