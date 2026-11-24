# ⚡ xlsx-fire

### Rust + WebAssembly-powered Excel and CSV parser

Parse large Excel and CSV files directly in the browser without blocking the UI.

Built with **Rust + WebAssembly**, incremental ZIP decompression, SAX-style XML parsing, persistent parsing sessions, and asynchronous batch processing.

**Async. Incremental. Batch-based. Session-powered. No Web Workers required.**

---

## 🚀 Important: Update to the Latest Version

**We strongly recommend upgrading to the latest version of `xlsx-fire` to access the new persistent streaming session APIs.**

```bash
npm install xlsx-fire@latest
```

The existing one-shot APIs are still supported for backward compatibility. However, they do not provide persistent parsing sessions.

| API | Support | Persistent session |
|---|---|---|
| `xlsx_batch_async()` | Supported | No |
| `csv_batch_async()` | Supported | No |
| `XlsxSession` | New API | Yes |
| `CsvSession` | New API | Yes |

For new applications, use `XlsxSession` and `CsvSession`.

---

## 📦 Installation

```bash
npm install xlsx-fire@latest
```

---

## 🎯 Why xlsx-fire?

Traditional JavaScript spreadsheet parsing can become expensive when processing large workbooks.

Depending on the library and parsing strategy, large files may cause:

- High memory consumption.
- Long-running synchronous parsing operations.
- Main-thread blocking.
- Browser tab freezes.

`xlsx-fire` takes a different approach.

### Features

- **Rust-powered parsing:** Core parsing logic implemented in Rust and compiled to WebAssembly.
- **Incremental XLSX decompression:** Worksheet XML is decompressed and parsed incrementally.
- **Persistent parsing sessions:** Maintain parser state between batches.
- **CSV sessions:** Parse CSV records incrementally without restarting the reader for each batch.
- **Asynchronous processing:** Cooperative yielding allows the browser to schedule rendering and other tasks.
- **Batch-based results:** Process large worksheets in manageable chunks.
- **Formula extraction:** Extract formula expressions, cached values, and available formula metadata.
- **Worksheet metadata:** Retrieve worksheet dimensions, merged ranges, date system, and other available metadata.
- **No Web Workers required:** Asynchronous cooperative parsing can keep the interface responsive without requiring a separate worker.

---

## ⚡ New API: Persistent XLSX Sessions

The recommended way to parse large Excel worksheets.

Instead of invoking a stateless parser repeatedly, create a session and request batches from the same parser instance.

### Vanilla JavaScript

```js
import init, {
  list_sheets,
  XlsxSession
} from "xlsx-fire/sheetx.js";

await init();

const file = document.querySelector('input[type="file"]').files[0];

if (!file) {
  throw new Error("Select an XLSX file");
}

const bytes = new Uint8Array(await file.arrayBuffer());

// Discover worksheets
const { sheets } = list_sheets(bytes);

if (!sheets.length) {
  throw new Error("No worksheets found");
}

// Create a persistent parsing session
const session = new XlsxSession(
  bytes,
  sheets[0],
  0
);

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
      console.log("Worksheet metadata:", result.meta);
    }

  } while (!result.done);

} finally {
  session.close();
}
```

### How it works

1. Initialize the WebAssembly module.
2. Read the selected XLSX file.
3. Discover available worksheets.
4. Create an `XlsxSession`.
5. Call `nextBatch(batchSize)` to retrieve rows.
6. Continue until `done` becomes `true`.
7. Call `close()` to release session resources.

**The important difference:** The session retains its parsing state between batch requests instead of creating a new parser for every batch.

---

## 📄 New API: Persistent CSV Sessions

CSV files are supported through the same session-oriented approach.

### Vanilla JavaScript

```js
import init, {
  CsvSession
} from "xlsx-fire/sheetx.js";

await init();

const file = document.querySelector('input[type="file"]').files[0];

if (!file) {
  throw new Error("Select a CSV file");
}

const bytes = new Uint8Array(await file.arrayBuffer());

// 0 = default comma delimiter
const session = new CsvSession(
  bytes,
  0,
  0
);

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

### CSV session parameters

| Parameter | Description |
|---|---|
| `bytes` | CSV file as `Uint8Array` |
| `offset` | Number of logical records to skip initially |
| `delimiter` | Delimiter character code; `0` selects comma |
| `batchSize` | Number of records requested per batch |

---

## 🔄 Backward Compatibility: Existing APIs

The original stateless APIs remain available.

You do not have to migrate immediately if your application already uses them.

### XLSX one-shot parsing

```js
import init, {
  list_sheets,
  xlsx_batch_async
} from "xlsx-fire/sheetx.js";

await init();

const bytes = new Uint8Array(
  await file.arrayBuffer()
);

const { sheets } = list_sheets(bytes);

const result = await xlsx_batch_async(
  bytes,
  sheets[0],
  0,
  500
);

console.log(result.rows);
```

### CSV one-shot parsing

```js
import init, {
  csv_batch_async
} from "xlsx-fire/sheetx.js";

await init();

const bytes = new Uint8Array(
  await file.arrayBuffer()
);

const result = await csv_batch_async(
  bytes,
  0,
  500,
  0
);

