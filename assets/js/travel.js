// Open a travel photo larger in a lightbox. Esc, the Close button or a
// click outside the photo closes it.
(() => {
  const box = document.querySelector(".lightbox");
  if (!box || typeof box.showModal !== "function") return;
  const img = box.querySelector("img");
  const cap = box.querySelector("figcaption");
  let opener = null;

  document.querySelectorAll(".postcard-open").forEach((btn) => {
    btn.addEventListener("click", () => {
      opener = btn;
      img.src = btn.dataset.src;
      img.alt = btn.querySelector("img").alt;
      cap.textContent = [btn.dataset.caption, btn.dataset.place].filter(Boolean).join(" · ");
      box.showModal();
    });
  });

  const close = () => box.close();
  box.querySelector(".lightbox-close").addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  box.addEventListener("close", () => { img.src = ""; if (opener) opener.focus(); });
})();

// Maps: nearby pins merge into one numbered pin, and clicking a gold
// country or a pin opens a card with the places there.
(() => {
  const dataEl = document.getElementById("travel-data");
  if (!dataEl) return;
  const countries = JSON.parse(dataEl.textContent);
  const bySlug = Object.fromEntries(countries.map((c) => [c.slug, c]));
  const SVG = "http://www.w3.org/2000/svg";

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // merge pins closer than `radius` (in map units) into a cluster pin
  const cluster = (fig, radius) => {
    const pins = [...fig.querySelectorAll(".pin[data-place]:not(.home)")].map((a) => {
      const c = a.querySelector("circle");
      return { a, x: +c.getAttribute("cx"), y: +c.getAttribute("cy") };
    });
    const used = new Set();
    pins.forEach((seed) => {
      if (used.has(seed)) return;
      const group = [seed];
      used.add(seed);
      // grow the group from every member, so chains of close pins merge
      for (let i = 0; i < group.length; i++) {
        pins.forEach((p) => {
          if (!used.has(p) && Math.hypot(p.x - group[i].x, p.y - group[i].y) < radius) {
            used.add(p);
            group.push(p);
          }
        });
      }
      if (group.length < 2) return;
      const cx = group.reduce((s, p) => s + p.x, 0) / group.length;
      const cy = group.reduce((s, p) => s + p.y, 0) / group.length;
      const g = document.createElementNS(SVG, "a");
      g.setAttribute("class", "pin cluster");
      g.setAttribute("href", "#map");
      g.dataset.members = JSON.stringify(group.map((p) => [p.a.dataset.c, p.a.dataset.place]));
      const names = group.map((p) => p.a.dataset.place);
      const title = document.createElementNS(SVG, "title");
      title.textContent = names.join(", ");
      const circle = document.createElementNS(SVG, "circle");
      circle.setAttribute("cx", cx); circle.setAttribute("cy", cy);
      circle.setAttribute("r", 9 + Math.min(group.length, 8) * 0.6);
      const count = document.createElementNS(SVG, "text");
      count.setAttribute("class", "pin-count");
      count.setAttribute("x", cx); count.setAttribute("y", cy + 4.5);
      count.setAttribute("text-anchor", "middle");
      count.textContent = group.length;
      const label = document.createElementNS(SVG, "text");
      label.setAttribute("class", "pin-label");
      label.setAttribute("x", cx + 16); label.setAttribute("y", cy + 5);
      label.textContent = names.length > 2 ? `${names[0]}, ${names[1]} +${names.length - 2}` : names.join(", ");
      g.append(title, circle, count, label);
      group.forEach((p) => p.a.style.display = "none");
      const home = fig.querySelector(".pin.home");
      (home || group[0].a).parentNode.insertBefore(g, home || null);
    });
  };

  document.querySelectorAll("[data-atlas]").forEach((fig) => {
    if (fig.dataset.cluster) cluster(fig, +fig.dataset.cluster);

    const card = el("div", "map-card");
    card.hidden = true;
    card.setAttribute("role", "dialog");
    fig.appendChild(card);
    let selected = [];

    const close = () => {
      card.hidden = true;
      selected.forEach((n) => n.classList.remove("selected"));
      selected = [];
    };

    // groups: [{slug, highlight: Set of place names}]
    const open = (groups, targets, evt) => {
      groups = groups.filter((g) => bySlug[g.slug]);
      if (!groups.length) return;
      close();
      selected = targets;
      targets.forEach((t) => t.classList.add("selected"));

      const total = groups.reduce((s, g) => s + bySlug[g.slug].places.length, 0);
      const head = el("div", "mc-head");
      head.append(el("h3", null, groups.map((g) => bySlug[g.slug].country).join(" & ")),
                  el("span", "mc-count", `${total} ${total === 1 ? "place" : "places"}`));
      const shut = el("button", "mc-close", "×");
      shut.type = "button";
      shut.setAttribute("aria-label", "Close");
      shut.addEventListener("click", close);
      head.append(shut);

      const list = el("ul", "mc-places");
      const photos = [];
      let photoLink = null;
      groups.forEach((g) => bySlug[g.slug].places.forEach((p) => {
        const here = g.highlight.has(p.name);
        const li = el("li", here ? "here" : null, p.name);
        if (p.visits > 1) li.append(el("span", "mc-visits", ` ×${p.visits}`));
        if (p.note) li.append(el("span", "mc-note", ` (${p.note})`));
        list.append(li);
        if ((here || !g.highlight.size) && p.photos.length) {
          photos.push(...p.photos);
          photoLink = photoLink || `#photos-${p.slug}`;
        }
      }));

      const body = [head, list];
      if (photos.length) {
        const strip = el("div", "mc-photos");
        photos.slice(0, 6).forEach((src) => {
          const img = el("img");
          img.src = src; img.alt = ""; img.loading = "lazy";
          strip.append(img);
        });
        const more = el("a", "mc-more", "See the photos");
        more.href = photoLink;
        body.push(strip, more);
      } else {
        list.classList.add("last");
      }
      card.replaceChildren(...body);
      card.hidden = false;

      // place the card next to the click, kept inside the map
      const box = fig.getBoundingClientRect();
      const x = evt.clientX - box.left, y = evt.clientY - box.top;
      const w = card.offsetWidth, h = card.offsetHeight;
      card.style.left = `${Math.min(Math.max(8, x + 14), box.width - w - 8)}px`;
      card.style.top = `${Math.min(Math.max(8, y - h / 2), Math.max(8, box.height - h - 8))}px`;
      shut.focus({ preventScroll: true });
    };

    const pinGroups = (pin) => {
      if (pin.dataset.members) {
        const map = new Map();
        JSON.parse(pin.dataset.members).forEach(([slug, name]) => {
          if (!map.has(slug)) map.set(slug, new Set());
          map.get(slug).add(name);
        });
        return [...map].map(([slug, highlight]) => ({ slug, highlight }));
      }
      return [{ slug: pin.dataset.c, highlight: new Set(pin.dataset.place ? [pin.dataset.place] : []) }];
    };

    fig.addEventListener("click", (e) => {
      if (card.contains(e.target)) return;
      if (e.target.closest(".eu-box")) return close();
      const pin = e.target.closest(".pin");
      if (pin && (pin.dataset.c || pin.dataset.members)) {
        e.preventDefault();
        return open(pinGroups(pin), [pin], e);
      }
      const land = e.target.closest(".land path");
      if (land) {
        const slug = (land.dataset.c || "").split(" ").find((s) => bySlug[s]);
        if (slug) return open([{ slug, highlight: new Set() }], [land], e);
      }
      close();
    });
    fig.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  });
})();
