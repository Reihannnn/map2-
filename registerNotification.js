// src/registerPushNotification.js
const vapidPublicKey = "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
const API_BASE = "https://story-api.dicoding.dev";

export async function subscribeUser() {
  if (!("serviceWorker" in navigator)) return;
  if (!("PushManager" in window)) return;
  
  // Minta izin notifikasi
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("User menolak izin notifikasi");
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
  
  // Subscribe user
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  });
  console.log("✅ Push Subscription didapat:", subscription);
  
  const token = localStorage.getItem("token");
  
  // fetching post notif
  const res = await fetch(`${API_BASE}/v1/notifications/subscribe`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subscription),
  });
  const data = await res.json() 

  console.log(data.message)
  alert("Subscribed to push notifications!" );
  
}

// unsubscribe notification
export async function unsubscribeUser() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if(subscription){
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/v1/notifications/subscribe` , {
      method : 'DELETE',
      headers : {
        'Authorization' : `Bearer ${token}`,
        'Content-Type'  : 'application/json'
      },
      body : JSON.stringify({endpoint: subscription.endpoint })
    })

    await subscription.unsubscribe()
    alert("Unsubscribed from push notifications");
  }
}

// base64 to int8array 
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
