// The home-page circuit board: traces route themselves on load, the LED
// chain lights up, and hovering a chip lights the traces on its net.
document.querySelectorAll(".board").forEach((board) => {
  const traces = [...board.querySelectorAll(".cu")];
  const leds = [...board.querySelectorAll(".led")];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // stagger traces outward from the MCU, roughly by distance from it
  const mcu = board.querySelector('[data-net="about"] .pkg');
  const c = mcu ? mcu.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
  const cx = c.x + c.width / 2, cy = c.y + c.height / 2;
  traces.forEach((t) => {
    const b = t.getBBox();
    const d = Math.hypot(b.x + b.width / 2 - cx, b.y + b.height / 2 - cy);
    t.style.setProperty("--d", `${Math.round(d * 0.9)}ms`);
  });

  const lightLeds = () => leds.forEach((led, i) =>
    setTimeout(() => led.classList.add("lit"), still ? 0 : 160 * i));

  if (still) {
    board.classList.add("powered");
    lightLeds();
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => board.classList.add("powered")));
    setTimeout(lightLeds, 1300);
  }

  // hover or focus a part: light up its net
  const setNet = (net) => {
    if (net) board.dataset.active = net; else delete board.dataset.active;
    board.querySelectorAll(".cu, .via").forEach((el) =>
      el.classList.toggle("on", !!net && el.dataset.net === net));
  };
  board.querySelectorAll(".part[data-net]").forEach((part) => {
    const net = part.dataset.net;
    part.addEventListener("mouseenter", () => setNet(net));
    part.addEventListener("mouseleave", () => setNet(null));
    part.addEventListener("focus", () => setNet(net));
    part.addEventListener("blur", () => setNet(null));
  });
});
