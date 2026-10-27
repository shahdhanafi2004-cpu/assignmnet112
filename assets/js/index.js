/* ================= CONFIG ================= */
// Lw 3andak links tanya fel Postman collection, ghayyar hena bas
const CONFIG = {
  NASA_APOD: "https://api.nasa.gov/planetary/apod",
  NASA_KEY: "DEMO_KEY", // 7ott el key bta3ak hena
  SOLAR_BODIES: "https://api.le-systeme-solaire.net/rest/bodies",
  LAUNCHES:
    "https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10&mode=detailed",
};

const $ = (id) => document.getElementById(id);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const todayISO = () => new Date().toISOString().split("T")[0];

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return res.json();
}

/* ================= NAVIGATION ================= */
function initNav() {
  const links = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".app-section");
  const sidebar = $("sidebar");
  const toggle = $("sidebar-toggle");

  const isMobile = () => window.innerWidth < 1024;
  const setSidebar = (open) => {
    if (!isMobile()) {
      sidebar.style.transform = "";
      return;
    }
    sidebar.style.transform = open ? "translateX(0)" : "translateX(-100%)";
    sidebar.dataset.open = open ? "1" : "0";
  };
  setSidebar(false);
  window.addEventListener("resize", () => setSidebar(false));
  toggle?.addEventListener("click", () =>
    setSidebar(sidebar.dataset.open !== "1")
  );

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      sections.forEach((s) =>
        s.classList.toggle("hidden", s.dataset.section !== target)
      );
      links.forEach((l) => {
        const active = l === link;
        l.classList.toggle("bg-blue-500/10", active);
        l.classList.toggle("text-blue-400", active);
        l.classList.toggle("text-slate-300", !active);
      });
      setSidebar(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

/* ================= APOD ================= */
function setApodLoading(on) {
  $("apod-loading").classList.toggle("hidden", !on);
  $("apod-image").classList.toggle("hidden", on);
}

function renderApod(d) {
  const container = $("apod-image-container");
  container.querySelector("iframe")?.remove();
  const img = $("apod-image");

  if (d.media_type === "video") {
    img.classList.add("hidden");
    const iframe = document.createElement("iframe");
    iframe.src = d.url;
    iframe.className = "w-full h-full";
    iframe.allowFullscreen = true;
    container.prepend(iframe);
  } else {
    img.classList.remove("hidden");
    img.src = d.url;
    img.alt = d.title;
    img.dataset.hd = d.hdurl || d.url;
  }

  $("apod-title").textContent = d.title;
  $("apod-explanation").textContent = d.explanation;
  $("apod-date").textContent = `Astronomy Picture of the Day - ${fmtDate(
    d.date + "T00:00:00"
  )}`;
  $("apod-date-detail").innerHTML = `<i class="far fa-calendar mr-2"></i>${d.date}`;
  $("apod-date-info").textContent = d.date;
  $("apod-media-type").textContent =
    d.media_type === "video" ? "Video" : "Image";
  $("apod-copyright").innerHTML = d.copyright
    ? `&copy; ${d.copyright.trim().replace(/\n/g, " ")}`
    : "Public Domain";
  $("apod-date-input").value = d.date;
  const label = document.querySelector('label[for="apod-date-input"] span');
  if (label) label.textContent = fmtDate(d.date + "T00:00:00");
}

async function loadApod(date) {
  setApodLoading(true);
  try {
    const q = new URLSearchParams({ api_key: CONFIG.NASA_KEY });
    if (date) q.set("date", date);
    renderApod(await getJSON(`${CONFIG.NASA_APOD}?${q}`));
  } catch (err) {
    console.error(err);
    alert("Mesh 2adrin a7mel el APOD delwa2ty. Garreb tany.");
  } finally {
    setApodLoading(false);
  }
}

function initApod() {
  const input = $("apod-date-input");
  input.max = todayISO();
  const label = document.querySelector('label[for="apod-date-input"] span');
  input.addEventListener("change", () => {
    if (label && input.value) label.textContent = fmtDate(input.value + "T00:00:00");
  });
  $("load-date-btn").addEventListener("click", () => {
    if (input.value) loadApod(input.value);
  });
  $("today-apod-btn").addEventListener("click", () => loadApod());
  $("apod-image-container")
    .querySelector("button")
    ?.addEventListener("click", () => {
      const url = $("apod-image").dataset.hd || $("apod-image").src;
      window.open(url, "_blank", "noopener");
    });
  loadApod();
}

/* ================= LAUNCHES ================= */
const STATUS_STYLE = {
  Go: "bg-green-500/90",
  TBC: "bg-yellow-500/90",
  TBD: "bg-blue-500/90",
  Hold: "bg-orange-500/90",
  Success: "bg-green-500/90",
  Failure: "bg-red-500/90",
};
const statusBg = (s) => STATUS_STYLE[s] || "bg-slate-500/90";

function daysUntil(iso) {
  const diff = new Date(iso) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function launchInfo(l) {
  return {
    name: l.name,
    status: l.status?.abbrev || "TBD",
    provider: l.launch_service_provider?.name || "Unknown",
    rocket: l.rocket?.configuration?.name || "Unknown",
    net: l.net,
    date: l.net ? fmtDate(l.net) : "TBD",
    time: l.net
      ? new Date(l.net).toISOString().substring(11, 16) + " UTC"
      : "TBD",
    pad: l.pad?.name || "Unknown pad",
    location: l.pad?.location?.name || "Unknown",
    country: l.pad?.location?.country_code || "N/A",
    description: l.mission?.description || "No description available.",
    image: l.image?.image_url || l.image || null,
  };
}

function launchCard(l) {
  const i = launchInfo(l);
  return `
  <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
    <div class="relative h-48 bg-slate-900/50 flex items-center justify-center overflow-hidden">
      ${
        i.image
          ? `<img src="${i.image}" alt="${i.name}" class="w-full h-full object-cover" loading="lazy" />`
          : `<i class="fas fa-rocket text-5xl text-slate-700"></i>`
      }
      <div class="absolute top-3 right-3">
        <span class="px-3 py-1 ${statusBg(i.status)} text-white backdrop-blur-sm rounded-full text-xs font-semibold">${i.status}</span>
      </div>
    </div>
    <div class="p-5">
      <div class="mb-3">
        <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">${i.name}</h4>
        <p class="text-sm text-slate-400 flex items-center gap-2"><i class="fas fa-building text-xs"></i>${i.provider}</p>
      </div>
      <div class="space-y-2 mb-4">
        <div class="flex items-center gap-2 text-sm"><i class="fas fa-calendar text-slate-500 w-4"></i><span class="text-slate-300">${i.date}</span></div>
        <div class="flex items-center gap-2 text-sm"><i class="fas fa-clock text-slate-500 w-4"></i><span class="text-slate-300">${i.time}</span></div>
        <div class="flex items-center gap-2 text-sm"><i class="fas fa-rocket text-slate-500 w-4"></i><span class="text-slate-300">${i.rocket}</span></div>
        <div class="flex items-center gap-2 text-sm"><i class="fas fa-map-marker-alt text-slate-500 w-4"></i><span class="text-slate-300 line-clamp-1">${i.pad}</span></div>
      </div>
      <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
        <button class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">Details</button>
        <button class="fav-btn px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
      </div>
    </div>
  </div>`;
}

function featuredCard(l) {
  const i = launchInfo(l);
  return `
  <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
    <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2"><i class="fas fa-star"></i>Featured Launch</span>
            <span class="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">${i.status}</span>
          </div>
          <h3 class="text-3xl font-bold mb-3 leading-tight">${i.name}</h3>
          <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
            <div class="flex items-center gap-2"><i class="fas fa-building"></i><span>${i.provider}</span></div>
            <div class="flex items-center gap-2"><i class="fas fa-rocket"></i><span>${i.rocket}</span></div>
          </div>
          <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
            <i class="fas fa-clock text-2xl text-blue-400"></i>
            <div>
              <p class="text-2xl font-bold text-blue-400">${i.net ? daysUntil(i.net) : "-"}</p>
              <p class="text-xs text-slate-400">Days Until Launch</p>
            </div>
          </div>
          <div class="grid xl:grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-calendar"></i>Launch Date</p><p class="font-semibold">${i.date}</p></div>
            <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-clock"></i>Launch Time</p><p class="font-semibold">${i.time}</p></div>
            <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-map-marker-alt"></i>Location</p><p class="font-semibold text-sm">${i.location}</p></div>
            <div class="bg-slate-900/50 rounded-xl p-4"><p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-globe"></i>Country</p><p class="font-semibold">${i.country}</p></div>
          </div>
          <p class="text-slate-300 leading-relaxed mb-6">${i.description}</p>
        </div>
        <div class="flex flex-col md:flex-row gap-3">
          <button class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2"><i class="fas fa-info-circle"></i>View Full Details</button>
          <div class="icons self-end md:self-center">
            <button class="fav-btn px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
            <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="fas fa-bell"></i></button>
          </div>
        </div>
      </div>
      <div class="relative">
        <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
          ${
            i.image
              ? `<img src="${i.image}" alt="${i.name}" class="absolute inset-0 w-full h-full object-cover" />`
              : `<div class="flex items-center justify-center h-full min-h-[400px] bg-slate-800"><i class="fas fa-rocket text-9xl text-slate-700/50"></i></div>`
          }
          <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
        </div>
      </div>
    </div>
  </div>`;
}

async function loadLaunches() {
  try {
    const data = await getJSON(CONFIG.LAUNCHES);
    const list = data.results || [];
    if (!list.length) return;

    $("featured-launch").innerHTML = featuredCard(list[0]);
    $("launches-grid").innerHTML = list.slice(1).map(launchCard).join("");

    const n = list.length;
    $("launches-count").textContent = `${n} Launches`;
    $("launches-count-mobile").textContent = n;
  } catch (err) {
    // el static cards hayfdalo zy ma homa
    console.error("Launches error:", err);
  }
}

// favorite heart toggle (event delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".fav-btn");
  if (!btn) return;
  const icon = btn.querySelector("i");
  const on = icon.classList.contains("fas");
  icon.classList.toggle("fas", !on);
  icon.classList.toggle("far", on);
  icon.classList.toggle("text-red-500", !on);
});

