// Simple JS to handle interactive placeholders
document.addEventListener("DOMContentLoaded", () => {
  // Select all trailer and play buttons
  const playButtons = document.querySelectorAll(
    ".play-btn-large, .btn-trailer",
  );

  playButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      // This is where you will eventually trigger your video modal or routing
      console.log("Video play triggered. Implement video player logic here.");
      alert("Video placeholder: Video will play here.");
    });
  });
});
