const BASE_URL = "http://localhost:5039/api"

function getToken() {
    return localStorage.getItem("erp_token")
}

async function request(path, options = {}) {
    const method = options.method || "GET"
    const body = options.body
    const headers = options.headers || {}

    const tokenValue = getToken()

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(tokenValue
                ? { Authorization: `Bearer ${tokenValue}` }
                : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))

        throw new Error(
            errorBody.message ||
            `Error ${res.status} en ${path}`
        )
    }

    return res.json().catch(() => null)
}

export const apiClient = {
    get: path => request(path),

    post: (path, body) =>
        request(path, {
            method: "POST",
            body,
        }),

    put: (path, body) =>
        request(path, {
            method: "PUT",
            body,
        }),

    patch: (path, body) =>
        request(path, {
            method: "PATCH",
            body,
        }),

    delete: path =>
        request(path, {
            method: "DELETE",
        }),
}