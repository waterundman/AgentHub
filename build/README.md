# Build Resources

This directory contains resources needed for building the desktop application.

## Required Files

- `icon.ico` - Windows icon (256x256 recommended)
- `icon.icns` - macOS icon (512x512 recommended)
- `icons/` - Linux icons directory

## Icon Generation

You can generate icons from a PNG using:

### Windows (.ico)
```bash
npm install -g png-to-ico
png-to-ico logo.png > build/icon.ico
```

### macOS (.icns)
```bash
npm install -g icongenerator
icongenerator logo.png build/icon.icns
```

## Temporary Placeholder

For now, the app will use Electron's default icon.
Replace these files before production build.