console.log(result.rows);
```

**Note:** These functions are stateless. Repeated calls do not retain a persistent reader or parser session. Use the new session APIs when processing files in multiple batches.

---

## 📊 Batch Result Structure

Both session APIs return batch results containing the parsed records and associated metadata.

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

| Property | Description |
|---|---|
| `sheet` | Worksheet name |
| `start_row` | Starting logical row-record position (1-based) |
| `rows` | Parsed row data |
| `next_offset` | Logical records consumed |
| `done` | Whether parsing is complete |
| `meta` | Available worksheet metadata |
| `formulas` | Formula information for the current batch |

---

## 🧮 Excel Formula Extraction

`xlsx-fire` extracts Excel formula expressions without attempting to calculate them.

Example:

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

The parser does not act as an Excel calculation engine. Formula evaluation is left to spreadsheet applications.

Advanced OOXML formula semantics, including shared-formula expansion and complete array/dynamic-array metadata handling, are subject to compatibility limitations.

---

## 🧪 Benchmarks

### 100 MB XLSX benchmark

Test configuration:

- File size: 100 MB
- Worksheets: 4
- Browser: Chromium
- Batch size: 500 rows

| Library | File size | Batch rows | First batch | Subsequent batches | Average throughput |
|---|---:|---:|---:|---:|---:|
| SheetJS (pure JS) | 100 MB | N/A | Tab froze | Tab froze | Not measured |
| xlsx-fire (Rust + WASM) | 100 MB | 500 | 5757 ms | 2–3 seconds | ~170–240 rows/sec |

Sample logs:

```text
[1:00:14 PM] Batch: +500 rows (start=1)    | next=500  | 5757.5 ms
[1:00:19 PM] Batch: +500 rows (start=501)  | next=1000 | 2571.4 ms
[1:00:24 PM] Batch: +500 rows (start=1001) | next=1500 | 3055.3 ms
```

These are observed results from the stated test configuration, not universal performance guarantees. Actual throughput depends on workbook structure, compression, hardware, browser, and batch size.

---

## ⚛️ React Example

```jsx
import { useEffect, useRef, useState } from "react";

export default function XlsxFireDemo() {
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
            const wasmUrl = (
              await import("xlsx-fire/sheetx_bg.wasm?url")
            ).default;

            await mod.default(wasmUrl);
          } catch {
            await mod.default();
          }
        }

        if (mounted) {
          sessionRef.current = {
            listSheets: mod.list_sheets,
            XlsxSession: mod.XlsxSession
          };

          setStatus("ready");
        }
      } catch (error) {
        console.error("WASM initialization failed:", error);

        if (mounted) setStatus("error");
      }
    })();

    return () => {
      mounted = false;
      sessionRef.current?.session?.close();
    };
  }, []);

  const onFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !sessionRef.current) return;

    sessionRef.current.session?.close();

    const bytes = new Uint8Array(
      await file.arrayBuffer()
    );

    const { sheets } = sessionRef.current.listSheets(bytes);

    if (!sheets.length) return;

    const session = new sessionRef.current.XlsxSession(
      bytes,
      sheets[0],
      0
    );

    sessionRef.current.session = session;

    try {
      let result;

      do {
        result = await session.nextBatch(500);

        setRows(previous => [
          ...previous,
          ...result.rows
        ]);

      } while (!result.done);
    } finally {
      session.close();

      if (sessionRef.current.session === session) {
        sessionRef.current.session = null;
      }
    }
  };

  return (
    <div>
      <p>WASM: {status}</p>

      <input
        type="file"
        accept=".xlsx"
        onChange={onFile}
      />

      <table>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci}>
                  {String(cell ?? "")}
                </td>
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

## 🟢 Vue 3 Example

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const status = ref("loading");
const rows = ref([]);

let listSheets = null;
let XlsxSession = null;
let session = null;

onMounted(async () => {
  try {
    const mod = await import("xlsx-fire/sheetx.js");

    if (typeof mod.default === "function") {
      try {
        const wasmUrl = (
          await import("xlsx-fire/sheetx_bg.wasm?url")
        ).default;

        await mod.default(wasmUrl);
      } catch {
        await mod.default();
      }
    }

    listSheets = mod.list_sheets;
    XlsxSession = mod.XlsxSession;

    status.value = "ready";
  } catch (error) {
    console.error("WASM initialization failed:", error);
    status.value = "error";
  }
});

const onFile = async (event) => {
  const file = event.target.files?.[0];

  if (!file || !XlsxSession) return;

  session?.close();
  rows.value = [];

  const bytes = new Uint8Array(
    await file.arrayBuffer()
  );

  const { sheets } = listSheets(bytes);

  if (!sheets.length) return;

  session = new XlsxSession(bytes, sheets[0], 0);

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

    <input
      type="file"
      accept=".xlsx"
      @change="onFile"
    />

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

- Written in Rust and compiled to WebAssembly.
- Uses ZIP decompression and incremental XML parsing for worksheet processing.
- Uses asynchronous cooperative yielding to give the browser opportunities to render.
- XLSX and CSV sessions maintain parser state between batch requests.
- Input files are supplied as `Uint8Array`.
- Parsing is performed in the calling JavaScript context; no Web Worker is required.

**Important:** Cooperative yielding is not equivalent to running parsing on another thread. Heavy synchronous work between yield points can still occupy the main thread.

---

## 🧭 Live Demo

Try it in your browser:

👉 https://shyam20001.github.io/xlsx-fire/

---

## 🙌 About

Built for the web development community by **[Shyam](https://github.com/Shyam20001)**.

**GitHub Repository:**  
https://github.com/Shyam20001/xlsx-fire

**npm Package:**  
https://www.npmjs.com/package/xlsx-fire

**License:** MIT

---

### 🔥 Upgrade and use persistent sessions

If you're using an older version, update your dependency:

```bash
npm install xlsx-fire@latest
```

The original APIs remain available, but the new `XlsxSession` and `CsvSession` APIs provide persistent batch parsing.

**Upgrade to the latest release to take advantage of the new session-based parsing architecture.**

Contributions, issues, and feedback are welcome!

**Rust-powered. WebAssembly-driven. Built for large spreadsheet workloads.**