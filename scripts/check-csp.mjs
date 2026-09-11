import assert from "node:assert/strict";

// Run against `pnpm build && pnpm start` to test the real rendered response,
// including routes that would otherwise be statically generated.
const base = process.env.SIGNALFORGE_BASE_URL ?? "http://localhost:3000";
const routes = ["/", "/presets", "/strategy/new", "/strategy/btc-mean-rev", "/s/btc-mean-rev"];
const seen = new Set();

for (const route of routes) {
  for (let run = 0; run < 2; run++) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200, `${route}: HTTP status`);
    const csp = response.headers.get("content-security-policy") ?? "";
    const scriptPolicy = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1] ?? "";
    const nonce = scriptPolicy.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, `${route}: CSP needs a nonce`);
    assert.ok(!seen.has(nonce), `${route}: nonce must change on every response`);
    seen.add(nonce);
    assert.ok(!scriptPolicy.includes("'unsafe-inline'"), `${route}: no blanket inline script permission`);
    assert.ok(!scriptPolicy.includes("'unsafe-eval'"), `${route}: no eval in production`);
    assert.ok(csp.includes("frame-ancestors 'none'"), `${route}: framing denied`);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    const inlineScripts = scripts.filter(([, attrs, body]) => !/\bsrc=/.test(attrs) && body.trim());
    assert.ok(inlineScripts.length > 0, `${route}: exercise Next.js inline bootstrap`);
    for (const [, attrs] of inlineScripts) {
      assert.ok(attrs.includes(`nonce="${nonce}"`), `${route}: inline bootstrap must match response nonce`);
    }
  }
  console.log(`PASS ${route}: fresh CSP nonce matches rendered inline scripts`);
}
