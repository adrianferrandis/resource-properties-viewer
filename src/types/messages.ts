// Messages FROM extension TO webview
export type ExtensionMessage =
  | { type: 'init'; model: BundleModel }
  | { type: 'update'; model: BundleModel }
  | { type: 'error'; message: string };

// Messages FROM webview TO extension
export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'edit'; key: string; locale: string | null; value: string }
  | { type: 'addKey'; key: string }
  | { type: 'deleteKey'; key: string }
  | { type: 'toggleComment'; key: string; locale: string | null }
  | { type: 'filter'; query: string }
  | { type: 'changeView'; view: 'flat' | 'tree' };

// BundleModel reference - imported from properties.ts
import type { BundleModel } from './properties';