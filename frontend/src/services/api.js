import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    // Remove the global Content-Type header
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type for non-FormData requests
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
});

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/profile'),
};

export const documentAPI = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        // Let axios set Content-Type automatically for FormData
        return api.post('/upload', formData);
    },
    verifyContract: (sessionId) => api.get(`/contract-verify?session_id=${sessionId}`),
    summarizeContract: (sessionId) => api.get(`/contract-summarize?session_id=${sessionId}`),
    suggestClause: (sessionId, clauseName, riskyText = '') =>
        api.get(`/contract-suggest-clause?session_id=${sessionId}&clause_name=${clauseName}&risky_text=${encodeURIComponent(riskyText)}`),
    provideInput: (sessionId, inputData) => api.post('/provide-input', { session_id: sessionId, input_data: inputData }),
    getWorkflowStatus: (sessionId) => api.get(`/workflow-status/${sessionId}`)
};

export default api;
