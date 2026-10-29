// Click a spine to read the note for that book.
document.querySelectorAll("[data-shelf]").forEach((shelf) => {
  const detail = shelf.querySelector(".shelf-detail");
  const spines = shelf.querySelectorAll(".spine");
  const labels = { reading: "Reading now", next: "Up next" };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    n.className = cls;
    n.textContent = text;
    return n;
  };

  spines.forEach((spine) => {
    spine.addEventListener("click", () => {
      const open = spine.getAttribute("aria-expanded") === "true";
      spines.forEach((s) => s.setAttribute("aria-expanded", "false"));
      if (open) { detail.hidden = true; return; }

      spine.setAttribute("aria-expanded", "true");
      const d = spine.dataset;
      const when = labels[d.status] || (d.year ? `Read in ${d.year}` : "Read");
      detail.replaceChildren(
        el("p", "d-title", d.title),
        el("p", "d-meta", `${d.author} · ${when}`),
        el("p", "d-note", d.note || "No notes on this one yet.")
      );
      detail.style.setProperty("--detail-c", getComputedStyle(spine).backgroundColor);
      detail.hidden = false;
    });
  });
});
