import { createInstallationToken, getInstallationId, signAppJwt } from './github-client'
import { GITHUB_CONFIG } from '@/consts'
import { showToast as toast } from '@/components/GlobalToaster';
import { decrypt, encrypt } from './aes256-util'

const GITHUB_TOKEN_CACHE_KEY = 'github_token'
const GITHUB_PEM_CACHE_KEY = 'p_info'

function getTokenFromCache(): string | null {
	if (typeof sessionStorage === 'undefined') return null
	try {
		return sessionStorage.getItem(GITHUB_TOKEN_CACHE_KEY)
	} catch {
		return null
	}
}

function saveTokenToCache(token: string): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(GITHUB_TOKEN_CACHE_KEY, token)
	} catch (error) {
		console.error('Failed to save token to cache:', error)
	}
}



function clearTokenCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(GITHUB_TOKEN_CACHE_KEY)
	} catch (error) {
		console.error('Failed to clear token cache:', error)
	}
}

export async function getPemFromCache(): Promise<string | null> {
	if (typeof localStorage === 'undefined') return null
	try {
		// 解密缓存中的 pem
		const encryptedPem = localStorage.getItem(GITHUB_PEM_CACHE_KEY)
		if (!encryptedPem) return null
		return await decrypt(encryptedPem, GITHUB_CONFIG.ENCRYPT_KEY)
	} catch {
		return null
	}
}

export async function savePemToCache(pem: string): Promise<void> {
	if (typeof localStorage === 'undefined') return
	try {
		// 加密 pem 后存储
		const encryptedPem = await encrypt(pem, GITHUB_CONFIG.ENCRYPT_KEY)
		localStorage.setItem(GITHUB_PEM_CACHE_KEY, encryptedPem)
		// 触发自定义事件通知其他孤岛
		window.dispatchEvent(new Event('auth-state-changed'));
	} catch (error) {
		console.error('Failed to save pem to cache:', error)
	}
}

function clearPemCache(): void {
	if (typeof localStorage === 'undefined') return
	try {
		localStorage.removeItem(GITHUB_PEM_CACHE_KEY)
		window.dispatchEvent(new Event('auth-state-changed'));
	} catch (error) {
		console.error('Failed to clear pem cache:', error)
	}
}

export function clearAllAuthCache(): void {
	clearTokenCache()
	clearPemCache()
}

export async function hasAuth(): Promise<boolean> {
	return !!getTokenFromCache() || !!(await getPemFromCache())
}

/**
 * 统一的认证 Token 获取
 * 自动处理缓存、签发等逻辑
 * @param manualPrivateKey 可选，手动传入私钥进行验证（不使用缓存/Store中的私钥）
 * @returns GitHub Installation Token
 */
export async function getAuthToken(manualPrivateKey?: string): Promise<string> {
	// 1. 如果没有手动传入私钥，先尝试从缓存获取 token
	if (!manualPrivateKey) {
		const cachedToken = getTokenFromCache()
		if (cachedToken) {
			return cachedToken
		}
	}

	// 2. 获取私钥
	const privateKey = manualPrivateKey || await getPemFromCache()
	if (!privateKey) {
		throw new Error('需要先设置私钥。请先导入 PEM 密钥。')
	}

	const toastId = toast.loading('正在验证 GitHub 身份...')
	try {
		const jwt = signAppJwt(GITHUB_CONFIG.APP_ID, privateKey)
		const installationId = await getInstallationId(jwt, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO)
		const token = await createInstallationToken(jwt, installationId)

		if (!manualPrivateKey) {
			saveTokenToCache(token)
		}
		toast.success('身份验证成功', { id: toastId })
		return token
	} catch (error: any) {
		toast.error('认证失败: ' + error.message, { id: toastId })
		throw error
	}
}
