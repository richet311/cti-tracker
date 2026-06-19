export function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] },
  };
}
