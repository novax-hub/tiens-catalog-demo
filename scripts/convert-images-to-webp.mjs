import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const COUNTRY = 'pe';

const INPUT_BASE = path.resolve('public/product-assets/raw/pe');
const OUTPUT_BASE = path.resolve('public/product-assets/optimized/pe');

const PRODUCT_SLUGS = {
  'A01 - VIOKAL TIENDA VIRTUAL': 'viokal',
  'A05 - TE TIANSHI TIENDA VIRTUAL': 'te-antilipido-de-tianshi',
  'A07 - CHITOSA TIENDA VIRTUAL': 'capsula-de-chitosa',
  'A39 - TE MILENARIO TIENDA VIRTUAL': 'te-reductor-de-peso',
  'A75 - CORDYCAFE TIENDA VIRTUAL': 'tiens-cordycafe',
  'A93 - TIENS COLAGENO TIENDA VIRTUAL': 'tiens-colageno-forte-gingseng',
  'A94 - TIENS FE FOLIC TIENDA VIRTUAL': 'tiens-fe-folic',
  'CSSKECO008 - GREEN BUBBLE CLEANSER': 'green-bubble-cleanser',
  'F17 - SET DE TOALLAS AIRIZ TIENDA VIRTUAL': 'set-toallas-higienicas-airiz',
  'F18 - PASTA DENTAL ORECARE TIENDA VIRTUAL': 'pasta-dental-herbal-orecare',
};

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function processProductFolder(folderName) {
  const slug = PRODUCT_SLUGS[folderName];

  if (!slug) {
    console.warn(`⚠ No slug mapping for: ${folderName}`);
    return;
  }

  const inputDir = path.join(INPUT_BASE, folderName);
  const outputDir = path.join(OUTPUT_BASE, slug);

  await ensureDir(outputDir);

  const files = await fs.readdir(inputDir);

  const imageFiles = files.filter(file =>
    /\.(png|jpg|jpeg)$/i.test(file)
  );

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];

    const inputFile = path.join(inputDir, file);

    const outputName =
      i === 0
        ? 'main.webp'
        : `gallery-${String(i).padStart(2, '0')}.webp`;

    const outputFile = path.join(outputDir, outputName);

    console.log(`Converting: ${inputFile}`);

    await sharp(inputFile)
      .webp({
        quality: 82,
      })
      .toFile(outputFile);

    console.log(`✔ Created: ${outputFile}`);
  }
}

async function main() {
  await ensureDir(OUTPUT_BASE);

  const folders = await fs.readdir(INPUT_BASE);

  for (const folder of folders) {
    const fullPath = path.join(INPUT_BASE, folder);

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await processProductFolder(folder);
    }
  }

  console.log('✅ Conversion completed');
}

main().catch(console.error);