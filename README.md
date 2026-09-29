# 香港 - 獨立巴士預報 HK Bus ETA

[![React](https://badges.aleen42.com/src/react.svg)](https://reactjs.org/)
[![TypeScript](https://badges.aleen42.com/src/typescript.svg)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.1-24C8DB?logo=tauri)](https://tauri.app/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hkbus/hk-independent-bus-eta/pulls)

---

無廣告的巴士預報站，整合香港巴士（九巴、龍運、城巴、嶼巴、港鐵巴士）、綠色小巴、輕鐵及港鐵的到站預報。介面清晰直接，力求讓用戶快速獲得所需資訊。

An ad-free bus ETA app for Hong Kong, covering KMB, LWB, CTB, NLB, MTR Bus, GMB, Light Rail, and MTR. Clean, clutter-free UI designed for speed.

> **Original Web Project**: [hkbus/hk-independent-bus-eta](https://github.com/hkbus/hk-independent-bus-eta)  
> **Desktop/Android Port**: Built with [Tauri 2](https://tauri.app/) — native performance, tiny bundle (~11 MB APK), offline-first.

---

## ✨ Features / 功能特色

| 功能 | 說明 |
|------|------|
| **多交通機構整合** | 九巴、龍運、城巴、嶼巴、港鐵巴士、綠色小巴、輕鐵、港鐵、渡輪 |
| **離線優先** | IndexedDB 緩存路線/站點資料，斷網仍可查看最近更新的 ETA |
| **智能去重** | 同一路線同方向自動合併，避免重複顯示 |
| **路線收藏/收藏站** | 自訂收藏夾、排程提醒、匯入匯出 JSON 備份 |
| **地圖顯示路線** | MapLibre GL + PMTiles 離線瓦片，支援深色模式 |
| **日曬/陰涼分析** | 依路線幾何與太陽位置計算左右車廂日曬程度 |
| **多語言** | 繁體中文 / English，i18next 完整國際化 |
| **PWA / 原生 App** | 同一代碼庫產出 Web、Android APK、Desktop (Win/macOS/Linux) |
| **無障礙** | WCAG 2.1 AA、鍵盤導航、螢幕閱讀器友善 |

---

## 📸 Screenshots / 截圖

| 首頁收藏 | 路線 ETA | 地圖檢視 | 設定 |
|---------|---------|---------|------|
| ![Home](docs/screenshots/home.png) | ![Route](docs/screenshots/route.png) | ![Map](docs/screenshots/map.png) | ![Settings](docs/screenshots/settings.png) |

*(請自行在 `docs/screenshots/` 放入截圖)*

---

## 🏗 Architecture / 架構概覽

```
hk-independent-bus-eta/
├── src/                          # React 前端 (TypeScript)
│   ├── components/               # UI 組件 (MUI + MapLibre)
│   ├── hooks/                    # 核心業務邏輯 Hooks
│   │   ├── useEtas.tsx           # 單一路線 ETA 輪詢 (loading / error / refetch)
│   │   ├── useStopEtas.tsx       # 多站點合併 ETA + 智能去重 + 路線評分
│   │   ├── useRoutePath.tsx      # 路線幾何 + 快取
│   │   ├── useOnline.tsx         # 線上/離線偵測
│   │   ├── useNotices.tsx        # 公告載入
│   │   └── useTranslation.ts     # 語言切換
│   ├── context/                  # React Context (DB、App、Search)
│   ├── utils.ts                  # 通用工具函數
│   ├── db.ts                     # 資料庫抓取 + 本地儲存
│   ├── routeAlignment.ts         # 路線幾何運算
│   └── timetable.ts              # 班次表判斷 (純函數、已單元測試)
├── src-tauri/                    # Tauri 2 原生層
│   ├── src/lib.rs                # Rust 入口 + 插件註冊
│   ├── gen/android/              # Android 專案 (Gradle Kotlin DSL)
│   ├── Cargo.toml                # Rust 依賴
│   └── tauri.conf.json           # Tauri 配置
├── public/                       # 靜態資源 (icons、manifest)
├── scripts/                      # 建構/部署腳本
├── vite.config.ts                # Vite 建構配置
├── vitest.config.ts              # 單元測試配置
└── .github/workflows/ci.yml      # CI (Typecheck → Test → Build web)
```

---

## 🚀 Quick Start / 快速開始

### 開發環境需求

| 工具 | 版本 | 安裝指令 |
|------|------|----------|
| Node.js | ≥ 20 LTS | `nvm install 20` |
| yarn | ≥ 1.22 | `corepack enable` |
| Rust | ≥ 1.77 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Android SDK | API 34 + NDK 26 | 見下方「Android 建構」 |

### 安裝依賴

```bash
corepack enable
yarn install --frozen-lockfile
```

### 啟動開發伺服器

```bash
# Web 開發 (HTTPS + HMR)
yarn start

# Tauri 桌面開發 (熱重載)
yarn tauri dev
```

### 建構生產版

```bash
# 1️⃣ Web 靜態檔案 (輸出至 build/)
yarn build

# 2️⃣ Android Release APK (需先完成 Android SDK 設定)
yarn tauri android build --target aarch64-linux-android
# 輸出: src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk

# 3️⃣ Desktop 安裝包
yarn tauri build
```

---

## 📱 Android APK 建構完整指南

> **注意**：本專案使用 Tauri 2，需在 **Linux/macOS/WSL2** 建構 Android APK。

### 一次性環境安裝

```bash
# 1. Rust 目標
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

# 2. Android SDK (僅命令列工具，無需 Android Studio)
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
cd "$ANDROID_SDK_ROOT"
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdtools.zip
unzip -q cmdtools.zip -d cmdline-tools && mv cmdline-tools/cmdline-tools cmdline-tools/latest
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# 3. 授權與安裝平台/NDK
yes | sdkmanager --licenses
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" "ndk;26.1.10909125"

# 4. 初始化 Tauri Android 專案 (僅首次)
cd /path/to/hk-independent-bus-eta
yarn tauri android init
```

### 建構 Release APK

```bash
cd /path/to/hk-independent-bus-eta

# 完整流程：型別檢查 → 測試 → Web 建構 → APK
./build-apk.sh

# 或分步
yarn typecheck
yarn test
yarn build
yarn tauri android build --target aarch64-linux-android
```

**產出位置**：

```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

### 簽名發布版 (Play Store)

```bash
cd src-tauri/gen/android
# 建立 keystore (僅首次)
keytool -genkey -v -keystore hkbus-release.keystore -alias hkbus -keyalg RSA -keysize 2048 -validity 10000

# gradle.properties 加入簽名資訊
echo "hkbus.storeFile=../hkbus-release.keystore
hkbus.storePassword=YOUR_STORE_PASS
hkbus.keyAlias=hkbus
hkbus.keyPassword=YOUR_KEY_PASS" >> gradle.properties

# 建構簽名 AAB
./gradlew bundleRelease
# 輸出: app/build/outputs/bundle/release/app-release.aab
```

---

## 🧪 Testing & Quality / 測試與品質

```bash
# 型別檢查
yarn typecheck

# ESLint
yarn lint

# 單元測試 (Vitest + React Testing Library)
yarn test
yarn test:watch     # watch 模式
yarn test:ui        # Vitest UI
yarn test:coverage  # 覆蓋率報告 (coverage/index.html)
```

現有測試：

| 檔案 | 涵蓋範圍 |
|------|----------|
| `src/timetable.test.ts` | `isHoliday`、`isRouteAvaliable`（頭尾班次、通宵車、未知 service id 的 fail-open 行為） |
| `src/hooks/useEtas.test.tsx` | 首次載入、成功取得 ETA、`disabled`／非前景時不抓取、錯誤處理、`refetch()` |

**CI** (`.github/workflows/ci.yml`)：每次 push／PR 到 `master` 會自動執行 typecheck → 單元測試 → Web 建構。
Android／Desktop 打包需要 Rust + Android SDK/NDK，請於本機或專用 runner 執行（見「Android APK 建構」）。
E2E（Playwright）尚未納入，屬後續規劃。

---

## 📦 Performance Notes / 效能說明

| 項目 | 現況 |
|------|------|
| **路由層分包** | `vite build` 以 `React.lazy` + 動態 `import()` 拆分頁面（`RouteEtaPage`、`RouteSearchPage`、`SettingsPage`…） |
| **ETA 輪詢** | `useEtas` / `useStopEtas` 依 `refreshInterval` 輪詢；切到背景 (`document.hidden`) 時停止，返回前景即恢復 |
| **請求取消** | 每次重新抓取前會 `AbortController.abort()` 前一請求，避免過期回應覆寫新資料 |
| **站點 ETA 去重** | `useStopEtas` 依「路線 + 公司 + 相同到站時間」合併，並以可用性／班次表／收費資料為路線評分 |
| **路線幾何** | `useRoutePath` 快取結果，減少重複抓取 |
| **PWA 離線** | `vite-plugin-pwa` 產生 service worker，預快取應用程式外殼 |

> ⚠️ 目前仍有 >500 kB 的 chunk（`EmotionPage`、`geom`），屬後續優化方向。

---

## 🔧 Configuration / 環境變數

`.env` (專案根目錄，勿提交)：

```env
# Google Analytics (可選)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry DSN (錯誤上報，可選)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# 自定 API 端點 (預設官方)
VITE_ETA_API_BASE=https://data.etabus.gov.hk
```

`tauri.conf.json` 關鍵設定：

```json
{
  "build": { "frontendDist": "../build", "beforeBuildCommand": "yarn build" },
  "app": { "security": { "csp": "default-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:" } },
  "bundle": { "android": { "splashScreen": { "enabled": true, "backgroundColor": "#fedb00" } } }
}
```

---

## 🤝 Contributing / 貢獻指南

1. Fork & Clone
2. `yarn install`
3. 建立分支：`git checkout -b feat/amazing-feature`
4. 開發 + 測試：`yarn test && yarn typecheck && yarn lint`
5. 提交：`git commit -m "feat: add amazing feature"` (遵循 [Conventional Commits](https://www.conventionalcommits.org/))
6. Push & PR

**歡迎貢獻類型**：
- 🐛 Bug 修復
- ✨ 新功能 (收藏同步、匯入/匯出、小工具)
- 📝 文件/翻譯改進
- ♻️ 重構/效能優化
- 🧪 測試補齊

---

## 📄 License / 授權條款

**GPL-3.0-only** — 繼承自原專案。  
衍生作品需同樣開源，商業使用請遵循 GPL-3.0 條款。

---

## 🙏 Acknowledgments / 鳴謝

### 原作者 / Original Authors

| 角色 | GitHub |
|------|--------|
| **Project Owner / 專案發起** | [@chunlaw](https://github.com/chunlaw) |
| **Core Contributors / 核心貢獻者** | [@LOOHP](https://github.com/LOOHP) [@chakflying](https://github.com/chakflying) [@chengkeith](https://github.com/chengkeith) [@cswbrian](https://github.com/cswbrian) [@evnchn](https://github.com/evnchn) [@hk-ng](https://github.com/hk-ng) [@kkoyung](https://github.com/kkoyung) [@lifehome](https://github.com/lifehome) [@louiscklaw](https://github.com/louiscklaw) [@lzwn128](https://github.com/lzwn128) [@sdip15fa](https://github.com/sdip15fa) [@skpracta](https://github.com/skpracta) [@thomassth](https://github.com/thomassth) [@maruk0chan](https://github.com/maruk0chan) |

### 資料提供 / Data Providers

- **香港政府資料一站通** — [data.gov.hk](https://data.gov.hk)
- **空間數據共享平台** — [CSDI Portal](https://portal.csdi.gov.hk/csdi-webpage/)
- **各大公共交通機構** — 九巴、城巴、龍運、嶼巴、港鐵、綠巴聯會
- **路線/票價爬蟲資料** — [hkbus/hk-bus-crawling](https://github.com/hkbus/hk-bus-crawling)

### 開源套件 / Key Open Source Dependencies

| 套件 | 用途 |
|------|------|
| [hk-bus-eta](https://www.npmjs.com/package/hk-bus-eta) | 核心 ETA 計算邏輯 |
| [Tauri](https://tauri.app/) | 原生 App 框架 (Rust + WebView) |
| [MapLibre GL](https://maplibre.org/) | 向量地圖渲染 |
| [Material UI](https://mui.com/) | 元件庫 |
| [i18next](https://www.i18next.com/) | 國際化 |
| [Vite](https://vitejs.dev/) | 建構工具 |
| [Vitest](https://vitest.dev/) | 單元測試 |

---

## 📞 Support / 支援與回饋

- **Issues**: [GitHub Issues](https://github.com/hkbus/hk-independent-bus-eta/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hkbus/hk-independent-bus-eta/discussions)
- **Telegram 群組**: [@hkbusapp](https://t.me/+T245uB32DeNlNjJl)
- **Email**: hkbus.app@gmail.com

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hkbus/hk-independent-bus-eta&type=Date)](https://star-history.com/#hkbus/hk-independent-bus-eta&Date)

---

> **本專案由社群驅動，歡迎任何形式的貢獻。**  
> **Community-driven — contributions of any kind are welcome.**

*Last updated: 2026-09-29*