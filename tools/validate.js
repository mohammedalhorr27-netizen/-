#!/usr/bin/env node
// يتحقق من صحة ملفات بيانات المشجرة: node tools/validate.js docs/data/part-a.js [...]
// بدون وسائط: يتحقق من كل ملفات docs/data/*.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const NODE_KEYS = new Set(["id", "t", "d", "m", "c", "r", "sh", "n", "k"]);
const SH_KEYS = new Set(["x", "h", "s", "ref", "w"]);
const SH_TYPES = new Set(["q", "h", "p", "m", "a"]);
const STR_ARRAYS = ["c", "r", "n"];

let files = process.argv.slice(2);
if (!files.length) {
  const dir = path.join(__dirname, "..", "docs", "data");
  files = fs.readdirSync(dir).filter(f => /^part-.*\.js$/.test(f)).sort().map(f => path.join(dir, f));
}

let totalErrors = 0;
const allIds = new Map();

for (const file of files) {
  const errors = [];
  const chapters = [];
  const ctx = { QATR_ADD: arr => { if (!Array.isArray(arr)) errors.push("QATR_ADD expects an array"); else chapters.push(...arr); } };
  try {
    vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  } catch (e) {
    console.log(`✗ ${file}\n  JS error: ${e.message}`);
    totalErrors++;
    continue;
  }
  let nodes = 0, leaves = 0, shs = 0;

  const walk = (node, trail, depth) => {
    nodes++;
    const where = [...trail, node && node.t ? node.t : "?"].join(" › ");
    if (!node || typeof node !== "object") { errors.push(`${where}: node is not an object`); return; }
    for (const k of Object.keys(node)) if (!NODE_KEYS.has(k)) errors.push(`${where}: unknown key "${k}"`);
    if (typeof node.t !== "string" || !node.t.trim()) errors.push(`${where}: missing title "t"`);
    if (depth === 0) {
      if (typeof node.id !== "string" || !/^[a-z0-9-]+$/.test(node.id)) errors.push(`${where}: chapter needs id matching [a-z0-9-]+`);
      else if (allIds.has(node.id)) errors.push(`${where}: duplicate id "${node.id}" (also in ${allIds.get(node.id)})`);
      else allIds.set(node.id, file);
    }
    for (const k of ["d", "m"]) if (k in node && (typeof node[k] !== "string" || !node[k].trim())) errors.push(`${where}: "${k}" must be a non-empty string`);
    for (const k of STR_ARRAYS) {
      if (!(k in node)) continue;
      if (!Array.isArray(node[k]) || !node[k].length || node[k].some(s => typeof s !== "string" || !s.trim()))
        errors.push(`${where}: "${k}" must be a non-empty array of strings`);
    }
    if ("sh" in node) {
      if (!Array.isArray(node.sh) || !node.sh.length) errors.push(`${where}: "sh" must be a non-empty array`);
      else node.sh.forEach((s, i) => {
        shs++;
        const sw = `${where} › شاهد ${i + 1}`;
        if (!s || typeof s !== "object") { errors.push(`${sw}: not an object`); return; }
        for (const k of Object.keys(s)) if (!SH_KEYS.has(k)) errors.push(`${sw}: unknown key "${k}"`);
        if (typeof s.x !== "string" || !s.x.trim()) errors.push(`${sw}: missing text "x"`);
        if (!SH_TYPES.has(s.s)) errors.push(`${sw}: "s" must be one of q,h,p,m,a`);
        if (s.s === "q" && !s.ref) errors.push(`${sw}: Quran shahid needs "ref" (السورة: رقم الآية)`);
        if ("w" in s && (typeof s.w !== "string" || !s.w.trim())) errors.push(`${sw}: "w" must be a non-empty string`);
        if ("h" in s) {
          const hs = Array.isArray(s.h) ? s.h : [s.h];
          for (const h of hs) {
            if (typeof h !== "string" || !h) errors.push(`${sw}: bad highlight`);
            else if (typeof s.x === "string" && !s.x.includes(h)) errors.push(`${sw}: highlight «${h}» not found verbatim in «${s.x}»`);
          }
        }
      });
    }
    if ("k" in node) {
      if (!Array.isArray(node.k) || !node.k.length) errors.push(`${where}: "k" must be a non-empty array`);
      else node.k.forEach(ch => walk(ch, [...trail, node.t], depth + 1));
    } else {
      leaves++;
      if (!node.sh) errors.push(`${where}: leaf node has no شاهد (sh)`);
    }
  };
  chapters.forEach(ch => walk(ch, [], 0));

  if (errors.length) {
    console.log(`✗ ${file}: ${errors.length} error(s)`);
    errors.forEach(e => console.log("  - " + e));
    totalErrors += errors.length;
  } else {
    console.log(`✓ ${path.basename(file)}: ${chapters.length} chapters, ${nodes} nodes, ${leaves} leaves, ${shs} shawahid`);
  }
}
process.exit(totalErrors ? 1 : 0);
