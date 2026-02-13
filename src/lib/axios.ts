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

// Response interceptor to handle 401 errors (token expired/invalid)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Handle 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

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

                        // Update the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

                        // Retry the original request
                        return api(originalRequest)
                    }
                }
            } catch (refreshError) {
                // Refresh failed - clear everything and redirect
                localStorage.removeItem('auth-storage')
                updateCachedToken(null)
                window.location.href = '/user/login'
                return Promise.reject(refreshError)
            }
            
            // No refresh token available - logout
            localStorage.removeItem('auth-storage')
            updateCachedToken(null)
            window.location.href = '/user/login'
        }
        
        return Promise.reject(error)
    }
)

export default api