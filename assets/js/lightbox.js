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
