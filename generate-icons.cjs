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

      let r = 10;
      let g = 12;
      let b = 22;
      let a = 255;

      const cornerRadius = size * 0.22;
      const nx = Math.abs(x - center) - (center - cornerRadius);
      const ny = Math.abs(y - center) - (center - cornerRadius);
      if (nx > 0 && ny > 0) {
        const cornerDist = Math.sqrt(nx * nx + ny * ny);
        if (cornerDist > cornerRadius) {
          a = 0;
        }
      }

      if (a > 0) {
        const ringDiff = Math.abs(dist - radius);
        if (ringDiff < size * 0.025) {
          const glow = 1 - (ringDiff / (size * 0.025));
          r = Math.min(255, r + 0 * glow);
          g = Math.min(255, g + 242 * glow);
          b = Math.min(255, b + 255 * glow);
        }

        const innerDiff = Math.abs(dist - innerRadius);
        if (innerDiff < size * 0.015) {
          const angle = Math.atan2(dy, dx);
          if (Math.sin(angle * 8) > 0) {
            r = 0;
            g = 200;
            b = 255;
          }
        }

        const micW = micRadius;
        const micH = micRadius * 2.2;
        const inMicX = Math.abs(dx) <= micW * 0.8;
        const inMicY = dy >= -micH * 0.6 && dy <= micH * 0.4;

        if (inMicX && inMicY) {
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

        const uRadius = micRadius * 1.5;
        const uDiff = Math.abs(dist - uRadius);
        if (uDiff < size * 0.02 && dy > -micH * 0.1 && dy < micH * 0.7) {
          r = 0;
          g = 220;
          b = 255;
        }

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

function createScreenshot(width, height) {
  const png = new PNG({ width, height });
  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = 10;
      let g = 10;
      let b = 15;

      // Subtle cyan gradient ring in center
      if (dist < Math.min(width, height) * 0.35) {
        r = 12 + Math.floor((1 - dist / (width * 0.5)) * 10);
        g = 20 + Math.floor((1 - dist / (width * 0.5)) * 80);
        b = 35 + Math.floor((1 - dist / (width * 0.5)) * 120);
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return png;
}

const p192 = createJarvisIcon(192);
p192.pack().pipe(fs.createWriteStream(path.join(__dirname, 'public', 'icon-192.png'))).on('finish', () => {
  console.log('192x192 PNG icon generated');
});

const p512 = createJarvisIcon(512);
p512.pack().pipe(fs.createWriteStream(path.join(__dirname, 'public', 'icon-512.png'))).on('finish', () => {
  console.log('512x512 PNG icon generated');
});

const sm = createScreenshot(750, 1334);
sm.pack().pipe(fs.createWriteStream(path.join(__dirname, 'public', 'screenshot-mobile.png'))).on('finish', () => {
  console.log('Mobile screenshot generated');
});

const sd = createScreenshot(1280, 720);
sd.pack().pipe(fs.createWriteStream(path.join(__dirname, 'public', 'screenshot-desktop.png'))).on('finish', () => {
  console.log('Desktop screenshot generated');
});
