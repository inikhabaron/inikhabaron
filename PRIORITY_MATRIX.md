# KhabarON: Quick Reference & Priority Matrix

---

## Priority Matrix: Impact vs Effort

```
         HIGH IMPACT
              ↑
              │  [1] NO INDEXES ✅ FIXED (auto-init on DB connect)
              │  [2] PLAIN TEXT PASSWORDS ✅ FIXED
              │  [3] FORGEABLE TOKENS ✅ FIXED
              │  
    QUICK WINS→ [4] WIDE OPEN CORS ✅ FIXED
              │  [5] NO VALIDATION ✅ FIXED
              │  [6] NO RATE LIMITING ✅ FIXED
              │  
              │  [7] BROKEN PUBLISHING ✅ FIXED
              │  [10] N+1 QUERIES ✅ OK
              │  [11] NO CACHING ✅ FIXED
              │  
              │  [8] NO CONNECTION POOL ✅ FIXED
              │  [9] NO ERROR BOUNDARIES ✅ FIXED
              │  
              │  [12] IMAGE OPTIMIZATION ✅ FIXED
              │  [14] UNNECESSARY RERENDERS ✅ FIXED
              │
              │  [13] DATABASE TYPO ✅ FIXED
              │  [15] NO LAZY LOADING ✅ FIXED
              │  [16] EXPOSED CREDENTIALS ✅ FIXED
              │  [19] MISSING/UNSET ENV VARS ✅ (added .env.example; set at runtime)
              │  [20] TODO CONFIGS (Cloudinary/Firebase) ✅ (warnings added; configure env)
              │  [21] NPM AUDIT VULNERABILITIES ⚠️ (31 remaining; safe axios patch applied)
              │  [22] EXCESSIVE CONSOLE LOGS ✅ FIXED (replaced with `lib/logger`)
              │  [17] FONT LOADING ✅ FIXED
              │  [18] MARQUEE LEAK ✅ FIXED
              │
              └──────────────────────────→ EFFORT
                      LOW      HIGH

✅ = FIXED | ⚠️ = Action required (e.g., run init) | ★ = Hours to fix
```
