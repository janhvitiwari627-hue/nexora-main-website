'use client';

/**
 * Decorative sparkle layer for the premium hero.
 *
 * Purely visual: aria-hidden, pointer-events none, and frozen automatically
 * under prefers-reduced-motion (the .premium-home reduced-motion block forces
 * every animation inside the homepage to ~0ms).
 *
 * Particle positions are static — the browser does all the work via the
 * hero-twinkle keyframes in globals.css (no JS animation loop, no re-renders).
 * 35 particles per the design spec.
 */
const PARTICLES: Array<{ left: string; top: string; size: number; delay: number; duration: number }> = [
  { left: "3%",  top: "12%", size: 4, delay: 0,    duration: 5.5 },
  { left: "6%",  top: "18%", size: 5, delay: 1.9,  duration: 6.2 },
  { left: "9%",  top: "55%", size: 3, delay: 0.8,  duration: 4.9 },
  { left: "12%", top: "82%", size: 4, delay: 2.4,  duration: 6.6 },
  { left: "14%", top: "64%", size: 4, delay: 1.2,  duration: 6.5 },
  { left: "18%", top: "30%", size: 3, delay: 0.5,  duration: 4.7 },
  { left: "22%", top: "36%", size: 3, delay: 0.6,  duration: 4.8 },
  { left: "25%", top: "8%",  size: 5, delay: 2.8,  duration: 7.1 },
  { left: "28%", top: "72%", size: 3, delay: 1.6,  duration: 5.6 },
  { left: "31%", top: "78%", size: 5, delay: 2.1,  duration: 7.0 },
  { left: "34%", top: "20%", size: 4, delay: 0.3,  duration: 5.2 },
  { left: "37%", top: "46%", size: 3, delay: 3.1,  duration: 6.1 },
  { left: "39%", top: "12%", size: 4, delay: 0.4,  duration: 5.2 },
  { left: "43%", top: "88%", size: 3, delay: 1.1,  duration: 5.9 },
  { left: "47%", top: "52%", size: 3, delay: 1.7,  duration: 6.0 },
  { left: "50%", top: "25%", size: 6, delay: 0.9,  duration: 6.8 },
  { left: "53%", top: "70%", size: 4, delay: 2.6,  duration: 5.4 },
  { left: "56%", top: "42%", size: 3, delay: 0.2,  duration: 4.6 },
  { left: "59%", top: "15%", size: 4, delay: 3.4,  duration: 6.3 },
  { left: "62%", top: "62%", size: 3, delay: 1.4,  duration: 5.7 },
  { left: "65%", top: "85%", size: 4, delay: 0.7,  duration: 5.1 },
  { left: "68%", top: "35%", size: 5, delay: 2.2,  duration: 6.9 },
  { left: "71%", top: "16%", size: 3, delay: 0.4,  duration: 4.6 },
  { left: "74%", top: "58%", size: 4, delay: 3.0,  duration: 6.4 },
  { left: "77%", top: "92%", size: 3, delay: 1.8,  duration: 5.8 },
  { left: "80%", top: "48%", size: 5, delay: 0.6,  duration: 6.7 },
  { left: "83%", top: "28%", size: 3, delay: 2.5,  duration: 5.0 },
  { left: "86%", top: "32%", size: 4, delay: 1.3,  duration: 5.8 },
  { left: "89%", top: "76%", size: 3, delay: 0.9,  duration: 6.2 },
  { left: "91%", top: "10%", size: 4, delay: 3.2,  duration: 6.0 },
  { left: "93%", top: "74%", size: 3, delay: 0.7,  duration: 6.6 },
  { left: "95%", top: "40%", size: 5, delay: 2.0,  duration: 7.2 },
  { left: "97%", top: "22%", size: 3, delay: 1.5,  duration: 4.9 },
  { left: "15%", top: "45%", size: 3, delay: 2.9,  duration: 6.3 },
  { left: "45%", top: "33%", size: 4, delay: 1.0,  duration: 5.3 },
];

export default function HeroParticles() {
  return (
    <div className="hero-particles" aria-hidden="true">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
