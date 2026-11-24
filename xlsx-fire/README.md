[![npm version](https://img.shields.io/npm/v/xlsx-fire.svg)](https://www.npmjs.com/package/xlsx-fire)
[![npm downloads](https://img.shields.io/npm/dm/xlsx-fire.svg)](https://www.npmjs.com/package/xlsx-fire)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Socket Badge](https://socket.dev/api/badge/npm/package/xlsx-fire)](https://socket.dev/npm/package/xlsx-fire)

# ⚡ xlsx-fire

### Rust-powered XLSX and CSV parser for the browser

Parse large Excel and CSV files directly in the browser using Rust and WebAssembly.

Built with incremental ZIP decompression, XML parsing, persistent parsing sessions, asynchronous batch processing, and cooperative yielding.

**Rust. WebAssembly. Persistent sessions. Incremental parsing.**

---

## 🚀 Important: Upgrade to the Latest Version

We've introduced a new session-based parsing architecture.

**Update your package to access the new persistent XLSX and CSV APIs.**

```bash
npm install xlsx-fire@latest
```

The original APIs are still supported for backward compatibility. However, they are stateless and do not retain parser state between batch requests.

| API                  | Status      | Persistent parsing |
| -------------------- | ----------- | ------------------ |
| `xlsx_batch_async()` | Supported   | No                 |
| `csv_batch_async()`  | Supported   | No                 |
| `XlsxSession`        | Recommended | Yes                |
| `CsvSession`         | Recommended | Yes                |

For new applications and large files, use `XlsxSession` and `CsvSession`.

---

## 📦 Installation

```bash
npm install xlsx-fire@latest
```

---

## 🎯 Features

- **Rust + WebAssembly:** Core parsing implementation written in Rust.
- **Incremental XLSX parsing:** Decompress and parse worksheet XML incrementally.
- **Persistent XLSX sessions:** Retain parser state across batch requests.
- **Persistent CSV sessions:** Process CSV records using a persistent reader.
- **Asynchronous batch processing:** Retrieve spreadsheet records in manageable batches.
- **Cooperative yielding:** Give the browser opportunities to render and process other tasks.
- **Formula extraction:** Extract formula expressions, cached values, and available formula information.
- **Worksheet metadata:** Retrieve available dimensions, merged ranges, date system, and other metadata.
- **No Web Workers required:** Uses asynchronous cooperative parsing in the calling JavaScript context.

---

## ⚡ Persistent XLSX Session API

The recommended API for processing large Excel worksheets.

Instead of creating a new parser for every batch, create one persistent session and request batches from it.

### Vanilla JavaScript

```js
import init, { list_sheets, XlsxSession } from "xlsx-fire/sheetx.js";

await init();

const file = document.querySelector('input[type="file"]').files[0];

if (!file) {
  throw new Error("Select an XLSX file");
}

// Read the file
const bytes = new Uint8Array(await file.arrayBuffer());

// Discover worksheets
const { sheets } = list_sheets(bytes);

if (!sheets.length) {
  throw new Error("No worksheets found");
}

// Create persistent XLSX session
const session = new XlsxSession(bytes, sheets[0], 0);

try {
  let result;

  do {
    result = await session.nextBatch(500);

    console.log("Rows:", result.rows);
    console.log("Start:", result.start_row);
    console.log("Next offset:", result.next_offset);
    console.log("Done:", result.done);

    if (result.formulas?.length) {
      console.log("Formulas:", result.formulas);
    }

    if (result.meta) {
      console.log("Metadata:", result.meta);
    }
  } while (!result.done);
} finally {
  session.close();
}
```

### Session workflow

1. Initialize WebAssembly.
2. Read the XLSX file.
3. Discover worksheets.
4. Create an `XlsxSession`.
5. Retrieve batches using `nextBatch(batchSize)`.
6. Continue until `done` is `true`.
7. Close the session to release its resources.

The parser retains its session state between batch requests, avoiding the repeated parser initialization and reparsing associated with the stateless API.

---

## 📄 Persistent CSV Session API

CSV parsing also supports persistent sessions.

```js
import init, { CsvSession } from "xlsx-fire/sheetx.js";

await init();

const file = document.querySelector('input[type="file"]').files[0];

if (!file) {
  throw new Error("Select a CSV file");
}

const bytes = new Uint8Array(await file.arrayBuffer());

// bytes, initial offset, delimiter
// 0 = default comma delimiter
const session = new CsvSession(bytes, 0, 0);

try {
  let result;

  do {
    result = await session.nextBatch(500);

    console.log("Rows:", result.rows);
    console.log("Start:", result.start_row);
    console.log("Next offset:", result.next_offset);
    console.log("Done:", result.done);
  } while (!result.done);
} finally {
  session.close();
}
```

### CSV constructor parameters

| Parameter   | Description                                     |
| ----------- | ----------------------------------------------- |
| `bytes`     | CSV file as `Uint8Array`                        |
| `offset`    | Initial logical record offset                   |
| `delimiter` | Delimiter character code; `0` defaults to comma |

---

## 🔄 Backward Compatibility: One-Shot APIs

Existing applications can continue using the original APIs.

These functions remain supported.

### XLSX

```js
import init, { list_sheets, xlsx_batch_async } from "xlsx-fire/sheetx.js";

await init();

const bytes = new Uint8Array(await file.arrayBuffer());

const { sheets } = list_sheets(bytes);

const result = await xlsx_batch_async(bytes, sheets[0], 0, 500);

console.log(result.rows);
```

### CSV

```js
import init, { csv_batch_async } from "xlsx-fire/sheetx.js";

await init();

const bytes = new Uint8Array(await file.arrayBuffer());

const result = await csv_batch_async(bytes, 0, 500, 0);

console.log(result.rows);
```

**Important:** The one-shot functions do not retain parser state between calls. Repeated calls may require reparsing or skipping previously consumed records.

For large files and repeated batch retrieval, migrate to the session APIs.

---

## 📊 Batch Result Structure

Both session APIs return a structured batch result.

```js
{
  sheet: "Sheet1",
  start_row: 1,
  rows: [],
  next_offset: 500,
  done: false,
  meta: null,
  formulas: []
}
```

| Property      | Description                               |
| ------------- | ----------------------------------------- |
| `sheet`       | Worksheet name                            |
| `start_row`   | Starting logical row position (1-based)   |
| `rows`        | Parsed records                            |
| `next_offset` | Logical records consumed                  |
| `done`        | Whether parsing is complete               |
| `meta`        | Available worksheet metadata              |
| `formulas`    | Formula information for the current batch |

---

## 🧮 Excel Formula Extraction

`xlsx-fire` extracts Excel formula expressions and available cached values.

It does not attempt to evaluate formulas.

```js
const result = await session.nextBatch(500);

for (const formula of result.formulas ?? []) {
  console.log("Cell:", formula.r);
  console.log("Expression:", formula.f);
  console.log("Cached value:", formula.v);
  console.log("Type:", formula.t);
}
```

Formula information includes:

- Physical Excel cell references.
- Formula expressions.
- Available cached values.
- Available formula type information.

The parser does not function as an Excel calculation engine.

Advanced OOXML formula semantics, including shared-formula expansion and complete array/dynamic-array metadata handling, have compatibility limitations.

---

## 📈 Large File Testing

### 100 MB XLSX test

Test environment:

- File: `100mb.xlsx`
- File size: 100.81 MB
- Actual bytes loaded: 105,709,047
- Worksheets: 4
- Selected worksheet: `Worksheet`
- Parsing mode: Persistent `XlsxSession`
- Batch size: 20 rows

Observed logs:

```text
[8:31:33 AM] WebAssembly initialized successfully.

[8:31:45 AM] Loading 100mb.xlsx (100.81 MB)
[8:31:56 AM] Loaded 105,709,047 bytes.

[8:31:56 AM] XLSX detected.
[8:31:58 AM] Found 4 worksheet(s).

[8:32:02 AM] Selected worksheet: Worksheet

[8:32:16 AM] Created persistent XLSX session.

[8:32:16 AM] Rows: 20 | Start: 1  | Next: 20  | 3.10 ms
[8:32:29 AM] Rows: 20 | Start: 21 | Next: 40  | 0.90 ms
[8:32:29 AM] Rows: 20 | Start: 41 | Next: 60  | 1.20 ms
[8:32:29 AM] Rows: 20 | Start: 61 | Next: 80  | 0.60 ms
[8:32:30 AM] Rows: 20 | Start: 81 | Next: 100 | 0.80 ms
[8:32:30 AM] Rows: 20 | Start: 101 | Next: 120 | 0.80 ms
[8:32:30 AM] Rows: 20 | Start: 121 | Next: 140 | 0.80 ms
[8:32:30 AM] Rows: 20 | Start: 141 | Next: 160 | 1.90 ms
[8:32:30 AM] Rows: 20 | Start: 161 | Next: 180 | 1.10 ms
[8:32:30 AM] Rows: 20 | Start: 181 | Next: 200 | 0.80 ms
```

### Understanding these measurements

The batch timings represent the measured duration of individual `nextBatch()` operations.

They do not represent total file-processing time.

The following operations must be measured separately:

1. File reading and `ArrayBuffer` creation.
2. WebAssembly initialization.
3. Worksheet discovery.
4. Session creation and initial parsing work.
5. Subsequent batch retrieval.
6. Complete worksheet processing.

We avoid presenting batch-only timings as end-to-end throughput.

More comprehensive benchmarks across different file sizes, worksheet structures, batch sizes, and hardware are needed before publishing universal performance comparisons.

---

## ⚛️ React Integration

```jsx
import { useEffect, useRef, useState } from "react";

export default function XlsxFireDemo() {
  const apiRef = useRef(null);
  const sessionRef = useRef(null);

  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod = await import("xlsx-fire/sheetx.js");

        if (typeof mod.default === "function") {
          try {
            const wasmUrl = (await import("xlsx-fire/sheetx_bg.wasm?url"))
              .default;

            await mod.default(wasmUrl);
          } catch {
            await mod.default();
          }
        }

        if (mounted) {
          apiRef.current = mod;
          setStatus("ready");
        }
      } catch (error) {
        console.error("WASM initialization failed:", error);

        if (mounted) {
          setStatus("error");
        }
      }
    })();

    return () => {
      mounted = false;
      sessionRef.current?.close();
      sessionRef.current = null;
    };
  }, []);

  const onFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !apiRef.current) return;

    sessionRef.current?.close();
    sessionRef.current = null;
    setRows([]);

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { sheets } = apiRef.current.list_sheets(bytes);

    if (!sheets.length) return;

    const session = new apiRef.current.XlsxSession(bytes, sheets[0], 0);

    sessionRef.current = session;

    try {
      let result;

      do {
        result = await session.nextBatch(500);

        setRows((previous) => [...previous, ...result.rows]);
      } while (!result.done);
    } finally {
      if (sessionRef.current === session) {
        sessionRef.current = null;
      }

      session.close();
    }
  };

  return (
    <div>
      <p>WASM: {status}</p>

      <input type="file" accept=".xlsx" onChange={onFile} />

      <table>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>{String(cell ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🟢 Vue 3 Integration

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const status = ref("loading");
const rows = ref([]);

let api = null;
let session = null;

onMounted(async () => {
  try {
    const mod = await import("xlsx-fire/sheetx.js");

    if (typeof mod.default === "function") {
      try {
        const wasmUrl = (await import("xlsx-fire/sheetx_bg.wasm?url")).default;

        await mod.default(wasmUrl);
      } catch {
        await mod.default();
      }
    }

    api = mod;
    status.value = "ready";
  } catch (error) {
    console.error(error);
    status.value = "error";
  }
});

const onFile = async (event) => {
  const file = event.target.files?.[0];

  if (!file || !api) return;

  session?.close();
  session = null;
  rows.value = [];

  const bytes = new Uint8Array(await file.arrayBuffer());

  const { sheets } = api.list_sheets(bytes);

  if (!sheets.length) return;

  session = new api.XlsxSession(bytes, sheets[0], 0);

  try {
    let result;

    do {
      result = await session.nextBatch(500);

      rows.value.push(...result.rows);
    } while (!result.done);
  } finally {
    session.close();
    session = null;
  }
};

onUnmounted(() => {
  session?.close();
});
</script>

<template>
  <div>
    <p>WASM: {{ status }}</p>

    <input type="file" accept=".xlsx" @change="onFile" />

    <table>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td v-for="(cell, ci) in row" :key="ci">
            {{ cell ?? "" }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## 🛠️ Technical Notes

- Core implementation: Rust.
- Runtime: WebAssembly.
- XLSX processing: ZIP decompression and incremental worksheet XML parsing.
- CSV processing: Persistent CSV reader sessions.
- Browser scheduling: Asynchronous cooperative yielding.
- Input: `Uint8Array`.
- Output: Structured JavaScript batch results.

Cooperative yielding allows the browser to schedule rendering between parsing operations. It is not equivalent to executing the parser on a separate worker thread.

---

## 🧭 Live Demo

👉 https://shyam20001.github.io/xlsx-fire/

---

## 🙌 About

Built for the web development community by **[Shyam](https://github.com/Shyam20001)**.

**GitHub:**  
https://github.com/Shyam20001/xlsx-fire

**npm:**  
https://www.npmjs.com/package/xlsx-fire

**License:** MIT

---

## 🔥 Upgrade Today

```bash
npm install xlsx-fire@latest
```

The original one-shot APIs remain supported.

However, the new persistent session APIs are the recommended approach for applications processing large XLSX and CSV files.

**Upgrade to enjoy persistent parsing sessions and the latest API improvements.**

Contributions, issues, and feedback are welcome!

**Rust-powered. WebAssembly-driven. Built for large spreadsheet workloads.**
