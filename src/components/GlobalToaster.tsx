import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import 'sonner/dist/styles.css';

export default function GlobalToaster() {
    useEffect(() => {
        const handleGlobalToast = (e: any) => {
            const { type, message, options } = e.detail || {};
            if (!message) return;

            const toastFn = (toast as any)[type] || toast;
            toastFn(message, options);
        };

        window.addEventListener('app:toast', handleGlobalToast);

        return () => {
            window.removeEventListener('app:toast', handleGlobalToast);
        };
    }, []);

    return (
        <Toaster
            richColors
            position="top-right"
            closeButton
            toastOptions={{
                className: 'bg-base-100 border border-base-200 shadow-xl text-base-content',
                style: {
                    background: 'var(--fallback-b1,oklch(var(--b1)/1))',
                    color: 'var(--fallback-bc,oklch(var(--bc)/1))',
                    border: '1px solid var(--fallback-b2,oklch(var(--b2)/1))',
                    minWidth: '320px',
                    maxWidth: '420px',
                    padding: '16px',
                    borderRadius: '12px',
                },
                classNames: {
                    toast: 'flex items-start gap-3',
                    title: 'text-base font-bold',
                    description: 'text-sm opacity-90',
                    closeButton: 'bg-base-200 hover:bg-base-300',
                }
            }}
        />
    );
}

// 导出全局触发函数供其他环境使用，模拟 sonner 的 API
export const showToast = (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'default', message, options } }));
    }
};

showToast.success = (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', message, options } }));
    }
};

showToast.error = (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', message, options } }));
    }
};

showToast.info = (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'info', message, options } }));
    }
};

showToast.warning = (message: string, options?: any) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'warning', message, options } }));
    }
};

showToast.loading = (message: string, options?: any) => {
    const id = options?.id || Math.random().toString(36).substring(2, 9);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'loading', message, options: { ...options, id } } }));
    }
    return id; // 返回 ID 以便后续更新
};
