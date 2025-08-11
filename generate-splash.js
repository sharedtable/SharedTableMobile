const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateSplash() {
  try {
    const logoPath = path.join(__dirname, 'src/assets/images/logo/logo.png');
    const outputPath = path.join(__dirname, 'src/assets/splash.png');
    
    // Splash screen dimensions
    const width = 1242;
    const height = 2436;
    const logoSize = 260;
    
    // Read the original logo
    const logoMeta = await sharp(logoPath).metadata();
    console.log('Logo info:', logoMeta);
    
    // Process logo to make it white
    // First, let's just use the logo as-is but with white overlay
    const processedLogo = await sharp(logoPath)
      .resize(logoSize, logoSize)
      .negate({ alpha: false }) // This should invert colors making dark areas light
      .toBuffer();
    
    // Create the final splash with red background
    const splash = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 226, g: 72, b: 73, alpha: 1 } // #E24849
      }
    })
    .composite([
      {
        input: processedLogo,
        top: Math.floor((height - logoSize) / 2),
        left: Math.floor((width - logoSize) / 2),
        blend: 'over'
      }
    ])
    .png()
    .toFile(outputPath);
    
    console.log('✅ Splash screen generated successfully!');
    console.log('   - Size: ' + width + 'x' + height);
    console.log('   - Background: #E24849 (red)');
    console.log('   - Logo: ' + logoSize + 'x' + logoSize + ' (white, centered)');
    
    // Verify the file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log('   - File size: ' + (stats.size / 1024).toFixed(2) + ' KB');
    }
  } catch (error) {
    console.error('Error generating splash:', error);
  }
}

generateSplash();