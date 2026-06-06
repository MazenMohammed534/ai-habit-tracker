import confetti from "canvas-confetti";

export const celebrate = (origin = { x: 0.5, y: 0.6 }) => {
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    scalar: 0.9,
    origin,
    colors: ["#c084fc", "#d8b4fe", "#a855f7", "#e9d5ff", "#9333ea"],
  });
};

export const celebrateBig = () => {
  const duration = 800;
  const end = Date.now() + duration;
  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#c084fc", "#d8b4fe", "#a855f7"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#c084fc", "#d8b4fe", "#a855f7"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};
