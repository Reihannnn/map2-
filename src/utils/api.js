import { subscribeUser } from "../../registerNotification";
import { saveStories } from "./db";
// import { addStory } from "./db";
// // take data from indexed db
// import { getUserByEmail } from "./db";
// import { addUser } from "./db";

// src/utils/api.js

// api base = https://story-api.dicoding.dev
export const API_BASE = "https://story-api.dicoding.dev"; // gunakan proxy dev-server

async function requestJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  // jika status non-OK, coba parsing body (untuk pesan error)
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { error: true, message: "Invalid JSON" };
  }
  if (!res.ok) {
    // lempar error agar pemanggil bisa menanganinya
    const errMsg = data && data.message ? data.message : `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// apiRegister
export async function apiRegister(name, email, password) {
  const res = await fetch(`${API_BASE}/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

//apiLogin
export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/v1/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!data.error) {
    localStorage.setItem("token", data.loginResult.token);
    localStorage.setItem("userName", data.loginResult.name);
    subscribeUser();
  }

  return data;
}

// apiPostStory with authentication
export async function apiPostStory(formData) {
  const token = localStorage.getItem("token");
  const url_enpoint = token ? `/v1/stories` : `/v1/stories/guest`; // ternary operator for have account of guest

  const res = await fetch(`${API_BASE}${url_enpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();

  return data;
}

// post story guest `API` ==>  'https://story-api.dicoding.dev/v1/stories/guest'
// apiPostStroy without authentication

export async function apiGetStories({ page, size, location } = {}) {
  const token = localStorage.getItem("token");

  // Susun URL dasar
  let url = `${API_BASE}/v1/stories`;

  // Susun query string hanya kalau ada parameternya
  const params = [];
  if (page !== undefined) params.push(`page=${page}`);
  if (size !== undefined) params.push(`size=${size}`);
  if (location !== undefined) params.push(`location=${location}`);

  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Gagal mengambil stories");
  const data = await res.json();

  if (data.listStory && data.listStory.length > 0) {
    await saveStories(data.listStory || []);
  }

  return data;
}

export async function apiGetStoriesSpecific(id) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/v1/stories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  return data;
}

// Helper konversi file ke base64
// function fileToBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }
