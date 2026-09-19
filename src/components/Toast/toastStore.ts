import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. `0` disables auto-dismiss. @default 5000 */
  duration?: number;
  action?: ToastAction;
}

export interface ToastRecord {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

interface ToastStoreState {
  toasts: ToastRecord[];
  add: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let counter = 0;

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  add: (options) => {
    const id = `toast-${++counter}`;
    const record: ToastRecord = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 5000,
      action: options.action,
    };
    set((state) => ({ toasts: [...state.toasts, record] }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

function withVariant(variant: ToastVariant) {
  return (title: string, options?: Omit<ToastOptions, 'title' | 'variant'>) =>
    useToastStore.getState().add({ ...options, title, variant });
}

/**
 * Imperative API for pushing toasts from anywhere — event handlers, data
 * loaders, etc. — without threading a context through the tree. Backed by a
 * tiny zustand store so the `<Toaster />` viewport re-renders on change.
 */
export const toast = Object.assign((options: ToastOptions) => useToastStore.getState().add(options), {
  info: withVariant('info'),
  success: withVariant('success'),
  warning: withVariant('warning'),
  error: withVariant('error'),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
});
