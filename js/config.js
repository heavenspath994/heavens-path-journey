// config.js
// IMPORTANT: Update this URL to your live Render backend URL before deploying to Netlify!
const CONFIG = {
    API_BASE: (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.hostname === '')
        ? 'http://localhost:3000/api'
        : 'https://heavens-path-journey.onrender.com/api'
};
