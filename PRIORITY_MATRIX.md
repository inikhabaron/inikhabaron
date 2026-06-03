# KhabarON: Quick Reference & Priority Matrix

---

## Priority Matrix: Impact vs Effort

```
         HIGH IMPACT
              ↑
              │  [1] NO INDEXES ✅ FIXED
              │  [2] PLAIN TEXT PASSWORDS ✅ FIXED
              │  [3] FORGEABLE TOKENS ✅ FIXED
              │  
    QUICK WINS→ [4] WIDE OPEN CORS ✅ FIXED
              │  [5] NO VALIDATION ✅ FIXED
              │  [6] NO RATE LIMITING ✅ FIXED
              │  
              │  [7] BROKEN PUBLISHING ✅ FIXED
              │  [10] N+1 QUERIES ★★★☆☆
              │  [11] NO CACHING ★★★☆☆
              │  
              │  [8] NO CONNECTION POOL ✅ FIXED
              │  [9] NO ERROR BOUNDARIES ★★★☆☆
              │  
              │  [12] IMAGE OPTIMIZATION ★★★★☆
              │  [14] UNNECESSARY RERENDERS ★★★★☆
              │
              │  [13] DATABASE TYPO ★★☆☆☆
              │  [15] NO LAZY LOADING ★★★★☆
              │  [16] EXPOSED CREDENTIALS ✅ FIXED
              │  [17] FONT LOADING ★★☆☆☆
              │  [18] MARQUEE LEAK ★★☆☆☆
              │
              └──────────────────────────→ EFFORT
                      LOW      HIGH

✅ = FIXED | ★ = Hours to fix
