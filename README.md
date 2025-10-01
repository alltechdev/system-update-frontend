# System Update Manager

A web-based frontend for managing Android system updates, scripts, and APKs. Generate JSON configuration files for your system update apps with an intuitive interface.

## Features

- **Update Management**: Add, edit, and delete system updates
- **Script & APK Support**: Configure both shell scripts and APK downloads
- **JSON Generation**: Automatically generates properly formatted JSON
- **Live Preview**: See how updates will appear in your Android app
- **GitHub Pages Ready**: Deploy instantly to GitHub Pages

## Usage

1. **Add Updates**: Use the form to add new system updates with version numbers, descriptions, and URLs
2. **Configure Scripts**: Add shell script URLs for system modifications
3. **Add APKs**: Include APK download URLs for app installations
4. **Generate JSON**: Copy or download the generated JSON configuration
5. **Preview**: See how updates will look in your Android app

## JSON Format

The tool generates JSON in this format:

```json
{
  "latest_version": "1.2",
  "updates": {
    "1.1": {
      "script_url": "https://example.com/script.sh",
      "description": "Update description",
      "file_size": "1.2MB",
      "changelog": ["Feature 1", "Bug fix"]
    },
    "1.2": {
      "script_url": "https://example.com/script2.sh",
      "apk_url": "https://example.com/app.apk",
      "description": "Major update",
      "file_size": "2.1MB",
      "changelog": ["New features", "Improvements"]
    }
  },
  "required_android_version": "21"
}
```

## Deployment

This tool is designed to work with GitHub Pages. Simply:

1. Push to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Access your update manager at `https://username.github.io/repository-name`

## Android Integration

Use the generated JSON with the [System Update Android App](https://github.com/your-repo/system-update-app) to:

- Check for updates from GitHub
- Download and execute system scripts
- Install APK files with root privileges
- Track version history and prevent duplicate updates

## Development

Built with vanilla HTML, CSS, and JavaScript. No build process required.

- `index.html` - Main interface
- `styles.css` - Styling and responsive design
- `script.js` - Update management logic

## License

MIT License - feel free to use and modify for your projects.