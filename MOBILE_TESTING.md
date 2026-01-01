# Mobile Testing Guide

## Option 1: Browser DevTools (Easiest)

1. Open your browser (Chrome, Firefox, Safari, Edge)
2. Press `F12` or right-click → "Inspect"
3. Click the device toggle icon (📱) or press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
4. Select a device preset (iPhone, iPad, etc.) or set custom dimensions
5. Refresh the page

## Option 2: Access from Mobile Device on Same Network

### Step 1: Start the dev server with network access

```bash
npm run dev:mobile
```

Or manually:
```bash
next dev -H 0.0.0.0
```

### Step 2: Find your computer's IP address

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```
Look for IPv4 Address (usually starts with 192.168.x.x or 10.x.x.x)

### Step 3: Access from mobile device

1. Make sure your mobile device is on the **same Wi-Fi network** as your computer
2. Open a browser on your mobile device
3. Navigate to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

### Troubleshooting

- **Can't connect?** Check your firewall settings - port 3000 needs to be open
- **Connection refused?** Make sure you're using `dev:mobile` script, not regular `dev`
- **Still not working?** Try accessing `http://localhost:3000` from your computer first to verify the server is running

## Option 3: Use ngrok (Access from Anywhere)

1. Install ngrok: https://ngrok.com/download
2. Start your dev server: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Open that URL on your mobile device (works on any network!)

## Recommended: Use Browser DevTools

For quick testing, **Option 1 (Browser DevTools)** is the fastest and easiest way to test mobile responsiveness without any network setup.

