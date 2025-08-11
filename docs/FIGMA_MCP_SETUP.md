# Figma MCP Setup Guide

This guide will help you connect your Figma design file to Claude through MCP (Model Context Protocol).

## Prerequisites

1. **Figma Account**: You need access to the Figma file
2. **Figma Personal Access Token**: Generate one from Figma
3. **Node.js**: Required for running the MCP server

## Step 1: Get Your Figma Access Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll down to "Personal Access Tokens"
3. Click "Create new token"
4. Give it a name like "SharedTable MCP"
5. Copy the token (you'll need it soon)

## Step 2: Get Your Figma File ID

Your Figma file URL looks like:
```
https://www.figma.com/file/FILE_ID/File-Name
```

Copy the `FILE_ID` part from your URL.

## Step 3: Install Figma MCP Server

```bash
# Install globally
npm install -g @modelcontextprotocol/server-figma

# Or install locally in your project
npm install --save-dev @modelcontextprotocol/server-figma
```

## Step 4: Configure Claude Desktop

1. Open Claude Desktop settings
2. Go to Developer → Model Context Protocol
3. Add the Figma MCP configuration:

Create or edit the file: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-figma"
      ],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace `YOUR_TOKEN_HERE` with your actual Figma token.

## Step 5: Alternative - Local Configuration

If you prefer to keep the configuration in your project:

Create `.env.local` (don't commit this!):
```env
FIGMA_PERSONAL_ACCESS_TOKEN=your-token-here
FIGMA_FILE_ID=your-file-id-here
```

## Step 6: Connect in Claude

1. Restart Claude Desktop after configuration
2. In a new conversation, you should see Figma MCP available
3. You can then use commands like:
   - "Get Figma file details"
   - "Export Figma components"
   - "Get design tokens from Figma"

## Available MCP Commands

Once connected, you can:

- **Read Figma Files**: Access file structure and metadata
- **Export Assets**: Download images and icons
- **Get Styles**: Extract colors, typography, and effects
- **Access Components**: View and export component definitions
- **Get Design Tokens**: Extract design system values

## Example Usage in Claude

```
"Can you get the color palette from my Figma file?"
"Export all the icons from the Figma design"
"Show me the typography styles in Figma"
"Get the component structure from Figma"
```

## Troubleshooting

### Token Issues
- Make sure your token has read access to the file
- Tokens expire after 365 days
- Generate a new token if you see authentication errors

### Connection Issues
- Restart Claude Desktop after config changes
- Check that Node.js is installed: `node --version`
- Verify MCP server is installed: `npx @modelcontextprotocol/server-figma --version`

### File Access
- Ensure the Figma file is not in a restricted team
- You need at least "View" access to the file

## Security Notes

- **Never commit your Figma token** to version control
- Add `.env.local` to `.gitignore`
- Consider using environment variables for CI/CD

## Project-Specific Figma Details

For SharedTable Mobile:
- File ID: [Add your file ID here]
- Design System Page: [Page name]
- Components Page: [Page name]
- Screens/Flows: [List main flows]

---

Once set up, Claude will have direct access to your Figma designs and can:
- Extract exact colors, fonts, and spacing
- Generate code matching your components
- Keep implementation synchronized with design
- Export assets as needed