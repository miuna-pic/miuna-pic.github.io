import React, { useState, useEffect, useRef } from 'react';
import { showToast as toast } from '@/components/GlobalToaster';
import { Loader2, Plus, GripVertical, Trash2, X } from 'lucide-react';
import { putFile, readTextFileFromRepo, toBase64Utf8 } from '@/lib/github-client';
import { useAuthStore } from '@/components/write/hooks/use-auth';
import { GITHUB_CONFIG } from '@/consts';
import { readFileAsText } from '@/lib/file-utils';
import localData from '@/data/navigation.json';


interface NavItem {
    name: string;
    avatar: string;
    description: string;
    url: string;
    category: string;
    id?: string;
    badge?: string;
    badgeIcon?: string;
    badgeColor?: string;
}

interface NavCategory {
    title: string;
    icon: string;
    items: NavItem[];
}

export default function NavigationEditor() {
    const { isAuth, getAuthToken, setPrivateKey } = useAuthStore();
    const [loading, setLoading] = useState(false);
    // Initialize with local data so it's never empty
    const [data, setData] = useState<NavCategory[]>(localData as NavCategory[]);
    const [isOpen, setIsOpen] = useState(false);

    const keyInputRef = useRef<HTMLInputElement>(null);

    const { OWNER, REPO, BRANCH } = GITHUB_CONFIG;
    const FILE_PATH = 'src/data/navigation.json';

    const fetchData = async () => {
        if (!isAuth) return;
        setLoading(true);
        try {
            const token = await getAuthToken();
            const content = await readTextFileFromRepo(token, OWNER, REPO, FILE_PATH, BRANCH);
            if (content) {
                setData(JSON.parse(content));
            } else {
                console.warn('Remote file not found, using local data');
                // If remote is empty/missing, we stick with localData derived initial state
            }
        } catch (e: any) {
            console.error('Error loading remote data, using local fallback:', e);
            toast.error('无法从 GitHub 加载最新数据，将编辑本地副本。');
            // We already have localData in state, so we just let the user edit that.
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuth && isOpen) {
            fetchData();
        }
    }, [isAuth, isOpen]);

    const handleOpen = () => {
        if (!isAuth) {
            keyInputRef.current?.click();
        } else {
            setIsOpen(true);
        }
    };

    const onChoosePrivateKey = async (file: File) => {
        try {
            const pem = await readFileAsText(file);
            // 立即尝试获取 Token 以验证密钥并显示认证进度通知
            await getAuthToken(pem);

            // 验证通过后，再保存到 Store 和缓存
            await setPrivateKey(pem);
            toast.success('🔑 私钥导入成功');
            setIsOpen(true);
        } catch (e) {
            console.error(e);
            toast.error('❌ 密钥验证失败，请检查密钥是否正确');
        }
    };

    const handleSave = async () => {
        if (!confirm('确定保存更改吗？这将直接推送到 GitHub。')) return;

        setLoading(true);
        const toastId = toast.loading('正在保存更改...');

        try {
            const token = await getAuthToken();
            const contentBase64 = toBase64Utf8(JSON.stringify(data, null, 4));

            await putFile(
                token,
                OWNER,
                REPO,
                FILE_PATH,
                contentBase64,
                'feat(nav): update navigation data',
                BRANCH
            );

            toast.success('更改保存成功！', { id: toastId });
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            console.error(e);
            toast.error('保存失败: ' + e.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const updateCategory = (index: number, field: keyof NavCategory, value: string) => {
        const newData = [...data];
        // @ts-ignore
        newData[index][field] = value;
        setData(newData);
    };

    const addCategory = () => {
        setData([...data, { title: 'New Category', icon: 'lucide:folder', items: [] }]);
    };

    const removeCategory = (index: number) => {
        if (!confirm('Delete this category?')) return;
        const newData = [...data];
        newData.splice(index, 1);
        setData(newData);
    };

    const addItem = (catIndex: number) => {
        const newData = [...data];
        newData[catIndex].items.push({
            name: 'New Site',
            avatar: '',
            description: 'New Description',
            url: 'https://',
            category: newData[catIndex].title,
            id: crypto.randomUUID()
        });
        setData(newData);
    };

    const updateItem = (catIndex: number, itemIndex: number, field: keyof NavItem, value: string) => {
        const newData = [...data];
        // @ts-ignore
        newData[catIndex].items[itemIndex][field] = value;
        setData(newData);
    };

    const removeItem = (catIndex: number, itemIndex: number) => {
        const newData = [...data];
        newData[catIndex].items.splice(itemIndex, 1);
        setData(newData);
    };

    return (
        <>

            {!isOpen ? (
                <>
                    <button
                        onClick={handleOpen}
                        className={`btn btn - circle shadow - sm ${isAuth ? 'btn-primary' : 'btn-ghost bg-base-100'} `}
                        title={isAuth ? "Edit Navigation" : "Import Key to Edit"}
                    >
                        <GripVertical className="w-5 h-5" />
                    </button>
                    <input
                        ref={keyInputRef}
                        type='file'
                        accept='.pem'
                        className='hidden'
                        onChange={async e => {
                            const f = e.target.files?.[0];
                            if (f) await onChoosePrivateKey(f);
                            if (e.currentTarget) e.currentTarget.value = '';
                        }}
                    />
                </>
            ) : (
                <div className="fixed inset-0 bg-base-100 z-[100] overflow-y-auto">
                    <div className="max-w-6xl mx-auto p-4 md:p-10 min-h-screen">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <GripVertical className="w-8 h-8 text-primary" />
                                Edit Navigation
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="btn btn-ghost btn-circle"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {loading && data.length === 0 ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {data.map((cat, catIndex) => (
                                    <div key={catIndex} className="bg-base-200/50 rounded-xl p-4 border border-base-200">
                                        {/* Category Header */}
                                        <div className="flex gap-4 mb-4 items-center">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="form-control">
                                                    <label className="label text-xs font-bold text-base-content/60">CATEGORY TITLE</label>
                                                    <input
                                                        value={cat.title}
                                                        onChange={e => updateCategory(catIndex, 'title', e.target.value)}
                                                        className="input input-sm input-bordered w-full"
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label text-xs font-bold text-base-content/60">ICON (Lucide / Iconify)</label>
                                                    <input
                                                        value={cat.icon}
                                                        onChange={e => updateCategory(catIndex, 'icon', e.target.value)}
                                                        className="input input-sm input-bordered w-full font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeCategory(catIndex)}
                                                className="btn btn-ghost btn-sm btn-square text-error mt-6"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Items Grid */}
                                        <div className="space-y-3 pl-4 border-l-2 border-base-300">
                                            {cat.items.map((item, itemIndex) => (
                                                <div key={itemIndex} className="bg-base-100 p-3 rounded-lg shadow-sm group hover:shadow-md transition-shadow border border-base-200">
                                                    <div className="grid grid-cols-12 gap-2 items-center mb-2">
                                                        <div className="col-span-12 md:col-span-3">
                                                            <input
                                                                placeholder="Name"
                                                                value={item.name}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'name', e.target.value)}
                                                                className="input input-xs input-bordered w-full font-bold"
                                                            />
                                                        </div>
                                                        <div className="col-span-12 md:col-span-4">
                                                            <input
                                                                placeholder="Description"
                                                                value={item.description}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'description', e.target.value)}
                                                                className="input input-xs input-bordered w-full"
                                                            />
                                                        </div>
                                                        <div className="col-span-12 md:col-span-3">
                                                            <input
                                                                placeholder="URL"
                                                                value={item.url}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'url', e.target.value)}
                                                                className="input input-xs input-bordered w-full text-blue-500"
                                                            />
                                                        </div>
                                                        <div className="col-span-12 md:col-span-1">
                                                            <input
                                                                placeholder="Icon URL"
                                                                value={item.avatar}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'avatar', e.target.value)}
                                                                className="input input-xs input-bordered w-full"
                                                            />
                                                        </div>
                                                        <div className="col-span-12 md:col-span-1 flex justify-end">
                                                            <button
                                                                onClick={() => removeItem(catIndex, itemIndex)}
                                                                className="btn btn-ghost btn-xs btn-square text-error opacity-20 group-hover:opacity-100"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* Badge Settings Row */}
                                                    <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-base-200/50">
                                                        <div className="col-span-4 md:col-span-3">
                                                            <span className="text-[10px] text-base-content/40 uppercase font-bold px-1">Badge:</span>
                                                            <input
                                                                placeholder="Text (e.g. Hot)"
                                                                value={item.badge || ''}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'badge', e.target.value)}
                                                                className="input input-xs input-ghost w-full"
                                                            />
                                                        </div>
                                                        <div className="col-span-4 md:col-span-3">
                                                            <span className="text-[10px] text-base-content/40 uppercase font-bold px-1">Icon:</span>
                                                            <input
                                                                placeholder="Icon (e.g. lucide:star)"
                                                                value={item.badgeIcon || ''}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'badgeIcon', e.target.value)}
                                                                className="input input-xs input-ghost w-full font-mono"
                                                            />
                                                        </div>
                                                        <div className="col-span-4 md:col-span-3">
                                                            <span className="text-[10px] text-base-content/40 uppercase font-bold px-1">Color:</span>
                                                            <select
                                                                value={item.badgeColor || ''}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'badgeColor', e.target.value)}
                                                                className="select select-ghost select-xs w-full"
                                                            >
                                                                <option value="">Default (Gray)</option>
                                                                <option value="primary">Primary</option>
                                                                <option value="secondary">Secondary</option>
                                                                <option value="accent">Accent</option>
                                                                <option value="info">Info</option>
                                                                <option value="success">Success</option>
                                                                <option value="warning">Warning</option>
                                                                <option value="error">Error</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    {/* Meta Info Row */}
                                                    <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-base-200/50">
                                                        <div className="col-span-6 md:col-span-6">
                                                            <span className="text-[10px] text-base-content/40 uppercase font-bold px-1">Category Label:</span>
                                                            <input
                                                                placeholder="Display Category"
                                                                value={item.category || ''}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'category', e.target.value)}
                                                                className="input input-xs input-ghost w-full"
                                                            />
                                                        </div>
                                                        <div className="col-span-6 md:col-span-6">
                                                            <span className="text-[10px] text-base-content/40 uppercase font-bold px-1">Unique ID:</span>
                                                            <input
                                                                placeholder="ID (e.g. DEV001)"
                                                                value={item.id || ''}
                                                                onChange={e => updateItem(catIndex, itemIndex, 'id', e.target.value)}
                                                                className="input input-xs input-ghost w-full font-mono"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addItem(catIndex)}
                                                className="btn btn-ghost btn-sm btn-block border-dashed border-2 border-base-300 text-base-content/40 hover:border-primary hover:text-primary"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Add Site
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="flex gap-4 pt-4 border-t border-base-200">
                                    <button onClick={addCategory} className="btn btn-outline gap-2">
                                        <Plus className="w-4 h-4" /> Add Category
                                    </button>
                                    <div className="flex-1"></div>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="btn btn-primary px-8 gap-2"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
