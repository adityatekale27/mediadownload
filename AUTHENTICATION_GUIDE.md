# Authentication Setup Guide

Many platforms like YouTube and Instagram require authentication to download content, especially for:
- Private or age-restricted content
- High-quality downloads
- Avoiding rate limits

## Setting Up Cookies for Authentication

### Method 1: Browser Extension (Recommended)
1. Install a browser extension like "Get cookies.txt LOCALLY" or "cookies.txt"
2. Visit the platform you want to download from (YouTube, Instagram, etc.)
3. Log into your account
4. Use the extension to export cookies
5. Save the file as `cookies.txt` in the root directory of this project

### Method 2: Manual Export from Browser
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Find Cookies for the platform domain
4. Export in Netscape format
5. Save as `cookies.txt`

### Method 3: yt-dlp Browser Integration
You can also use yt-dlp's built-in browser cookie extraction:
```bash
yt-dlp --cookies-from-browser chrome --write-info-json [URL]
```

## Platform-Specific Notes

### YouTube
- Required for age-restricted content
- Helps avoid "Sign in to confirm" errors
- Enables access to premium quality streams

### Instagram  
- Essential due to aggressive rate limiting
- Required for most content downloads
- Helps avoid HTTP 429 errors

### Facebook/Meta
- Needed for private content
- Reduces rate limit issues

## File Format
The cookies.txt file should be in Netscape format:
```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	FALSE	1234567890	session_token	your_session_value
```

## Security Notes
- Keep your cookies.txt file private
- Don't share it with others
- Regenerate if compromised
- The file contains your login session information

## Troubleshooting
- Ensure cookies.txt is in the project root directory
- Check file permissions (should be readable)
- Try refreshing cookies if downloads still fail
- Some platforms may require recent cookies (less than 24 hours old)