/* ================= PLANETS ================= */
const PLANET_META = {
  mercury: { color: "orange", type: "Terrestrial", facts: ["Smallest planet in the Solar System", "Closest planet to the Sun", "Has almost no atmosphere", "Temperatures swing from -180°C to 430°C"] },
  venus: { color: "orange", type: "Terrestrial", facts: ["Hottest planet in the Solar System", "Rotates backwards (retrograde)", "Thick CO₂ atmosphere", "A day is longer than its year"] },
  earth: { color: "blue", type: "Terrestrial", facts: ["Only known planet with liquid water", "Atmosphere contains 78% nitrogen", "Magnetic field protects from solar wind", "Formed 4.54 billion years ago"] },
  mars: { color: "red", type: "Terrestrial", facts: ["Home to Olympus Mons, the tallest volcano", "Known as the Red Planet", "Has two small moons: Phobos and Deimos", "Day length is about 24h 37m"] },
  jupiter: { color: "purple", type: "Gas Giant", facts: ["Largest planet in the Solar System", "The Great Red Spot is a giant storm", "Has a faint ring system", "More than twice as massive as all other planets combined"] },
  saturn: { color: "yellow", type: "Gas Giant", facts: ["Famous for its spectacular rings", "Less dense than water", "Titan has a thick atmosphere", "Winds reach 1,800 km/h"] },
  uranus: { color: "cyan", type: "Ice Giant", facts: ["Rotates on its side (98° tilt)", "Coldest planetary atmosphere", "Has faint rings", "Discovered in 1781"] },
  neptune: { color: "blue", type: "Ice Giant", facts: ["Strongest winds in the Solar System", "Discovered through mathematical prediction", "Has 14 known moons", "Takes 165 years to orbit the Sun"] },
};

