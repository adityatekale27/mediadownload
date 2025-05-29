# Multi-Platform Media Downloader

A powerful, production-ready media downloader that enables seamless extraction of videos, reels, and audio from various social media platforms with robust URL processing capabilities.

## Features

- **Multi-Platform Support**: Download from YouTube, Instagram, TikTok, Twitter, Facebook, and 10+ more platforms
- **Multiple Formats**: Video, audio, and image downloads with quality selection
- **Real-time Processing**: Live status updates and progress tracking
- **Smart URL Validation**: Automatic platform detection and URL validation
- **Rate Limiting Protection**: Built-in Instagram rate limiting and queue management
- **Direct Image Downloads**: Fast direct downloads for image URLs
- **Responsive UI**: Modern, mobile-friendly interface
- **Download History**: Track and manage your download history
- **Error Handling**: Comprehensive error messages and retry logic

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, TanStack Query, Tailwind CSS
- **Media Processing**: yt-dlp with optimized platform-specific configurations
- **Storage**: In-memory storage (easily extendable to PostgreSQL)
- **Build Tool**: Vite with production optimizations

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install yt-dlp**
   ```bash
   pip install yt-dlp
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Open http://localhost:5000 in your browser

## Production Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

## Authentication Setup (Optional)

For enhanced access to private or age-restricted content, you can provide authentication cookies:

1. Export cookies from your browser using a cookies.txt extension
2. Save the file as `cookies.txt` in the project root
3. The application will automatically use these cookies for authenticated requests

See `AUTHENTICATION_GUIDE.md` for detailed setup instructions.

## Environment Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

## Supported Platforms

- YouTube (videos, shorts, audio)
- Instagram (posts, reels, stories)
- TikTok (videos, audio)
- Twitter/X (videos, GIFs)
- Facebook (videos, media)
- Vimeo (high-quality videos)
- Twitch (clips, VODs)
- SoundCloud (audio tracks)
- Reddit (videos, GIFs)
- Dailymotion (videos)
- Direct image URLs

## API Endpoints

- `GET /api/platforms` - Get supported platforms
- `POST /api/process` - Start media download
- `GET /api/downloads` - Get recent downloads
- `GET /api/downloads/:id` - Get download status
- `GET /api/download/:id` - Download completed file
- `DELETE /api/downloads/:id` - Delete download

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper comments
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Security Notes

- Never commit authentication cookies to version control
- Use environment variables for sensitive configuration
- Regularly update yt-dlp for latest platform compatibility
- Monitor download directory for storage management

## Troubleshooting

- **Downloads failing**: Check if yt-dlp is installed and updated
- **Instagram issues**: Provide authentication cookies for better access
- **Rate limiting**: The app automatically handles rate limits with queuing
- **File not found**: Ensure downloads directory exists and has write permissions