document.addEventListener("DOMContentLoaded", () => {
  const playPauseBtn = document.getElementById("play-pause");
  const loopBtn = document.getElementById("loop");
  const progressBar = document.getElementById("progress-bar");
  const kebabMenu = document.getElementById("kebab-menu");
  const dropdownMenu = document.getElementById("dropdown-menu");

  const playIcon = playPauseBtn.querySelector(".play-icon");
  const pauseIcon = playPauseBtn.querySelector(".pause-icon");

  let sound = new Howl({
    src: [window.resucito.audio.src],
    html5: true,
    preload: true,
    loop: false,
    onload: () => {
      progressBar.max = sound.duration();
    },
    onplay: () => {
      requestAnimationFrame(updateProgress);
    },
    onend: () => {
      if (!sound.loop()) {
        playIcon.classList.remove("hidden");
        pauseIcon.classList.add("hidden");
      }
    },
  });

  function togglePlayPause() {
    if (sound.playing()) {
      sound.pause();
      playIcon.classList.remove("hidden");
      pauseIcon.classList.add("hidden");
    } else {
      sound.play();
      playIcon.classList.add("hidden");
      pauseIcon.classList.remove("hidden");
    }
  }

  function toggleLoop() {
    sound.loop(!sound.loop());
    loopBtn.classList.toggle("active");
  }

  function updateProgress() {
    progressBar.value = sound.seek();
    if (sound.playing()) {
      requestAnimationFrame(updateProgress);
    }
  }

  function seek() {
    sound.seek(progressBar.value);
  }

  function toggleDropdown() {
    dropdownMenu.classList.toggle("hidden");
  }

  playPauseBtn.addEventListener("click", togglePlayPause);
  loopBtn.addEventListener("click", toggleLoop);
  progressBar.addEventListener("input", seek);
  kebabMenu.addEventListener("click", toggleDropdown);

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !kebabMenu.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      dropdownMenu.classList.add("hidden");
    }
  });
});