// el API bet3 le-systeme-solaire byesta3mel IDs faransawy
const API_ID = {
  mercury: "mercure",
  venus: "venus",
  earth: "terre",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturne",
  uranus: "uranus",
  neptune: "neptune",
};

// el API ma byrg3sh description, fa 7atteha hena
const PLANET_DESC = {
  mercury: "Mercury is the smallest planet in the Solar System and the closest to the Sun. It has a heavily cratered surface and almost no atmosphere, so temperatures swing wildly between scorching days and freezing nights.",
  venus: "Venus is the second planet from the Sun and the hottest in the Solar System, thanks to a thick carbon dioxide atmosphere that traps heat. It rotates backwards and very slowly, so a day on Venus is longer than its year.",
  earth: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of its surface is covered with water, and its atmosphere and magnetic field protect life from harmful solar radiation.",
  mars: "Mars is the fourth planet from the Sun, known as the Red Planet because of the iron oxide on its surface. It is home to Olympus Mons, the tallest volcano in the Solar System, and shows evidence of ancient water.",
  jupiter: "Jupiter is the largest planet in the Solar System, a gas giant more than twice as massive as all the other planets combined. Its Great Red Spot is a storm that has raged for centuries.",
  saturn: "Saturn is a gas giant famous for its spectacular ring system made of ice and rock. It is the least dense planet in the Solar System, less dense than water.",
  uranus: "Uranus is an ice giant that rotates on its side, with an axial tilt of about 98 degrees. Its pale blue-green color comes from methane in its atmosphere, and it has one of the coldest atmospheres of any planet.",
  neptune: "Neptune is the farthest known planet from the Sun, a cold and windy ice giant with the fastest winds in the Solar System. It was discovered in 1846 through mathematical predictions.",
};

