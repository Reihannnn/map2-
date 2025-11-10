// views/home.js
import { apiGetStories } from "../utils/api";
import StoryCard from "../components/storyCard";
import { saveStories, getStories } from "../utils/db";
import { showLocalNotification } from "../utils/showNotification";
import belIcon from "../image/bel.png";
import tandaSeruIcon from "../image/tanda-seru.png";
import { subscribeUser, unsubscribeUser } from "../../registerNotification";

export default function Home() {
  const el = document.createElement("section");
  el.className = "container";
  el.innerHTML = `
    <h1>Home</h1>
    
    <p>Daftar Story dengan peta singkat. Klik marker pada panel kanan untuk melihat lokasi.</p>
    <div class="grid">
      <div id="list" aria-live="polite"></div>
      <div id="map-panel">
        <div id="map" aria-label="Peta Story"></div>
      </div>
    </div>
  `;


  //  const notifButton = el.querySelector("#active-notifikasi");

  // if (notifButton) {
  // // 🔹 Cek status notifikasi terakhir dari localStorage
  // const savedNotifStatus = localStorage.getItem("notifActive") === "true";

  // notifButton.dataset.active = savedNotifStatus ? "true" : "false";
  // notifButton.innerHTML = savedNotifStatus
  //   ? `<div style="display:flex; align-items:center; gap:8px;">
  //        Nonaktifkan Notifikasi <img src="${tandaSeruIcon}" />
  //      </div>`
  //   : `<div style="display:flex; align-items:center; gap:8px;">
  //        Aktifkan Notifikasi <img src="${belIcon}" />
  //      </div>`;

  // notifButton.addEventListener("click", () => {
    // const isActive = notifButton.dataset.active === "true";

    // if (isActive) {
    //   unsubscribeUser();
    //   notifButton.dataset.active = "false";
    //   notifButton.innerHTML = `
    //     <div style="display:flex; align-items:center; gap:8px;">
    //       Aktifkan Notifikasi <img src="${belIcon}" />
    //     </div>
    //   `;
    //   localStorage.setItem("notifActive", "false"); // 🔹 simpan status
    // } else {
    //   subscribeUser();
    //   notifButton.dataset.active = "true";
    //   notifButton.innerHTML = `
    //     <div style="display:flex; align-items:center; gap:8px;">
    //       Nonaktifkan Notifikasi <img src="${tandaSeruIcon}" />
    //     </div>
    //   `;
    //   localStorage.setItem("notifActive", "true"); // 🔹 simpan status
    // }
  // });
// }

  setTimeout(async () => {
    const listEl = el.querySelector("#list");
    listEl.innerHTML = `<div class="center">Memuat data...</div>`;
    try {
      const data = await apiGetStories({ page: 1, size: 20, location: 1 });
      const stories = data.listStory || data.list || [];
      listEl.innerHTML = "";

      const L = (await import("leaflet")).default;
      const mapDiv = el.querySelector("#map");
      mapDiv.style.height = "420px";
      const map = L.map(mapDiv).setView([0, 0], 2);
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "© OpenStreetMap" }
      ).addTo(map);
      const topo = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        { attribution: "© OpenTopoMap" }
      );
      L.control.layers({ OSM: osm, Topo: topo }).addTo(map);

      const markers = [];
      const savedStories = await getStories(); // 🔹 ambil semua story yang sudah disimpan duluan

      stories.forEach((s) => {
        const card = StoryCard(s);

        // Cek apakah story sudah tersimpan
        const alreadySaved = savedStories.some((item) => item.id === s.id);

        const actionDiv = document.createElement("div");
        actionDiv.style.marginTop = "8px";
        actionDiv.innerHTML = `
          <button class="fav-btn" style="margin-right: 8px;">
            ${alreadySaved ? "❤️" : "♡"}
          </button>
          <button class="delete-btn">🗑️ Hapus</button>
        `;
        card.appendChild(actionDiv);

        const favBtn = actionDiv.querySelector(".fav-btn");
        // Jika sudah tersimpan, tombol dinonaktifkan
        if (alreadySaved) {
          favBtn.disabled = true;
          favBtn.style.opacity = "0.6";
        }

        // Tombol Favorit (simpan story baru)
        favBtn.addEventListener("click", async () => {
          try {
            const savedStoriesNow = await getStories();
            const alreadySavedNow = savedStoriesNow.find(
              (item) => item.id === s.id
            );

            if (alreadySavedNow) {
              showLocalNotification("story ini sudah ada di database");
            } else {
              await saveStories([s]);
              favBtn.textContent = "❤️";
              favBtn.disabled = true;
              favBtn.style.opacity = "0.6";
              showLocalNotification("story berhasil disimpan ke indexedDB");
              console.log(`Story "${s.name}" (${s.id}) disimpan ke IndexedDB`);
            }
          } catch (err) {
            console.error("Gagal menyimpan ke IndexedDB:", err);
            alert("Gagal menyimpan story");
          }
        });

        // Tombol Hapus
        const deleteBtn = actionDiv.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", () => {
          card.remove();
          showLocalNotification("story berhasil dihapus");
          if (s.lat && s.lon) {
            const markerToRemove = markers.find((m) => {
              const pos = m.getLatLng();
              return pos.lat === s.lat && pos.lng === s.lon;
            });
            if (markerToRemove) map.removeLayer(markerToRemove);
          }
        });

        listEl.appendChild(card);

        if (s.lat && s.lon) {
          const marker = L.marker([s.lat, s.lon]).addTo(map);
          marker.bindPopup(
            `<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(
              s.description || ""
            )}`
          );
          marker.on("click", () => {
            document
              .querySelectorAll(".story-card")
              .forEach((c) => (c.style.background = ""));
            card.style.background = "#f0fdfa";
            card.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          markers.push(marker);
        }
      });

      if (markers.length) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    } catch (err) {
      listEl.innerHTML = `<div class="error">Gagal memuat data: ${err.message}</div>`;
      console.error(err);
    }
  }, 60);

  return el;
}

function escapeHtml(s = "") {
  return (s + "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
