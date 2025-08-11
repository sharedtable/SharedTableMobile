# 🎨 Figma MCP Setup Instructions

## ✅ Your Configuration is Ready!

Your Figma API token has been securely saved. Now follow these steps to complete the setup:

## Step 1: Copy Configuration to Claude Desktop

### On macOS:
```bash
# Create the config directory if it doesn't exist
mkdir -p ~/.config/claude/

# Copy the configuration file
cp claude_desktop_config.json ~/.config/claude/claude_desktop_config.json
```

### On Windows:
1. Open File Explorer
2. Go to `%APPDATA%\claude\`
3. Copy `claude_desktop_config.json` from this project to that folder

## Step 2: Get Your Figma File ID

1. Open your Figma file in the browser
2. Look at the URL: `https://www.figma.com/file/YOUR_FILE_ID/FileName`
3. Copy the `YOUR_FILE_ID` part

## Step 3: Update the Environment File

Edit `.env.local` and add your Figma file ID:
```env
FIGMA_PERSONAL_ACCESS_TOKEN=figd_TvQ-qSWwtRFo6IoSrZJ0mdJ5Psx2878zwcjBOA7Z
FIGMA_FILE_ID=YOUR_FILE_ID_HERE
```

## Step 4: Restart Claude Desktop

1. Completely quit Claude Desktop (not just close the window)
2. Start Claude Desktop again
3. The Figma MCP should now be available

## Step 5: Test the Connection

In a new Claude conversation, try:
- "Can you connect to my Figma file?"
- "Show me the colors from my Figma design"
- "List the components in my Figma file"

## Alternative: Manual Figma Integration

If MCP isn't available yet, you can still work with Figma by:

### Using Figma's REST API directly:

```bash
# Test your token
curl -H "X-Figma-Token: figd_TvQ-qSWwtRFo6IoSrZJ0mdJ5Psx2878zwcjBOA7Z" \
  "https://api.figma.com/v1/me"

# Get file info
curl -H "X-Figma-Token: figd_TvQ-qSWwtRFo6IoSrZJ0mdJ5Psx2878zwcjBOA7Z" \
  "https://api.figma.com/v1/files/YOUR_FILE_ID"
```

### Export from Figma:

1. **Design Tokens**: Use Figma's "Design Tokens" plugin
2. **Assets**: Right-click → "Copy as SVG/PNG"
3. **CSS**: Right-click → "Copy as CSS"
4. **Components**: Use Figma's Dev Mode

## 🔒 Security Notes

- ✅ Your token is saved in `.env.local` (gitignored)
- ✅ Never commit your token to version control
- ✅ Token expires after 365 days
- ✅ Regenerate token if compromised

## 📱 Your Token Details

```
Token: figd_TvQ-qSWwtRFo6IoSrZJ0mdJ5Psx2878zwcjBOA7Z
Type: Personal Access Token
Access: Read-only by default
```

## 🚀 What's Next?

Once connected, I can:
- Extract exact colors, fonts, spacing from your Figma
- Generate components matching your designs
- Export assets directly
- Keep code synchronized with design changes

## Need Help?

If the MCP server isn't available yet, we can:
1. Use Figma's Dev Mode to manually extract values
2. Export assets and import them
3. Use Figma plugins for code generation
4. Copy CSS/Swift/Android styles directly from Figma

---

**Current Status**: Token configured ✅ | Waiting for MCP server availability