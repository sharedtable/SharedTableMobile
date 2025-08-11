const sharp = require('sharp');
const path = require('path');

async function generateIcon() {
  try {
    const logoPath = path.join(__dirname, 'src/assets/images/logo/logo.png');
    const outputPath = path.join(__dirname, 'src/assets/icon.png');
    
    // Create icon with red background and white logo
    const logo = await sharp(logoPath)
      .resize(512, 512)
      .negate({ alpha: false }) // Make logo white
      .toBuffer();
    
    await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: { r: 226, g: 72, b: 73, alpha: 1 } // #E24849
      }
    })
    .composite([
      {
        input: logo,
        top: 256,
        left: 256,
      }
    ])
    .png()
    .toFile(outputPath);
    
    console.log('✅ Icon generated with red background!');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateIcon();