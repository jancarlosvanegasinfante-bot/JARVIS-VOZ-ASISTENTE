const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createJarvisIcon(size) {
  const png = new PNG({ width: size, height: size });
  const center = size / 2;
  const radius = size * 0.42;
  const innerRadius = size * 0.30;
  const micRadius = size * 0.12;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default dark cyan/navy background #0a0c16
      let r = 10;
      let g = 12;
      let b = 22;
      let a = 255;

      // Rounded corners for icon background
      const cornerRadius = size * 0.22;
      const nx = Math.abs(x - center) - (center - cornerRadius);
      const ny = Math.abs(y - center) - (center - cornerRadius);
      if (nx > 0 && ny > 0) {
        const cornerDist = Math.sqrt(nx * nx + ny * ny);
        if (cornerDist > cornerRadius) {
          a = 0; // transparent outside rounded box
        }
      }

      if (a > 0) {
        // Glowing Outer Ring
        const ringDiff = Math.abs(dist - radius);
        if (ringDiff < size * 0.025) {
          const glow = 1 - (ringDiff / (size * 0.025));
          r = Math.min(255, r + 0 * glow);
          g = Math.min(255, g + 242 * glow);
          b = Math.min(255, b + 255 * glow);
        }

        // Inner Dashed/Dotted Tech Ring
        const innerDiff = Math.abs(dist - innerRadius);
        if (innerDiff < size * 0.015) {
          const angle = Math.atan2(dy, dx);
          // 8 segments
          if (Math.sin(angle * 8) > 0) {
            r = 0;
            g = 200;
            b = 255;
          }
        }

        // Central Microphone Head (Capsule: width micRadius, height 2.2 * micRadius)
        const micW = micRadius;
        const micH = micRadius * 2.2;
        const inMicX = Math.abs(dx) <= micW * 0.8;
        const inMicY = dy >= -micH * 0.6 && dy <= micH * 0.4;

        if (inMicX && inMicY) {
          // Top dome or bottom dome
          let insideCapsule = false;
          if (dy < -micH * 0.2) {
            const topDy = dy + micH * 0.2;
            insideCapsule = Math.sqrt(dx * dx + topDy * topDy) <= micW * 0.8;
          } else if (dy > micH * 0.2) {
            const botDy = dy - micH * 0.2;
            insideCapsule = Math.sqrt(dx * dx + botDy * botDy) <= micW * 0.8;
          } else {
            insideCapsule = true;
          }

          if (insideCapsule) {
            r = 0;
            g = 242;
            b = 255;
          }
        }

        // U-shaped stand around microphone
        const uRadius = micRadius * 1.5;
        const uDiff = Math.abs(dist - uRadius);
        if (uDiff < size * 0.02 && dy > -micH * 0.1 && dy < micH * 0.7) {
          r = 0;
          g = 220;
          b = 255;
        }

        // Microphone Base stand line
        if (Math.abs(dx) < size * 0.02 && dy >= micH * 0.7 && dy <= micH * 1.1) {
          r = 0;
          g = 242;
          b = 255;
        }
        if (Math.abs(dx) < micRadius * 1.2 && Math.abs(dy - micH * 1.1) < size * 0.015) {
          r = 0;
          g = 242;
          b = 255;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  return png;
}

const p192 = createJarvisIcon(192);
p192.pack().pipe(fs.createWriteStream(path.join(__dirname, 'public', 'icon-192.png'))).on('finish', () => {
  console.log('192x192 PNG icon generated successfully!');
});

const p512 = createJarvisIcon(512);
p512.pack().pipe(fs.createWriteStream(path.join(__dirname, 'public', 'icon-512.png'))).on('finish', () => {
  console.log('512x512 PNG icon generated successfully!');
});
