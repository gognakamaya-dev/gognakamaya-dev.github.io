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

// Click a gold country or a pin on a map: show a card with that country's places.
(() => {
  const dataEl = document.getElementById("travel-data");
  if (!dataEl) return;
  const countries = JSON.parse(dataEl.textContent);
  const bySlug = Object.fromEntries(countries.map((c) => [c.slug, c]));

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  document.querySelectorAll("[data-atlas]").forEach((fig) => {
    const card = el("div", "map-card");
    card.hidden = true;
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-live", "polite");
    fig.appendChild(card);
    let active = null;

    const close = () => {
      card.hidden = true;
      fig.querySelectorAll(".pin.selected").forEach((p) => p.classList.remove("selected"));
      if (active) active.classList.remove("selected");
      active = null;
    };

    const open = (slug, placeName, target, evt) => {
      const c = bySlug[slug];
      if (!c) return;
      close();
      active = target;
      target.classList.add("selected");
      fig.querySelectorAll(`.pin[data-c="${slug}"]`).forEach((p) =>
        p.classList.toggle("selected", !placeName || p.dataset.place === placeName));

      const head = el("div", "mc-head");
      head.append(el("h3", null, c.country), el("span", "mc-count", `${c.places.length} ${c.places.length === 1 ? "place" : "places"}`));
      const shut = el("button", "mc-close", "×");
      shut.type = "button";
      shut.setAttribute("aria-label", "Close");
      shut.addEventListener("click", close);
      head.append(shut);

      const list = el("ul", "mc-places");
      c.places.forEach((p) => {
        const li = el("li", p.name === placeName ? "here" : null, p.name);
        if (p.visits > 1) li.append(el("span", "mc-visits", ` ×${p.visits}`));
        if (p.note) li.append(el("span", "mc-note", ` (${p.note})`));
        list.append(li);
      });

      const photos = c.places.flatMap((p) => (placeName && p.name !== placeName ? [] : p.photos));
      const body = [head, list];
      if (photos.length) {
        const strip = el("div", "mc-photos");
        photos.slice(0, 6).forEach((src) => {
          const img = el("img");
          img.src = src; img.alt = ""; img.loading = "lazy";
          strip.append(img);
        });
        body.push(strip);
      }
      const more = el("a", "mc-more", photos.length ? "See the photos" : "See the list");
      more.href = `#${c.slug}`;
      body.push(more);
      card.replaceChildren(...body);
      card.hidden = false;

      // place the card next to the click, kept inside the map
      const box = fig.getBoundingClientRect();
      const x = evt.clientX - box.left, y = evt.clientY - box.top;
      const w = card.offsetWidth, h = card.offsetHeight;
      const left = Math.min(Math.max(8, x + 14), box.width - w - 8);
      const top = Math.min(Math.max(8, y - h / 2), Math.max(8, box.height - h - 8));
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      shut.focus({ preventScroll: true });
    };

    fig.addEventListener("click", (e) => {
      if (card.contains(e.target)) return;
      const pin = e.target.closest(".pin");
      if (pin) {
        e.preventDefault();
        return open(pin.dataset.c, pin.dataset.place, pin, e);
      }
      const land = e.target.closest(".land path");
      if (land) {
        const slug = (land.dataset.c || "").split(" ").find((s) => bySlug[s]);
        if (slug) return open(slug, null, land, e);
      }
      close();
    });
    fig.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  });
})();
