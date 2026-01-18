
import React, { useState, useRef } from 'react';
import { toast, Toaster } from 'sonner';
import { Loader2, Image as ImageIcon, Send, X } from 'lucide-react';
import { putFile, getFileSha, readTextFileFromRepo, toBase64Utf8 } from '@/lib/github-client';
import { readFileAsText } from '@/lib/file-utils';
import { useAuthStore } from '@/components/write/hooks/use-auth';
import { GITHUB_CONFIG } from '@/consts';

interface Moment {
    id: string;
    content: string;
    images: string[];
    createdAt: string;
    tags: string[];
}

export default function MomentsEditor() {
    const { isAuth, setPrivateKey, getAuthToken } = useAuthStore();

    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const keyInputRef = useRef<HTMLInputElement>(null);

    const { APP_ID, OWNER, REPO, BRANCH } = GITHUB_CONFIG;

    const onChoosePrivateKey = async (file: File) => {
        try {
            const pem = await readFileAsText(file);
            if (!pem.includes('BEGIN RSA PRIVATE KEY') && !pem.includes('BEGIN PRIVATE KEY')) {
                throw new Error('Invalid PEM file');
            }
            setPrivateKey(pem);
            toast.success('密钥导入成功');
        } catch (e) {
            console.error(e);
            toast.error('密钥导入失败');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleImportOrPublish = () => {
        if (!isAuth) {
            keyInputRef.current?.click();
            return;
        }
        handleSubmit();
    };

    const handleSubmit = async () => {
        if (!content.trim() && files.length === 0) return toast.error('Content cannot be empty');
        if (APP_ID === '-' || !OWNER || !REPO) {
            toast.error('Missing configuration for GitHub App');
            return;
        }

        setLoading(true);
        setStatus('Authenticating...');

        try {
            // 1. Authenticate
            const token = await getAuthToken();

            // 2. Upload Images
            const uploadedImages: string[] = [];
            if (files.length > 0) {
                setStatus(`Uploading ${files.length} images...`);
                for (const file of files) {
                    const buffer = await file.arrayBuffer();
                    const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                    const ext = file.name.split('.').pop() || 'jpg';
                    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const path = `public/images/moments/${filename}`;

                    await putFile(
                        token,
                        OWNER,
                        REPO,
                        path,
                        base64,
                        `Upload moment image: ${filename}`,
                        BRANCH
                    );
                    uploadedImages.push(`/images/moments/${filename}`);
                }
            }

            // 3. Update JSON
            setStatus('Updating feed...');
            const jsonPath = 'src/data/moments.json';

            // Get current content
            let currentMoments: Moment[] = [];

            try {
                const fileData = await readTextFileFromRepo(token, OWNER, REPO, jsonPath, BRANCH);
                if (fileData) {
                    currentMoments = JSON.parse(fileData);
                }
            } catch (e) {
                console.warn('Could not read existing moments, starting fresh', e);
            }

            const newMoment: Moment = {
                id: crypto.randomUUID(),
                content,
                images: uploadedImages,
                createdAt: new Date().toISOString(),
                tags: []
            };

            const updatedMoments = [newMoment, ...currentMoments];
            const contentBase64 = toBase64Utf8(JSON.stringify(updatedMoments, null, 2));

            await putFile(
                token,
                OWNER,
                REPO,
                jsonPath,
                contentBase64,
                `feat(moments): new post ${newMoment.id}`,
                BRANCH
            );

            toast.success('Moment published! It may take a few minutes to appear.');
            setContent('');
            setFiles([]);
            setStatus('');
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to publish: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-base-100 border border-base-200 shadow-sm rounded-xl p-4 mb-8 transition-all hover:shadow-md">
            <Toaster
                richColors
                position="top-center"
                toastOptions={{
                    className: 'shadow-2xl border-2 border-base-200',
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
            {/* Hidden Key Input */}
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

            {/* Editor Area */}
            <div className="relative">
                <textarea
                    className="textarea textarea-ghost w-full min-h-[100px] text-lg leading-relaxed resize-none focus:bg-base-200/50 transition-colors p-2 placeholder:text-base-content/30"
                    placeholder="What's happening?"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                ></textarea>

                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 mb-2 px-2">
                        {files.map((file, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-base-200 group">
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeFile(i)}
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-200 px-2">
                    <div className="flex items-center gap-2">
                        <label className="btn btn-ghost btn-sm btn-circle text-primary tooltip tooltip-bottom" data-tip="Add Image">
                            <ImageIcon className="w-5 h-5" />
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-primary btn-sm px-6 rounded-full shadow-lg shadow-primary/20"
                            onClick={handleImportOrPublish}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                isAuth ? (
                                    <>
                                        <Send className="w-3 h-3" />
                                        Post
                                    </>
                                ) : (
                                    <>Import Key</>
                                )
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
