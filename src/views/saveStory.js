import { getStories } from "../utils/db";
import "../styles/favorite.css";

async function deleteStory(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("stories-db", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction("stories", "readwrite");
      tx.objectStore("stories").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = (err) => reject(err);
    };
    request.onerror = (err) => reject(err);
  });
}

async function loadFavorites() {
  const container = document.querySelector("#saved-stories");
  if (!container) {
    console.error("Elemen #saved-stories tidak ditemukan di halaman.");
    return;
  }

  try {
    const stories = await getStories();
    console.log("Stories from DB:", stories);

    if (!stories || stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3>Belum Ada Story Favorit</h3>
          <p>Simpan story favorit Anda untuk akses cepat</p>
          <a href="#/" class="btn-primary">Jelajahi Story</a>
        </div>
      `;
      return;
    }

    container.innerHTML = stories
      .map(
        (story) => `
        <div class="story-card" data-id="${story.id}">
          ${
            story.photoUrl
              ? `
            <div class="story-image">
              <img src="${story.photoUrl}" alt="${
                  story.title || "Story"
                }" loading="lazy">
            </div>
          `
              : ""
          }
          <div class="story-content">
            <h3 class="story-title">${story.description || "Tanpa Judul"}</h3>  
            <p class="story-description">latitude ${
              story.lat || "Tidak ada deskripsi"
            }</p>
            <p class="story-description">longitude ${
              story.lon || "Tidak ada deskripsi"
            }</p>
            <p >${story.description || "Tidak ada deskripsi"}</p>
            
            <div class="story-meta">
              <span class="story-id">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                ${story.name || "Anonymous"}
              </span>
              <span class="story-date">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${
                  story.createdAt
                    ? new Date(story.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Baru saja"
                }
              </span>
              </div>
              <button style = "background-color:red; display:block;" class="tombol-hapus btn" data-id="${
                story.id
              }" title="Hapus dari favorit">
            delete 
          </button>
          </div>
          </div>

        `
      )
      .join("");

    container.querySelectorAll(".tombol-hapus").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const button = e.currentTarget;
        const card = button.closest(".story-card");
        const id = button.dataset.id;

        // Konfirmasi hapus
        if (!confirm("Yakin ingin menghapus story ini dari favorit?")) {
          return;
        }

        try {
          // Animasi hapus
          card.style.animation = "slideOut 0.3s ease-out forwards";

          await new Promise((resolve) => setTimeout(resolve, 300));
          await deleteStory(id);
          card.remove();

          console.log(`Story ${id} berhasil dihapus`);

          const remainingCards = container.querySelectorAll(".story-card");
          if (remainingCards.length === 0) {
            container.innerHTML = `
              <div class="empty-state">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3>Belum Ada Story Favorit</h3>
                <p>Simpan story favorit Anda untuk akses cepat</p>
                <a href="#/" class="btn-primary">Jelajahi Story</a>
              </div>
            `;
          }
        } catch (err) {
          console.error("Gagal menghapus story:", err);
          alert("Gagal menghapus story. Silakan coba lagi.");
        }
      });
    });
  } catch (err) {
    console.error("Gagal mengambil story:", err);
    container.innerHTML = `
      <div class="error-state">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Gagal Memuat Data</h3>
        <p>Terjadi kesalahan saat mengambil data favorit</p>
        <button class="btn-primary" onclick="location.reload()">Coba Lagi</button>
      </div>
    `;
  }
}

export function Favorites() {
  const container = document.createElement("div");
  container.className = "favorites-page";
  container.innerHTML = `
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Story Favorit
          </h1>
          <p>Koleksi story yang telah Anda simpan</p>
        </div>
      </div>
    </div>
    <div id="saved-stories" class="stories-container">
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat story favorit...</p>
      </div>
    </div>
  `;

  setTimeout(() => {
    loadFavorites();
  }, 0);

  return container;
}
