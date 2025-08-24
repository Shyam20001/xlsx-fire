---
[![npm version](https://img.shields.io/npm/v/xlsx-fire.svg)](https://www.npmjs.com/package/xlsx-fire)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

# ⚡ xlsx-fire

### WASM beast (Rust-powered) to kill your SheetJS freezes  

Stream and parse **huge Excel files** directly in the browser — **without blocking the UI**.  
Built with **Rust + WebAssembly**, streaming ZIP + SAX XML parsing.  
**Async. Yield. Streams. No workers required.**  

---

## 📦 Installation

```bash
npm install xlsx-fire
```

---

## 🚀 Why?

Parsing `.xlsx` in JS with libraries like **SheetJS** often means:

- Loading the whole 100 MB file into memory
- Blocking the main thread
- Tabs freezing, fans spinning

**xlsx-fire** does it differently:

- ✅ **Streams** ZIP entries (no inflate-to-Vec)
- ✅ **Async + cooperative yielding** — browser paints while parsing
- ✅ **Batch-based parsing** (rows in chunks)
- ✅ **Memory stays flat, UI stays responsive**

---

## 🎯 Try It Yourself

👉 Live Demo: **_[https://shyam20001.github.io/xlsx-fire/](https://shyam20001.github.io/xlsx-fire/)_**

---

## 🧪 Benchmarks (100 MB `.xlsx`, 4 sheets, Chromium, batch = 500)

| Library                   | File size | Batch rows |  First batch | Next batches |   Rows/sec (avg) | Notes                             |
| ------------------------- | --------: | ---------: | -----------: | -----------: | ---------------: | --------------------------------- |
| **SheetJS** (pure JS)     |    100 MB |        n/a | ❌ froze tab | ❌ froze tab |              \~0 | Blocks UI, crashes beyond \~40 MB |
| **xlsx-fire** (Rust+WASM) |    100 MB |        500 |  **5757 ms** |    **2–3 s** | \~170–240 rows/s | Smooth, async, UI usable          |

Log sample:

```
[1:00:14 PM] Batch: +500 rows (start=1)   | next=500  | 5757.5 ms
[1:00:19 PM] Batch: +500 rows (start=501) | next=1000 | 2571.4 ms
[1:00:24 PM] Batch: +500 rows (start=1001)| next=1500 | 3055.3 ms
...
```

👉 On the same file where **SheetJS hangs the browser**, **xlsx-fire streams rows smoothly**.

---

## ⚡ Quick Start Examples

### 🌐 Vanilla JavaScript

```js
import init, { list_sheets, xlsx_batch_async } from "xlsx-fire/sheetx.js";

await init();

const file = document.querySelector("input[type=file]").files[0];
const bytes = new Uint8Array(await file.arrayBuffer());

// List sheets
const { sheets } = list_sheets(bytes);

// Parse first 500 rows
const res = await xlsx_batch_async(bytes, sheets[0], 0, 500);

console.log(res.rows);
```

---

### ⚛️ React Example <img src="https://raw.githubusercontent.com/github/explore/main/topics/react/react.png" width="24" />

```jsx
import { useEffect, useRef, useState } from "react";

export default function XlsxFireDemo() {
  const wasmReadyRef = useRef(false);
  const listSheetsRef = useRef(null);
  const batchAsyncRef = useRef(null);

  const [status, setStatus] = useState("loading");
  const [rows, setRows] = useState([]);

  useEffect(() => {
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
        listSheetsRef.current = mod.list_sheets;
        batchAsyncRef.current = mod.xlsx_batch_async;
        wasmReadyRef.current = true;
        setStatus("ready");
      } catch (err) {
        console.error("WASM init failed:", err);
        setStatus("error");
      }
    })();
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !wasmReadyRef.current) return;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { sheets } = listSheetsRef.current(bytes);
    if (!sheets.length) return;

    const res = await batchAsyncRef.current(bytes, sheets[0], 0, 500);
    setRows(res.rows);
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

### 🟢 Vue 3 Example <img src="https://raw.githubusercontent.com/github/explore/main/topics/vue/vue.png" width="24" />

```vue
<script setup>
import { ref, onMounted } from "vue";

const wasmReady = ref(false);
const status = ref("loading");
const rows = ref([]);

let listSheets = null;
let batchAsync = null;

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
    listSheets = mod.list_sheets;
    batchAsync = mod.xlsx_batch_async;
    wasmReady.value = true;
    status.value = "ready";
  } catch (err) {
    console.error("WASM init failed:", err);
    status.value = "error";
  }
});

const onFile = async (e) => {
  const file = e.target.files?.[0];
  if (!file || !wasmReady.value) return;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { sheets } = listSheets(bytes);
  if (!sheets.length) return;

  const res = await batchAsync(bytes, sheets[0], 0, 500);
  rows.value = res.rows;
};
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

## 🙌 About

Built for the **Web Dev Community** by [Shyam](https://github.com/Shyam20001)
Repo: **[xlsx-fire](https://github.com/Shyam20001/xlsx-fire.git)**

**Async, yield, streams enabled — no workers required.**
Compared to **SheetJS**, which lacks streaming and freezes on big files.

Contributions & feedback welcome 🚀

---
