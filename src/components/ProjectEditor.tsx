import React, { useState, useEffect, useRef } from 'react';
import { showToast as toast } from '@/components/GlobalToaster';
import { Loader2, Plus, GripVertical, Trash2, X } from 'lucide-react';
import { putFile, readTextFileFromRepo, toBase64Utf8 } from '@/lib/github-client';
import { useAuthStore } from '@/components/write/hooks/use-auth';
import { GITHUB_CONFIG } from '@/consts';
import { readFileAsText } from '@/lib/file-utils';
import localData from '@/data/projects.json';

interface ProjectItem {
    name: string;
    avatar: string;
    description: string;
    url: string;
    badge?: string;
}

export default function ProjectEditor() {
    const { isAuth, getAuthToken, setPrivateKey } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<ProjectItem[]>(localData as ProjectItem[]);
    const [isOpen, setIsOpen] = useState(false);

    const keyInputRef = useRef<HTMLInputElement>(null);

    const { OWNER, REPO, BRANCH } = GITHUB_CONFIG;
    const FILE_PATH = 'src/data/projects.json';

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
            }
        } catch (e: any) {
            console.error('Error loading remote data, using local fallback:', e);
            toast.error('Could not load latest data from GitHub, editing local copy.');
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
        if (!confirm('Are you sure you want to save changes? This will commit to GitHub.')) return;

        setLoading(true);
        const toastId = toast.loading('Saving changes...');

        try {
            const token = await getAuthToken();
            const contentBase64 = toBase64Utf8(JSON.stringify(data, null, 2));

            await putFile(
                token,
                OWNER,
                REPO,
                FILE_PATH,
                contentBase64,
                'feat: update project data',
                BRANCH
            );

            toast.success('Changes saved successfully!', { id: toastId });
            setTimeout(() => window.location.reload(), 1500);
        } catch (e: any) {
            console.error(e);
            toast.error('Failed to save: ' + e.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setData([...data, {
            name: 'New Project',
            avatar: '',
            description: 'Project Description',
            url: 'https://',
            badge: 'Tag'
        }]);
    };

    const updateItem = (index: number, field: keyof ProjectItem, value: string) => {
        const newData = [...data];
        newData[index][field] = value;
        setData(newData);
    };

    const removeItem = (index: number) => {
        if (!confirm('Delete this project?')) return;
        const newData = [...data];
        newData.splice(index, 1);
        setData(newData);
    };

    return (
        <>

            {!isOpen ? (
                <>
                    <button
                        onClick={handleOpen}
                        className={`btn btn-circle shadow-sm ${isAuth ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
                        title={isAuth ? "Edit Projects" : "Import Key to Edit"}
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
                    <div className="max-w-5xl mx-auto p-4 md:p-10 min-h-screen">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <GripVertical className="w-8 h-8 text-primary" />
                                Edit Projects
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
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    {data.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-base-200/50 p-3 rounded-lg shadow-sm group hover:shadow-md transition-shadow border border-base-200">
                                            <div className="col-span-12 md:col-span-3">
                                                <input
                                                    placeholder="Name"
                                                    value={item.name}
                                                    onChange={e => updateItem(index, 'name', e.target.value)}
                                                    className="input input-sm input-bordered w-full font-bold"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-4">
                                                <input
                                                    placeholder="Description"
                                                    value={item.description}
                                                    onChange={e => updateItem(index, 'description', e.target.value)}
                                                    className="input input-sm input-bordered w-full"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-2">
                                                <input
                                                    placeholder="URL"
                                                    value={item.url}
                                                    onChange={e => updateItem(index, 'url', e.target.value)}
                                                    className="input input-sm input-bordered w-full text-blue-500"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-1">
                                                <input
                                                    placeholder="Icon URL"
                                                    value={item.avatar}
                                                    onChange={e => updateItem(index, 'avatar', e.target.value)}
                                                    className="input input-sm input-bordered w-full text-xs"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-1">
                                                <input
                                                    placeholder="Badge"
                                                    value={item.badge || ''}
                                                    onChange={e => updateItem(index, 'badge', e.target.value)}
                                                    className="input input-sm input-bordered w-full text-xs"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-1 flex justify-end">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="btn btn-ghost btn-xs btn-square text-error opacity-20 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-base-200">
                                    <button onClick={addItem} className="btn btn-outline gap-2">
                                        <Plus className="w-4 h-4" /> Add Project
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
