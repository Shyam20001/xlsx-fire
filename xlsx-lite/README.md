
---

# ⚡ xlsx-lite

### WASM beast (Rust-powered) to kill your SheetJS freezes

Stream and parse **huge Excel files** directly in the browser — **without blocking the UI**.
Built with **Rust + WebAssembly**, streaming ZIP + SAX XML parsing.
**Async. Yield. Streams. No workers required.**

---

## 🚀 Why?

Parsing `.xlsx` in JS with libraries like **SheetJS** often means:

* Loading the whole 100 MB file into memory
* Blocking the main thread
* Tabs freezing, fans spinning

**xlsx-lite** does it differently:

* ✅ **Streams** ZIP entries (no inflate-to-Vec)
* ✅ **Async + cooperative yielding** — browser paints while parsing
* ✅ **Batch-based parsing** (rows in chunks)
* ✅ **Memory stays flat, UI stays responsive**

---

## 🧪 Benchmarks (100 MB `.xlsx`, 4 sheets, Chromium, batch = 500)

| Library                   | File size | Batch rows | First batch | Next batches |   Rows/sec (avg) | Notes                             |
| ------------------------- | --------: | ---------: | ----------: | -----------: | ---------------: | --------------------------------- |
| **SheetJS** (pure JS)     |    100 MB |        n/a | ❌ froze tab |  ❌ froze tab |              \~0 | Blocks UI, crashes beyond \~40 MB |
| **xlsx-lite** (Rust+WASM) |    100 MB |        500 | **5757 ms** |    **2–3 s** | \~170–240 rows/s | Smooth, async, UI usable          |

Log sample:

```
[1:00:14 PM] Batch: +500 rows (start=1)   | next=500  | 5757.5 ms
[1:00:19 PM] Batch: +500 rows (start=501) | next=1000 | 2571.4 ms
[1:00:24 PM] Batch: +500 rows (start=1001)| next=1500 | 3055.3 ms
...
```

👉 On the same file where **SheetJS hangs the browser**, **xlsx-lite streams rows smoothly**.

---

## ⚡ Quick start

```js
import init, { list_sheets, xlsx_batch_async } from "./pkg/sheetx.js";
await init();

const file = document.querySelector("input[type=file]").files[0];
const bytes = new Uint8Array(await file.arrayBuffer());

const { sheets } = list_sheets(bytes);
const res = await xlsx_batch_async(bytes, sheets[0], 0, 500);

console.log(res.rows); // first 500 rows
```

👉 A responsive demo UI (`demo.html`) is included. Drag-drop a file, stream batches, watch ms timings.

---

## 🔮 Coming soon

* React wrapper: `@xlsx-lite/react` → `useXlsxBatch()` hook
* Vue wrapper: `@xlsx-lite/vue` → `useXlsx()` composition API

---

## 👩‍💻 About

Built for the **Web Dev Community** by [Shyam](https://github.com/Shyam20001)
Repo: **[xlsx-lite](https://github.com/amudhas/xlsx-lite)**

**Async, yield, streams enabled — no workers required.**
Compared to **SheetJS**, which lacks streaming and freezes on big files.

Contributions & feedback welcome 🚀

---