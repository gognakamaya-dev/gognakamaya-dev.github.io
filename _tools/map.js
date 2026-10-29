/*
  Draws the land for the travel maps as circuit-board copper.

    cd _tools && npm i world-atlas@2 topojson-client@3 && node map.js

  Writes _includes/map-world-land.svg and _includes/map-europe-land.svg.
  The projection numbers here must match the ones in travel/index.html.
  You only need to re-run this to change the map area; new places and
  countries in _data/travel.yml appear on the map by themselves.
*/
const fs = require("fs");
const path = require("path");
const { feature } = require("topojson-client");

const OUT = process.env.OUT || path.join(__dirname, "..", "_includes");

const VIEWS = {
  world: { atlas: "countries-110m.json", lon0: -130, lon1: 112, lat0: 66, lat1: 0, kx: 4.5, ky: 4.5, pad: 20, prec: 1 },
  europe: { atlas: "countries-50m.json", lon0: -11, lon1: 26, lat0: 61.5, lat1: 35, kx: 20, ky: 30, pad: 20, prec: 0 },
};

// names in the atlas -> the country names used in _data/travel.yml (slugified)
const ALIAS = {
  "United States of America": "united-states",
  "Bosnia and Herz.": "bosnia-and-herzegovina",
  "United Kingdom": "united-kingdom scotland",
};
const slug = (s) => ALIAS[s] || s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// far-away trips get a trace from Dublin on the world map
const HOME = [53.35, -6.26];
const ROUTES = [[37.77, -122.42], [25.2, 55.27], [28.61, 77.21], [13.76, 100.5]];

function chamfer(pts, c = 6) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const d1 = Math.hypot(x1 - x0, y1 - y0), d2 = Math.hypot(x2 - x1, y2 - y1);
    if (!d1 || !d2) continue;
    const k = Math.min(c, d1 / 2, d2 / 2);
    out.push([x1 - (x1 - x0) / d1 * k, y1 - (y1 - y0) / d1 * k], [x1 + (x2 - x1) / d2 * k, y1 + (y2 - y1) / d2 * k]);
  }
  out.push(pts[pts.length - 1]);
  return "M" + out.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
}

function draw(name, v) {
  const topo = require(`world-atlas/${v.atlas}`);
  const countries = feature(topo, topo.objects.countries).features;
  const X = (lon) => v.pad + (lon - v.lon0) * v.kx;
  const Y = (lat) => v.pad + (v.lat0 - lat) * v.ky;
  const W = v.pad * 2 + (v.lon1 - v.lon0) * v.kx;
  const H = v.pad * 2 + (v.lat0 - v.lat1) * v.ky;
  const margin = 4; // degrees outside the view still drawn so coasts run off the edge

  const paths = [];
  for (const f of countries) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    let d = "";
    for (const poly of polys) {
      for (const ring of poly) {
        const lons = ring.map((p) => p[0]), lats = ring.map((p) => p[1]);
        if (Math.max(...lons) < v.lon0 - margin || Math.min(...lons) > v.lon1 + margin ||
            Math.max(...lats) < v.lat1 - margin || Math.min(...lats) > v.lat0 + margin) continue;
        let last = null, seg = "";
        for (const [lon, lat] of ring) {
          const pt = `${X(lon).toFixed(v.prec)} ${Y(lat).toFixed(v.prec)}`;
          if (pt === last) continue;
          seg += (seg ? "L" : "M") + pt;
          last = pt;
        }
        d += seg + "Z";
      }
    }
    if (d) paths.push(`<path data-c="${slug(f.properties.name)}" d="${d}"><title>${f.properties.name}</title></path>`);
  }

  let traces = "";
  if (name === "world") {
    const hx = X(HOME[1]), hy = Y(HOME[0]);
    let east = 0, west = 0;
    for (const [lat, lon] of ROUTES) {
      const tx = X(lon), ty = Y(lat);
      const dir = Math.sign(tx - hx);
      // fan out of Dublin like a bus, run horizontally, then a 45° diagonal into the pad
      const lane = dir > 0 ? east++ : west++;
      const off = 7 * lane;
      const by = hy - off;
      const pts = [[hx, hy], [hx + dir * off, by]];
      const dy = Math.abs(ty - by);
      pts.push([tx - dir * dy, by], [tx, ty]);
      traces += `<path class="route" d="${chamfer(pts)}"/>`;
    }
  }

  const svg = `<g class="land">${paths.join("")}</g>` + (traces ? `<g class="routes">${traces}</g>` : "");
  fs.writeFileSync(path.join(OUT, `map-${name}-land.svg`), svg);
  console.log(name, `${W}x${H}`, (svg.length / 1024).toFixed(0) + "KB");
}

for (const [name, v] of Object.entries(VIEWS)) draw(name, v);
