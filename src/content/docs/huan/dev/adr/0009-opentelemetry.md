---
title: "ADR-0009：可觀測性採用 OpenTelemetry"
description: "已採用"
---

## 狀態

已採用。

## 背景

HUAN 上線之後，最常被問的問題是「剛剛那個畫面為什麼轉那麼久」、「素材為什麼一直在處理中」。回答這些問題原本只能靠 Zeabur 的日誌頁：一次看一個容器、沒有搜尋、看不出一個請求在哪一段花了時間，也算不出錯誤率。

需要的是三件事：每個請求與轉檔工作拆成一段一段的時間（trace）、可以搜尋而且跟 trace 對得起來的日誌（log）、錯誤率與延遲分布的走勢（metric）。

## 決策

**Server 與 Worker 以 OpenTelemetry SDK 送出 trace、log、metric，走 OTLP/HTTP 送到一個收件端。** 收件端之後是 Tempo、Loki、Prometheus，由 Grafana 讀取。

- 共用的 SDK 設定放在 `@huan/telemetry`，由 `node --import` 在應用程式之前載入。
- 自動埋點只開 HTTP、pino、AWS SDK 與 Node.js 執行環境四種；資料庫查詢由 `@huan/db` 包住 drizzle 的查詢執行自己產生 span。
- 路由層級的延遲與錯誤率用 HTTP 埋點的標準指標；資料庫、S3、轉檔步驟的延遲由 Tempo 從 trace 算出來，不在程式裡另外埋。
- 業務指標（裝置在線、版本落後、佇列等待）由 Server 定期查資料庫回報。
- 沒有設定 `OTEL_EXPORTER_OTLP_ENDPOINT` 時 SDK 完全不載入。

## 理由

**一套 SDK、三種訊號、同一個 trace ID。** 用各自的工具（例如 Sentry 看錯誤、prom-client 出指標、另一套 log shipper 送日誌）也做得到，但三邊的 ID 對不起來，從一個錯誤追到它當時的日誌與延遲，要靠時間戳自己對。OpenTelemetry 讓 pino 的每一行 log 自動帶上當下的 trace ID。

**不綁廠商。** OTLP 是標準協定，收件端換成 Grafana Cloud、Honeycomb 或任何支援 OTLP 的服務，HUAN 這邊只改環境變數。

**不增加 HUAN 自己的部署需求。** 可觀測性是選配：沒有收件端時 HUAN 跟以前一模一樣，自己架設的人不會因此多一個必須跑的服務。這延續了 AGENTS.md「Fastify + PostgreSQL + RustFS + Worker 已經夠用」的原則——新增的元件都在 HUAN 外面。

**從 trace 算指標，而不是兩邊各埋一次。** 同一件事埋兩次，數字遲早會對不上。Tempo 的 span metrics 讓「最慢的查詢」這張圖與點進去看到的 trace 來自同一份資料。

## 後果

**多了一個啟動期的相依。** `node --import` 必須在任何模組之前載入 SDK，所以 Docker 映像用 `NODE_OPTIONS` 設定，開發時的 `pnpm dev` 也加了 `--import`。同一個容器裡的其他 node 行程也會經過它，因此進入點會先判斷自己是不是主程式。

**ESM 攔截依賴 `module.register()`。** AWS SDK 是 ESM，攔截它需要 import-in-the-middle 的 loader hook。只攔埋點實際註冊過的套件，降低弄壞其他模組的機會；Node 26 會對這個 API 發淘汰警告，屆時要換。

**資料外洩的面變大。** trace 與 log 會保留數週、給看得到 Grafana 的人看。因此查詢字串、配對碼、SQL 參數、標頭與內文一律不送，規則寫在[可觀測性](/huan/dev/observability#不會記錄的東西)並由程式強制。

**收件端要自己保護。** OTLP 收件口沒有驗證，任何人都能灌資料進去。正式環境只經 Cloudflare Tunnel 對外，並以 Access 限制來源 IP。

## 替代方案

**只用 Prometheus 指標加結構化日誌**：看得到錯誤率與延遲，但回答不了「卡在哪」。一個慢請求裡是哪一段查詢慢，只有 trace 看得出來。

**Sentry**：錯誤追蹤很好用，但它的效能追蹤與日誌是另一套計費與資料模型，而且要把資料送到 HUAN 以外的服務。自架的 Sentry 需要的元件（Kafka、ClickHouse、Redis）正是 AGENTS.md 明確排除的那些。

**在 Server 內建 `/metrics` 端點讓 Prometheus 來抓**：抓取端得連得進 HUAN 所在的網路，否則就要把指標端點公開出去；推送模式（OTLP）只需要 HUAN 能往外連。而且抓取只解決指標，trace 與 log 還是要另外送。
