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
const videoWrapper = document.getElementById('custom-video-wrapper');
const interactionOverlay = document.getElementById('video-interaction-overlay');
const playPauseBtn = document.getElementById('btn-play-pause');
const muteBtn = document.getElementById('btn-mute');
const volumeSlider = document.getElementById('volume-slider');
const fullscreenBtn = document.getElementById('btn-fullscreen');
const speedSelect = document.getElementById('playback-speed');
const progressBarContainer = document.getElementById('video-progress-container');
const progressBarFill = document.getElementById('video-progress-fill');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');

let clickTimer = null;
let previousVolume = 100;

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
            'disablekb': 1,     // Disable keyboard controls
            'fs': 0,            // Hide fullscreen button
            'rel': 0,           // Don't show related videos from other channels at the end
            'modestbranding': 1,// Minimal YouTube branding
            'iv_load_policy': 3 // Hide annotations and cards
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
    // Single & Double Click Logic on Overlay
    interactionOverlay.addEventListener('click', (e) => {
        if (!isPlayerReady) return;

        if (clickTimer === null) {
            // First click
            clickTimer = setTimeout(() => {
                // Single click action: Toggle Play/Pause
                const state = ytPlayer.getPlayerState();
                if (state == YT.PlayerState.PLAYING) {
                    ytPlayer.pauseVideo();
                } else {
                    ytPlayer.playVideo();
                }
                clickTimer = null;
            }, 250); // Wait 250ms to see if a second click happens
        } else {
            // Second click (Double click)
            clearTimeout(clickTimer);
            clickTimer = null;

            // Determine left or right side click
            const rect = interactionOverlay.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const current = ytPlayer.getCurrentTime();
            const duration = ytPlayer.getDuration();

            if (clickX < rect.width / 2) {
                // Left side: Skip backward 10s
                ytPlayer.seekTo(Math.max(0, current - 10), true);
            } else {
                // Right side: Skip forward 10s
                ytPlayer.seekTo(Math.min(duration, current + 10), true);
            }
        }
    });

    // Play/Pause Button
    playPauseBtn.addEventListener('click', () => {
        if (!isPlayerReady) return;
        const state = ytPlayer.getPlayerState();
        if (state == YT.PlayerState.PLAYING) {
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
        }
    });

    // Volume & Mute
    muteBtn.addEventListener('click', () => {
        if (!isPlayerReady) return;
        if (ytPlayer.isMuted() || ytPlayer.getVolume() === 0) {
            ytPlayer.unMute();
            ytPlayer.setVolume(previousVolume || 100);
            volumeSlider.value = previousVolume || 100;
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            previousVolume = ytPlayer.getVolume();
            ytPlayer.mute();
            volumeSlider.value = 0;
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        if (!isPlayerReady) return;
        const vol = parseInt(e.target.value);
        ytPlayer.setVolume(vol);
        if (vol === 0) {
            ytPlayer.mute();
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            ytPlayer.unMute();
            if (vol < 50) {
                muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
    });

    // Speed Control
    speedSelect.addEventListener('change', (e) => {
        if (!isPlayerReady) return;
        const speed = parseFloat(e.target.value);
        ytPlayer.setPlaybackRate(speed);
    });

    // Fullscreen Toggle
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.webkitRequestFullscreen) {
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.msRequestFullscreen) {
                videoWrapper.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    });

    // Fullscreen Event Listener to update icon
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
    document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

    function updateFullscreenIcon() {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    // Scrubber
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
