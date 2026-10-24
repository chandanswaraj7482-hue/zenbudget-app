# 🚀 ZenBudget — Google Play Store Complete Publishing Kit
> Everything is pre-filled, policy-compliant, and ready to copy-paste into Google Play Console.

---

## 1. Store Listing Details

### App Name (max 30 chars)
```text
ZenBudget: Expense & Budget
```

### Short Description (max 80 chars)
```text
Smart AI expense tracker, daily budget planner, receipt scanner & money manager.
```

### Full Description (Markdown/Text for Play Store)
```text
Take complete control of your daily finances with ZenBudget — the calm, intelligent expense tracker and budget planner designed for effortless money management.

Whether you want to track daily UPI spending, analyze bank expenses, set envelope budgets, or manage shared household expenses with your partner, ZenBudget provides a private, ad-smart, and distraction-free experience.

🌿 KEY FEATURES:

📊 Smart Daily Budgeting & Envelope System
• Calculate your exact Safe Daily Spending Limit automatically.
• Allocate budgets across essentials, dining, bills, shopping, and savings.
• Real-time visual progress bars prevent overspending before month-end.

🧾 Smart AI Receipt & Bill Scanner
• Scan paper bills, invoices, and payment receipts using on-device OCR.
• Automatically extracts vendor names, amounts, and expense categories.
• No manual typing needed.

👥 Couple & Family Shared Sync
• Connect with your partner using a private, encrypted sync code.
• Track shared household expenses, rent, groceries, and split payments.
• Maintain privacy with personal category filters.

💡 AI Money Coach & Spending Insights
• Receive actionable, gentle nudges to curb impulse buying.
• Get smart monthly financial forecasts and habit audits.
• Celebrate savings milestones with interactive reflections.

🔒 Privacy-First & 256-Bit Encryption
• Device-first local data architecture with optional encrypted cloud backup.
• Zero data selling: We never broker or sell your financial data to third parties.
• Biometric Lock (Fingerprint & Face ID) protects your financial vault.
• ZenBudget never accesses, views, or stores your bank passwords or UPI PINs.

⚡ Lightweight, Fast & Works Offline
• Instant 0-second launch speed.
• Log expenses on the go even without an active internet connection.
• Export your transactions to CSV / Excel anytime with one click.

A Product by Something Labs Tech.
Support & Feedback: hello.zenbudget@zohomail.in
Website: https://zenbudget-tracker.vercel.app
```

---

## 2. Graphic Assets (In `playstore_release/listing_assets/`)
* **App Icon (512 x 512 px PNG)**: `playstore_release/listing_assets/app_icon_512x512.png`
* **Feature Graphic (1024 x 500 px PNG)**: `playstore_release/listing_assets/feature_graphic_1024x500.png`
* **Phone Screenshots (4 Ready Screenshots)**:
  1. `screenshot_1_dashboard.jpg` (Smart Dashboard & AI Coach)
  2. `screenshot_2_ai_scanner.jpg` (AI Receipt & Invoice OCR Scanner)
  3. `screenshot_3_couple_sync.jpg` (Couple & Family Shared Budget Sync)
  4. `screenshot_4_financial_sanctuary.jpg` (Privacy Vault & Habit Tracking)

---

## 3. Mandatory Policy & App Content Answers (Play Console)

### Privacy Policy URL:
```text
https://zenbudget-tracker.vercel.app/privacy.html
```

### App Access:
* Select: **"All functionality is available without special access restrictions"**
*(Users can freely explore and use the app without compulsory credentials).*

### Ads:
* Select: **"Yes, my app contains ads"** *(Google AdMob rewarded video ads for extra scans).*

### Content Rating:
* Category: **Utility, Productivity, Finance**
* Violence, sexual content, bad language: **No**
* Does the app share user location: **No**
* Digital purchases: **Yes** (In-App Subscriptions)

### Target Audience:
* Select: **18 and over** (Adults / Young Professionals).

### Financial Features Declaration (Google 2024 Policy):
* Category: **Personal finance management (e.g., budget tracking, expense logging)**
* Are you a money lender or loan broker: **No**
* Are you a licensed bank: **No**

### Data Safety Questionnaire:
* **Is data encrypted in transit?**: **Yes** (HTTPS/TLS)
* **Can users request data deletion?**: **Yes**
* **Account Deletion URL**: `https://zenbudget-tracker.vercel.app/privacy.html`
* **Data Collected**:
  - Personal Info: Email address (for authentication and multi-device sync).
  - Financial Info: User-entered purchase history/expenses (stored in private encrypted vault).
  - Photos/Videos: Ephemeral camera access strictly for real-time receipt scanning.

---

## 4. Production Release (v2.7.0 - Play Store Ready)
* **App Bundle (AAB)**: `playstore_release/zenbudget-v2.7.0-PLAYSTORE.aab`
* **Package Name**: `app.zenbudget.app`
* **Version Code**: `24`
* **Version Name**: `2.7.0`
* **Target SDK**: `36` (Android 15/16 Ready - Exceeds Google minimum requirement of 34+)
* **Min SDK**: `24` (Supports Android 7.0 to Android 15+)
* **Signing Keystore**: `android/release.keystore` (Alias: `zenbudget`, Pass: `zenbudget123`)
* **Release Notes (English - Ready to copy into Play Console)**:
```text
Welcome to ZenBudget 2.7.0!
• AI Bank Statement & Passbook Scanner (PDF & image OCR)
• Dynamic Daily Safe Spending Limit calculator
• Couple & Family shared budget synchronization
• 48-Hour Impulse Purchase Blocker
• ZenBot AI Money Coach & Spending Analytics
• Advanced performance & battery optimizations
• Enhanced high-contrast dark mode UI
```

---

## 5. Play Store Console Upload Steps (Quick Checklist)
1. Go to **Google Play Console** -> Select **ZenBudget**.
2. Navigate to **Release** -> **Production** (or **Internal testing** / **Closed testing**).
3. Click **Create new release**.
4. Upload `playstore_release/zenbudget-v2.7.0-PLAYSTORE.aab`.
5. Enter Release name: `2.7.0 (24)`.
6. Paste the Release notes above.
7. Click **Save** -> **Review release** -> **Start rollout to Production**!
