document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const loopBtn = document.getElementById("loopBtn");
  const seekSlider = document.getElementById("seekSlider");
  const volumeSlider = document.getElementById("volumeSlider");
  const togglePlayerBtn = document.getElementById("togglePlayerBtn");
  const audioPlayerContainer = document.getElementById("audioPlayerContainer");
  const audioPlayer = document.getElementById("audioPlayer");

  // Play/Pause functionality
  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playPauseBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                `;
    } else {
      audio.pause();
      playPauseBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                `;
    }
  });

  // Loop functionality
  loopBtn.addEventListener("click", () => {
    audio.loop = !audio.loop;
    loopBtn.classList.toggle("text-red-500");
  });

  // Seek slider functionality
  seekSlider.addEventListener("input", () => {
    const seekTo = audio.duration * (seekSlider.value / 100);
    audio.currentTime = seekTo;
  });

  // Update seek slider as audio plays
  audio.addEventListener("timeupdate", () => {
    const value = (100 / audio.duration) * audio.currentTime;
    seekSlider.value = value;
  });

  // Volume slider functionality
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
  });

  // Initialize volume
  audio.volume = volumeSlider.value / 100;

  // Toggle player visibility
  togglePlayerBtn.addEventListener("click", () => {
    audioPlayer.classList.toggle("hidden");
    togglePlayerBtn.querySelector("svg").classList.toggle("rotate-180");
  });

  function toMS(str) {
    if (!str.includes(":")) return parseFloat(str);
    const [mins, secms] = str.split(":");
    const [sec, ms] = secms.split(".");
    return (+mins * 60 + +sec) * 1000 + +ms;
  }

  function setupPlayer(elementId) {
    const audioMedia = document.getElementById(elementId);
    if (!audioMedia) {
      return;
    }

    var syncElements = document.querySelectorAll("[data-sync-from]");
    syncElements.forEach(function (el) {
      el.addEventListener("click", function () {
        var time = el.getAttribute("data-sync-from");
        audioMedia.currentTime = toMS(time) / 1000;
        audioMedia.play();
      });
    });
  }

  setupPlayer("audio");
});
