/* tslint:disable */
/* eslint-disable */

/**
 * Persistent incremental CSV parser.
 */
export class CsvSession {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Release the reader and its retained input buffer.
     */
    close(): void;
    constructor(bytes: Uint8Array, start_offset: number, delimiter: number);
    /**
     * Read the next batch without recreating the CSV reader.
     */
    nextBatch(batch_size: number): Promise<any>;
}

/**
 * Persistent incremental worksheet parser.
 *
 * `offset` is the zero-based ordinal of an actual `<row>` element in document
 * order. It is deliberately independent of the physical Excel `r` attribute.
 */
export class XlsxSession {
    free(): void;
    [Symbol.dispose](): void;
    close(): void;
    constructor(bytes: Uint8Array, sheet_name: string, start_offset: number);
    nextBatch(batch_size: number): Promise<any>;
}

export function csv_batch_async(bytes: Uint8Array, offset: number, batch_size: number, delimiter: number): Promise<any>;

export function list_sheets(bytes: Uint8Array): any;

export function start(): void;

/**
 * Compatibility one-shot API. It intentionally delegates to XlsxSession so
 * one-shot and persistent parsing cannot drift into separate implementations.
 */
export function xlsx_batch_async(bytes: Uint8Array, sheet_name: string, offset: number, batch_size: number): Promise<any>;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_csvsession_free: (a: number, b: number) => void;
    readonly __wbg_xlsxsession_free: (a: number, b: number) => void;
    readonly csv_batch_async: (a: any, b: number, c: number, d: number) => any;
    readonly csvsession_close: (a: number) => void;
    readonly csvsession_new: (a: any, b: number, c: number) => [number, number, number];
    readonly csvsession_nextBatch: (a: number, b: number) => any;
    readonly list_sheets: (a: any) => [number, number, number];
    readonly start: () => void;
    readonly xlsx_batch_async: (a: any, b: number, c: number, d: number, e: number) => any;
    readonly xlsxsession_close: (a: number) => void;
    readonly xlsxsession_new: (a: any, b: number, c: number, d: number) => [number, number, number];
    readonly xlsxsession_nextBatch: (a: number, b: number) => any;
    readonly wasm_bindgen_45fbeeb49e4bb391___convert__closures_____invoke___js_sys_5209b8b04c4476b0___Function_fn_wasm_bindgen_45fbeeb49e4bb391___JsValue_____wasm_bindgen_45fbeeb49e4bb391___sys__Undefined___js_sys_5209b8b04c4476b0___Function_fn_wasm_bindgen_45fbeeb49e4bb391___JsValue_____wasm_bindgen_45fbeeb49e4bb391___sys__Undefined_______true_: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen_45fbeeb49e4bb391___convert__closures_____invoke___wasm_bindgen_45fbeeb49e4bb391___JsValue__core_9b3796e30d99ddb7___result__Result_____wasm_bindgen_45fbeeb49e4bb391___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_45fbeeb49e4bb391___convert__closures_____invoke_______true_: (a: number, b: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
