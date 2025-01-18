function toMS(str) {
  if (!str.includes(":")) return parseFloat(str);
  const [mins, secms] = str.split(":");
  const [sec, ms] = secms.split(".");
  return (+mins * 60 + +sec) * 1000 + +ms;
}
document.addEventListener("DOMContentLoaded", () => {
  const playPauseBtn = document.getElementById("playPauseBtn");
  const loopBtn = document.getElementById("loopBtn");
  const seekSlider = document.getElementById("seekSlider");
  const volumeSlider = document.getElementById("volumeSlider");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");

  let audio = document.getElementById("audio");
  let isPlaying = false;
  let isLooping = false;

  // Play/Pause
  playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    isPlaying = !isPlaying;
    playIcon.classList.toggle("hidden", isPlaying);
    pauseIcon.classList.toggle("hidden", !isPlaying);
  });

  // Loop
  loopBtn.addEventListener("click", () => {
    isLooping = !isLooping;
    audio.loop = isLooping;
    loopBtn.classList.toggle("text-green-500", isLooping);
  });

  // Volume
  volumeSlider.addEventListener("input", (e) => {
    audio.volume = e.target.value;
  });

  // Seek
  seekSlider.addEventListener("input", (e) => {
    const seekTo = audio.duration * (e.target.value / 100);
    audio.currentTime = seekTo;
  });

  // Update seek slider as audio plays
  audio.addEventListener("timeupdate", () => {
    seekSlider.value = (audio.currentTime / audio.duration) * 100 || 0;
  });

  function setupPlayer(audioMedia) {
    if (!audioMedia) {
      return;
    }

    var syncElements = document.querySelectorAll("[data-sync-from]");
    syncElements.forEach(function (el) {
      el.addEventListener("click", function () {
        var time = el.getAttribute("data-sync-from");
        audioMedia.currentTime = toMS(time) / 1000;
        audioMedia.play();
        isPlaying = true;
      });
    });
  }

  setupPlayer(audio);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "Space":
        e.preventDefault();
        playPauseBtn.click();
        break;
      case "KeyL":
        loopBtn.click();
        break;
      case "ArrowLeft":
        audio.currentTime = Math.max(0, audio.currentTime - 1);
        break;
      case "ArrowRight":
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 1);
        break;
    }
  });
});
