import React, { useState } from 'react';
import { showToast as toast } from '@/components/GlobalToaster';
import { Trash2, Loader2 } from 'lucide-react';
import { putFile, readTextFileFromRepo, toBase64Utf8 } from '@/lib/github-client';
import { useAuthStore } from '@/components/write/hooks/use-auth';
import { GITHUB_CONFIG } from '@/consts';

interface MomentDeleteButtonProps {
    id: string;
    className?: string;
}

export default function MomentDeleteButton({ id, className = '' }: MomentDeleteButtonProps) {
    const { isAuth, getAuthToken } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const { OWNER, REPO, BRANCH } = GITHUB_CONFIG;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this moment?')) return;

        if (!isAuth) {
            toast.error('No private key found');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Deleting moment...');

        try {
            // 1. Authenticate
            const token = await getAuthToken();

            // 2. Read JSON
            const jsonPath = 'src/data/moments.json';
            const fileData = await readTextFileFromRepo(token, OWNER, REPO, jsonPath, BRANCH);
            if (!fileData) throw new Error('Could not read data file');

            let moments: any[] = JSON.parse(fileData);
            const originalLength = moments.length;

            // 3. Filter out the item
            moments = moments.filter((m: any) => m.id !== id);

            if (moments.length === originalLength) {
                toast.error('Moment not found in data', { id: toastId });
                return;
            }

            // 4. Write back
            const contentBase64 = toBase64Utf8(JSON.stringify(moments, null, 2));
            await putFile(
                token,
                OWNER,
                REPO,
                jsonPath,
                contentBase64,
                `feat(moments): delete post ${id}`,
                BRANCH
            );

            toast.success('Moment deleted', { id: toastId });

            setTimeout(() => window.location.reload(), 1500);

        } catch (err: any) {
            console.error(err);
            toast.error('Failed to delete: ' + err.message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuth) return null;

    return (
        <>

            <button
                onClick={handleDelete}
                disabled={loading}
                className={`btn btn-ghost btn-xs text-error opacity-50 hover:opacity-100 transition-opacity ${className}`}
                title="Delete Moment"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
        </>
    );
}
