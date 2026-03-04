import axios from 'axios'

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Cache for access token to avoid repeated localStorage parsing
let cachedAccessToken: string | null = null

// Helper to get token from cache or localStorage
const getAccessToken = (): string | null => {
    if (cachedAccessToken) {
        return cachedAccessToken
    }

    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
        try {
            const { state } = JSON.parse(authStorage)
            cachedAccessToken = state?.accessToken || null
            return cachedAccessToken
        } catch (error) {
            console.error('Error parsing auth storage:', error)
        }
    }
    
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

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            
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
                const authStorage = localStorage.getItem('auth-storage')
                
                if (authStorage) {
                    const { state } = JSON.parse(authStorage)
                    const refreshToken = state?.refreshToken

                    if (refreshToken) {
                        // Call refresh endpoint
                        const response = await axios.post(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
                            { refreshToken },
                            {
                                headers: { 'Content-Type': 'application/json' }
                            }
                        )

                        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data

                        // Update tokens in localStorage
                        state.accessToken = newAccessToken
                        state.refreshToken = newRefreshToken
                        localStorage.setItem('auth-storage', JSON.stringify({ state }))

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
