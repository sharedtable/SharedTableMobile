const sharp = require('sharp');
const path = require('path');

async function generateBlankSplash() {
  try {
    const outputPath = path.join(__dirname, 'src/assets/splash.png');
    
    // Create just a plain red image - no logo, no text
    await sharp({
      create: {
        width: 1242,
        height: 2436,
        channels: 4,
        background: { r: 226, g: 72, b: 73, alpha: 1 } // #E24849
      }
    })
    .png()
    .toFile(outputPath);
    
    console.log('✅ Blank red splash screen generated!');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateBlankSplash();