// js/youtube-player.js

let ytPlayer;
let currentVideoId = null;
let isPlayerReady = false;
let progressInterval = null;

// Elements
const modal = document.getElementById('video-modal');
const modalTitle = document.getElementById('video-modal-title');
const closeBtn = document.getElementById('close-video-modal');

// Controls
const playPauseBtn = document.getElementById('btn-play-pause');
const skipBackwardBtn = document.getElementById('btn-skip-backward');
const skipForwardBtn = document.getElementById('btn-skip-forward');
const speedSelect = document.getElementById('playback-speed');
const progressBarContainer = document.getElementById('video-progress-container');
const progressBarFill = document.getElementById('video-progress-fill');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');

// Load YouTube IFrame API asynchronously
function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// This function is automatically called by the YouTube API once it's loaded
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtube-player-container', {
        height: '100%',
        width: '100%',
        videoId: '', // Will be set dynamically when opened
        playerVars: {
            'playsinline': 1,
            'controls': 0,      // Hide native controls
            'disablekb': 1,     // Disable keyboard controls (we handle custom ones if needed)
            'fs': 0,            // Hide fullscreen button
            'rel': 0,           // Don't show related videos from other channels at the end
            'modestbranding': 1 // Minimal YouTube branding
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady(event) {
    isPlayerReady = true;
    setupCustomControls();
}

function onPlayerStateChange(event) {
    // Update play/pause icon based on state
    if (event.data == YT.PlayerState.PLAYING) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        startProgressInterval();

        // Ensure speed matches our select box when starting a new video
        ytPlayer.setPlaybackRate(parseFloat(speedSelect.value));

    } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopProgressInterval();
    }

    // Update total time when video starts playing or unbuffered
    if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.BUFFERING) {
         timeTotal.textContent = formatTime(ytPlayer.getDuration());
    }
}

// Format seconds to mm:ss
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}

// Update the progress bar and current time text
function updateProgress() {
    if (!isPlayerReady || !ytPlayer || !ytPlayer.getCurrentTime) return;

    const current = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();

    timeCurrent.textContent = formatTime(current);

    if (duration > 0) {
        const percentage = (current / duration) * 100;
        progressBarFill.style.width = `${percentage}%`;
    }
}

function startProgressInterval() {
    stopProgressInterval();
    progressInterval = setInterval(updateProgress, 500); // Update twice a second
}

function stopProgressInterval() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Setup Event Listeners for Custom Controls
function setupCustomControls() {
    playPauseBtn.addEventListener('click', () => {
        if (!isPlayerReady) return;
        const state = ytPlayer.getPlayerState();
        if (state == YT.PlayerState.PLAYING) {
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
        }
    });

    skipBackwardBtn.addEventListener('click', () => {
        if (!isPlayerReady) return;
        const current = ytPlayer.getCurrentTime();
        ytPlayer.seekTo(Math.max(0, current - 10), true);
    });

    skipForwardBtn.addEventListener('click', () => {
        if (!isPlayerReady) return;
        const current = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        ytPlayer.seekTo(Math.min(duration, current + 10), true);
    });

    speedSelect.addEventListener('change', (e) => {
        if (!isPlayerReady) return;
        const speed = parseFloat(e.target.value);
        ytPlayer.setPlaybackRate(speed);
    });

    progressBarContainer.addEventListener('click', (e) => {
        if (!isPlayerReady) return;

        const rect = progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;

        const duration = ytPlayer.getDuration();
        ytPlayer.seekTo(duration * percentage, true);
    });
}

// Expose a function to open a video dynamically (e.g., from the Student dashboard list)
window.openYouTubeVideo = function(videoId, title) {
    if (!videoId) return;

    currentVideoId = videoId;
    modalTitle.textContent = title || "Recording Player";

    modal.classList.remove('hidden');

    if (isPlayerReady) {
        ytPlayer.loadVideoById(videoId);
    } else {
        // If not ready yet, it will load blank, but you'll have to play it manually once ready.
        // In a perfect world, we queue this request, but this is a simple implementation.
        console.warn("Player not fully ready yet. Try again in a moment.");
    }
};

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    if (isPlayerReady && ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
    }
});

// Start initialization
loadYouTubeAPI();
