function clearAuth() {
  localStorage.removeItem('album_token');
  localStorage.removeItem('album_user');
}

async function request(method, path, body) {
  const token = localStorage.getItem('album_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  if (res.status === 401) clearAuth();

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.message || 'Error');
    err.response = { data: json, status: res.status };
    throw err;
  }
  return { data: json };
}

const api = {
  get(path, { params } = {}) {
    const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
    return request('GET', path + qs);
  },
  post: (path, body) => request('POST', path, body)
};

export default api;