const planetCache = {};

const sci = (v) => {
  if (!v || v.massValue === undefined && v.volValue === undefined) return "N/A";
  const val = v.massValue ?? v.volValue;
  const exp = v.massExponent ?? v.volExponent;
  const sup = String(exp).replace(/-/g, "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  return `${val.toFixed(2)} × 10${sup}`;
};
const num = (n, d = 0) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { maximumFractionDigits: d })
    : "N/A";
const mkm = (km) => (typeof km === "number" ? `${(km / 1e6).toFixed(1)}M km` : "N/A");

async function fetchPlanet(id) {
  if (planetCache[id]) return planetCache[id];
  const data = await getJSON(`${CONFIG.SOLAR_BODIES}/${API_ID[id] || id}`);
  planetCache[id] = data;
  return data;
}

function renderPlanet(id, p) {
  const meta = PLANET_META[id];
  const set = (el, v) => ($(el).textContent = v);

  $("planet-detail-image").src = `./assets/images/${id}.png`;
  $("planet-detail-image").alt = `${p.englishName || id} planet`;
  set("planet-detail-name", p.englishName || id);
  set("planet-detail-description", PLANET_DESC[id]);

  set("planet-distance", mkm(p.semimajorAxis));
  set("planet-radius", `${num(p.meanRadius, 1)} km`);
  set("planet-mass", sci(p.mass));
  set("planet-density", `${num(p.density, 2)} g/cm³`);
  set("planet-orbital-period", `${num(p.sideralOrbit, 2)} days`);
  set("planet-rotation", `${num(Math.abs(p.sideralRotation), 1)} hours`);
  set("planet-moons", p.moons ? p.moons.length : 0);
  set("planet-gravity", `${num(p.gravity, 2)} m/s²`);

  set("planet-discoverer", p.discoveredBy || "Known since antiquity");
  set("planet-discovery-date", p.discoveryDate || "Ancient");
  set("planet-body-type", p.bodyType || "Planet");
  set("planet-volume", p.vol ? sci(p.vol) + " km³" : "N/A");

  set("planet-perihelion", mkm(p.perihelion));
  set("planet-aphelion", mkm(p.aphelion));
  set("planet-eccentricity", num(p.eccentricity, 4));
  set("planet-inclination", `${num(p.inclination, 2)}°`);
  set("planet-axial-tilt", `${num(p.axialTilt, 2)}°`);
  set("planet-temp", p.avgTemp ? `${Math.round(p.avgTemp - 273.15)}°C` : "N/A");
  set("planet-escape", p.escape ? `${(p.escape / 1000).toFixed(1)} km/s` : "N/A");

  $("planet-facts").innerHTML = meta.facts
    .map(
      (f) => `
    <li class="flex items-start">
      <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
      <span class="text-slate-300">${f}</span>
    </li>`
    )
    .join("");
}

function renderStatic(id) {
  const meta = PLANET_META[id];
  $("planet-detail-image").src = `./assets/images/${id}.png`;
  $("planet-detail-name").textContent = id.charAt(0).toUpperCase() + id.slice(1);
  $("planet-detail-description").textContent = PLANET_DESC[id];
  $("planet-facts").innerHTML = meta.facts
    .map(
      (f) => `
    <li class="flex items-start">
      <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
      <span class="text-slate-300">${f}</span>
    </li>`
    )
    .join("");
}

async function selectPlanet(id) {
  renderStatic(id);
  document.querySelectorAll(".planet-card").forEach((c) => {
    c.classList.toggle("ring-2", c.dataset.planetId === id);
    c.classList.toggle("ring-blue-500/60", c.dataset.planetId === id);
  });
  try {
    renderPlanet(id, await fetchPlanet(id));
  } catch (err) {
    console.error("Planet error:", err);
  }
}

function initPlanets() {
  document.querySelectorAll(".planet-card").forEach((card) => {
    card.addEventListener("click", () => selectPlanet(card.dataset.planetId));
  });
  selectPlanet("earth");
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initApod();
  loadLaunches();
  initPlanets();
});