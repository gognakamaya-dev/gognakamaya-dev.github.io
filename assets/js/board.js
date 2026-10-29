// The home-page circuit board: traces route themselves on load, the LED
// chain lights up, and hovering a chip lights the traces on its net.
// Without JavaScript everything is simply drawn and lit.
document.querySelectorAll(".board").forEach((board) => {
  const traces = [...board.querySelectorAll(".cu")];
  const leds = [...board.querySelectorAll(".led")];
  const visible = board.getBoundingClientRect().width > 0;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lightLeds = (step) => leds.forEach((led, i) =>
    setTimeout(() => led.classList.add("lit"), step * i));

  if (!visible || still) {
    lightLeds(0);
  } else {
    // stagger traces outward from the MCU, measured in real path lengths
    const mcu = board.querySelector('[data-net="about"] .pkg').getBBox();
    const cx = mcu.x + mcu.width / 2, cy = mcu.y + mcu.height / 2;
    traces.forEach((t) => {
      const len = t.getTotalLength();
      const b = t.getBBox();
      const delay = Math.round(Math.hypot(b.x + b.width / 2 - cx, b.y + b.height / 2 - cy) * 0.8);
      t.style.strokeDasharray = `${len} ${len}`;
      t.style.strokeDashoffset = `${len}`;
      t.style.transitionDelay = `${delay}ms, 0ms, 0ms`;
    });
    board.getBoundingClientRect(); // commit the hidden state before animating
    requestAnimationFrame(() => {
      traces.forEach((t) => { t.classList.add("drawing"); t.style.strokeDashoffset = "0"; });
      setTimeout(() => lightLeds(150), 1100);
      // tidy up so hover transitions aren't delayed
      setTimeout(() => traces.forEach((t) => {
        t.classList.remove("drawing");
        t.style.strokeDasharray = t.style.strokeDashoffset = t.style.transitionDelay = "";
      }), 2400);
    });
  }

  // after power-on: occasional pulses of light run along the traces, like data
  const pulses = document.createElementNS("http://www.w3.org/2000/svg", "g");
  pulses.setAttribute("class", "pulses");
  board.querySelector(".traces").after(pulses);
  let onScreen = true;

  const pulse = (trace) => {
    if (!trace.animate) return;
    const len = trace.getTotalLength();
    if (len < 30) return;
    const seg = Math.min(26, len / 3);
    const p = trace.cloneNode(false);
    p.removeAttribute("data-net");
    p.setAttribute("class", "pulse");
    p.style.strokeDasharray = `${seg} ${len + seg}`;
    pulses.appendChild(p);
    const run = p.animate(
      [{ strokeDashoffset: seg, opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { strokeDashoffset: -len, opacity: 0 }],
      { duration: Math.max(700, len * 5), easing: "ease-in-out" });
    run.onfinish = () => p.remove();
  };

  const idle = () => {
    if (onScreen && !document.hidden && pulses.childElementCount < 3) {
      pulse(traces[Math.floor(Math.random() * traces.length)]);
    }
    setTimeout(idle, 700 + Math.random() * 1100);
  };

  if (visible && !still) {
    setTimeout(idle, 2600);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(board);
    }
  }

  // hover or focus a part: light up its net
  const setNet = (net) => {
    if (net) board.dataset.active = net; else delete board.dataset.active;
    board.querySelectorAll(".cu, .via").forEach((el) =>
      el.classList.toggle("on", !!net && el.dataset.net === net));
  };
  board.querySelectorAll(".part[data-net]").forEach((part) => {
    const net = part.dataset.net;
    part.addEventListener("mouseenter", () => {
      setNet(net);
      if (visible && !still) traces.filter((t) => t.dataset.net === net).forEach(pulse);
    });
    part.addEventListener("mouseleave", () => setNet(null));
    part.addEventListener("focus", () => setNet(net));
    part.addEventListener("blur", () => setNet(null));
  });
});
