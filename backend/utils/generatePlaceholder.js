const fs = require("fs");
const path = require("path");

// Generates a simple branded SVG placeholder so seed data has real files in
// /uploads without depending on any third-party image host. Swap these out
// for real product photography any time — just re-upload through the admin panel.
const PALETTE = ["#1A1A1A", "#2B2B2B", "#3F3D39", "#5C5A54", "#D8D2C4", "#EAE6DC", "#0E0E0E"];

// Converts any string/number seed into a stable, non-negative integer index
const hashSeed = (seed) => {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 100000;
  }
  return Math.abs(hash);
};

const generatePlaceholderSVG = (label, seed = 0) => {
  const idx = hashSeed(seed);
  const bg = PALETTE[idx % PALETTE.length];
  const textColor = ["#D8D2C4", "#EAE6DC"].includes(bg) ? "#1A1A1A" : "#EAE6DC";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  <rect width="800" height="1000" fill="${bg}"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="${textColor}" stroke-opacity="0.25" stroke-width="1.5"/>
  <text x="400" y="470" font-family="Georgia, serif" font-size="34" fill="${textColor}" text-anchor="middle" letter-spacing="6">FELT &amp; FORM</text>
  <text x="400" y="520" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="${textColor}" fill-opacity="0.85" text-anchor="middle" letter-spacing="2">${label.toUpperCase()}</text>
</svg>`;
};

const savePlaceholderImage = (uploadsDir, label, fileSeed) => {
  const filename = `seed-${fileSeed}.svg`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, generatePlaceholderSVG(label, fileSeed));
  return filename;
};

module.exports = { savePlaceholderImage };
