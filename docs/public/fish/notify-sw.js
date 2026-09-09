self.addEventListener("install", (event) => {
  console.log("Inside the install handler:", event);
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Inside the activate handler:", event);
  event.waitUntil(self.clients.claim());
});

async function broadcast(payload) {
  const list = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const c of list) c.postMessage(payload);
}

async function getAppDataRaw() {
  const cache = await caches.open("oasis-fish-sw");
  const key = new Request("/__sw_oasis_fish_data__", { method: "GET" });
  const res = await cache.match(key);
  return res ? await res.text() : null;
}

async function setAppDataRaw(raw) {
  const cache = await caches.open("oasis-fish-sw");
  const key = new Request("/__sw_oasis_fish_data__", { method: "GET" });
  await cache.put(key, new Response(raw, { headers: { "Content-Type": "application/json" } }));
}

async function maybeNotifyWaterChange({ force = false } = {}) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

  const raw = await getAppDataRaw();
  if (!raw) {
    await broadcast({ type: "OASIS_SW_DEBUG", ok: false, reason: "no_app_data" });
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    await broadcast({ type: "OASIS_SW_DEBUG", ok: false, reason: "bad_json" });
    return;
  }

  const lastWaterChangeAt = data?.lastWaterChangeAt;
  if (!lastWaterChangeAt) {
    await broadcast({ type: "OASIS_SW_DEBUG", ok: false, reason: "no_lastWaterChangeAt" });
    return;
  }

  const last = new Date(lastWaterChangeAt);
  if (Number.isNaN(last.getTime())) {
    await broadcast({ type: "OASIS_SW_DEBUG", ok: false, reason: "bad_lastWaterChangeAt" });
    return;
  }

  const due = addDays(last, 7);
  const remindStart = addDays(due, -1);
  const today = startOfDay(new Date());
  const inWindow = today >= startOfDay(remindStart) && today <= startOfDay(due);

  await broadcast({
    type: "OASIS_SW_DEBUG",
    ok: true,
    lastWaterChangeAt,
    due: due.toISOString(),
    remindStart: remindStart.toISOString(),
    today: today.toISOString(),
    inWindow,
    force,
  });

  if (!inWindow && !force) return;

  const cache = await caches.open("oasis-fish-sw");
  const notifyKey = new Request("/__sw_last_water_change_notify__", { method: "GET" });
  const todayKey = today.toISOString().slice(0, 10);
  if (!force) {
    const lastNotified = await cache.match(notifyKey);
    if (lastNotified && (await lastNotified.text()) === todayKey) {
      await broadcast({ type: "OASIS_SW_DEBUG", ok: true, skipped: "already_notified_today" });
      return;
    }
  }

  await self.registration.showNotification("鱼缸需要换水", {
    body: "鱼缸需要换水",
    icon: "/icon-192x192.png",
    badge: "/badge-96x96.png",
  });
  await cache.put(notifyKey, new Response(todayKey));
  await broadcast({ type: "OASIS_SW_DEBUG", ok: true, notified: true });
}

// 从页面接收持久化数据（SW 不能直接读 localStorage）
self.addEventListener("message", (event) => {
  const msg = event?.data;
  if (!msg) return;

  if (msg.type === "OASIS_FISH_DATA") {
    const raw = msg.raw;
    if (typeof raw !== "string" || !raw) return;
    event.waitUntil(
      (async () => {
        await setAppDataRaw(raw);
        await broadcast({ type: "OASIS_SW_DEBUG", ok: true, stored: true });
      })(),
    );
    return;
  }

  if (msg.type === "OASIS_DEBUG_CHECK_WATER_CHANGE") {
    event.waitUntil(maybeNotifyWaterChange({ force: Boolean(msg.force) }));
  }
});

// self.addEventListener("fetch", function (event) {
//   event.respondWith(
//     fetch(event.request).catch(function () {
//       return caches.match(event.request);
//     }),
//   );
// });
// self.addEventListener("push", (event) => {
//   const data = event.data.json(); // 解析推送的数据
//   const options = {
//     body: data.body,
//     icon: "/icon-192x192.png",
//     badge: "/badge-96x96.png",
//     data: {
//       url: data.clickUrl, // 例如：用户点击后要跳转的页面
//     },
//   };
//   event.waitUntil(self.registration.showNotification(data.title, options));
// });
self.addEventListener("periodicSync", (event) => {
  if (event.tag === "check-storage") {
    event.waitUntil(maybeNotifyWaterChange());
  }
  console.log("Inside the periodicSync handler:", event);
});
