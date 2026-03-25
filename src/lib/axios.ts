import axios from 'axios'

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Cache for access token to avoid repeated localStorage parsing
let cachedAccessToken: string | null = null

type PersistedAuthState = {
    state?: {
        accessToken?: string | null
        refreshToken?: string | null
        isAuthenticated?: boolean
        [key: string]: any
    }
    [key: string]: any
}

const readAuthStorage = (): PersistedAuthState | null => {
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) return null
    try {
        return JSON.parse(authStorage)
    } catch (error) {
        console.error('Error parsing auth storage:', error)
        return null
    }
}

const writeAuthTokensToStorage = (accessToken: string, refreshToken: string | null) => {
    const parsed = readAuthStorage() || {}
    const previousState = parsed.state || {}
    const next: PersistedAuthState = {
        ...parsed,
        state: {
            ...previousState,
            accessToken,
            refreshToken: refreshToken ?? previousState.refreshToken ?? null,
            isAuthenticated: true,
        },
    }
    localStorage.setItem('auth-storage', JSON.stringify(next))
}

const extractTokensFromRefreshResponse = (payload: any): { accessToken: string; refreshToken: string | null } => {
    // Supports shapes like:
    // { accessToken, refreshToken }
    // { data: { accessToken, refreshToken } }
    // { access_token, refresh_token }
    // { data: { access_token, refresh_token } }
    const source = payload?.data ?? payload ?? {}
    const accessToken = source?.accessToken ?? source?.access_token ?? source?.token ?? null
    const refreshToken = source?.refreshToken ?? source?.refresh_token ?? null

    if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Refresh response missing access token')
    }

    return { accessToken, refreshToken }
}

// Helper to get token from cache or localStorage
const getAccessToken = (): string | null => {
    if (cachedAccessToken) {
        return cachedAccessToken
    }
    const parsed = readAuthStorage()
    cachedAccessToken = parsed?.state?.accessToken || null
    if (cachedAccessToken) return cachedAccessToken
    
    return null
}

// Helper to update cached token
export const updateCachedToken = (token: string | null) => {
    cachedAccessToken = token
}

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken()
        
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void, reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor to handle 401 errors (token expired/invalid)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const requestUrl = originalRequest?.url || ''

        // Handle 401 errors
        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !requestUrl.includes('/api/auth/refresh')
        ) {
            
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return api(originalRequest)
                }).catch(err => {
                    return Promise.reject(err)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                // Get refresh token from localStorage
                const authState = readAuthStorage()
                
                if (authState) {
                    const refreshToken = authState?.state?.refreshToken

                    if (refreshToken) {
                        // Call refresh endpoint
                        const response = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
                            { refreshToken },
                            {
                                headers: { 'Content-Type': 'application/json' }
                            }
                        )

                        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                            extractTokensFromRefreshResponse(response.data)

                        // Update tokens in localStorage
                        writeAuthTokensToStorage(newAccessToken, newRefreshToken)

                        // Update cached token
                        updateCachedToken(newAccessToken)

                        // Process queue
                        processQueue(null, newAccessToken)

                        // Update the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

                        // Retry the original request
                        isRefreshing = false
                        return api(originalRequest)
                    }
                }
            } catch (refreshError) {
                processQueue(refreshError, null)
                // Refresh failed - get login url then clear everything and redirect
                let loginUrl = '/user/login'
                const authStorage = localStorage.getItem('auth-storage')
                if (authStorage) {
                    try {
                        const { state: pState } = JSON.parse(authStorage)
                        const roles = pState?.user?.roles || []
                        if (roles.includes('TASKER') || roles.includes('tasker') || roles.includes('ARTISAN')) {
                            loginUrl = '/tasker/login'
                        }
                    } catch (e) {}
                }
                
                localStorage.removeItem('auth-storage')
                updateCachedToken(null)
                window.location.href = loginUrl
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
            
            // No refresh token available - logout
            processQueue(new Error('No refresh token available'), null)
            let loginUrl = '/user/login'
            const currentAuthStorage = localStorage.getItem('auth-storage')
            if (currentAuthStorage) {
                try {
                    const { state: pState } = JSON.parse(currentAuthStorage)
                    const roles = pState?.user?.roles || []
                    if (roles.includes('TASKER') || roles.includes('tasker') || roles.includes('ARTISAN')) {
                        loginUrl = '/tasker/login'
                    }
                } catch (e) {}
            }
            
            localStorage.removeItem('auth-storage')
            updateCachedToken(null)
            window.location.href = loginUrl
        }

        
        return Promise.reject(error)
    }
)

export default api
