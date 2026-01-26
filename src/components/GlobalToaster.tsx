import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

export default function GlobalToaster() {
    useEffect(() => {
        const handleGlobalToast = (e: any) => {
            const { type, message, options } = e.detail || {};
            if (!message) return;

            // 如果 options 中有 id，sonner 会尝试更新现有的 toast
            switch (type) {
                case 'success': toast.success(message, options); break;
                case 'error': toast.error(message, options); break;
                case 'warning': toast.warning(message, options); break;
                case 'info': toast.info(message, options); break;
                case 'loading': toast.loading(message, options); break;
                default: toast(message, options);
            }
        };

        const handleClearToasts = () => {
            // 在页面切换前清除所有通知，防止样式丢失导致的“鬼影”通知
            toast.dismiss();
        };

        window.addEventListener('app:toast', handleGlobalToast);

        // 监听 Astro 的视图转换事件
        document.addEventListener('astro:before-swap', handleClearToasts);
        document.addEventListener('astro:after-swap', handleClearToasts);

        return () => {
            window.removeEventListener('app:toast', handleGlobalToast);
            document.removeEventListener('astro:before-swap', handleClearToasts);
            document.removeEventListener('astro:after-swap', handleClearToasts);
        };
    }, []);

    return (
        <Toaster
            richColors
            position="top-right"
            toastOptions={{
                className: 'shadow-2xl border-2 border-base-200 rounded-xl',
                style: {
                    fontSize: '1.1rem',
                    padding: '16px 24px',
                },
                classNames: {
                    title: 'text-lg font-bold',
                    description: 'text-base font-medium',
                    error: 'bg-error text-error-content border-error',
                    success: 'bg-success text-success-content border-success',
                    warning: 'bg-warning text-warning-content border-warning',
                    info: 'bg-info text-info-content border-info',
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
