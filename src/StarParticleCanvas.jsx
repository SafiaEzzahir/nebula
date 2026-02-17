import './App.css'
import { useRef, useEffect } from 'react'

export function StarParticleCanvas({ maxParticles = 50 }) {
    // useRef saves values, won't re-render on change :yayyyy:
    const CanvasRef = useRef(null);
    const ParticlesRef = useRef([]);

    const PoolRef = useRef([]);
    const RafRef = useRef([]);

    const LastPosRef = useRef(null)
    const LastTimeRef = useRef(performance.now());

    useEffect(() => {
        const Canvas = CanvasRef.current;

        if (!Canvas) return;

        function createParticle(x, y, vx, vy) {
            let p = PoolRef.current.pop();
            if (!p) p = {};

            p.x = x;
            p.y = y;
            p.vx = vx;
            p.vy = vy;
            
            p.size = 3+Math.random() * 6;
            p.life = 2500 + Math.random() * 100;
            p.age = 0;
            p.color = '#f9eea6';
            return p;
        }

        function spawnParticle(count, lastX, lastY) {
            for (let i = 0; i < count; i++) {
                const x = Math.random() * (Canvas.width - Dpr / 5);
                const y = Math.random() * (Canvas.height - Dpr / 5);

                const angle = Math.atan2(y - (lastY ?? y) + (Math.random() - 0.5) * 1.2, x - (lastX ?? x) + (Math.random() - 0.5) * 1.2);

                const speed = 0.05 + Math.random() * 1.2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;

                const p = createParticle(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, vx, vy);

                ParticlesRef.current.push(p);
                if (ParticlesRef.current.length > maxParticles) {
                    const removed = ParticlesRef.current.shift();
                    PoolRef.current.push(removed);
                }
            }
        }

        const Ctx = Canvas.getContext('2d');
        let Dpr = window.devicePixelRatio || 1;

        function resize() {
            Dpr = window.devicePixelRatio || 1;

            Canvas.width = Math.max(1, innerWidth * Dpr);
            Canvas.height = Math.max(1, innerHeight * Dpr);

            Canvas.style.width = innerWidth + 'px';
            Canvas.style.height = innerHeight + 'px';

            Ctx.setTransform(Dpr, 0, 0, Dpr, 0, 0);

            spawnParticle(50);
        }

        resize();
        window.addEventListener('resize', resize)

        function onMove(e) {
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            
            const last = LastPosRef.current;
            const now = performance.now();
            const dt = Math.max(1, now-LastTimeRef.current);

            let speed = 0;

            if (last) {
                const dx = x - last.x, dy = y - last.y;
                speed = (Math.sqrt(dx * dx + dy * dy) / dt * 16)/4;

                const dist = Math.hypot(dx, dy);
                const steps = Math.ceil(dist/8);

                for (let i = 0; i < steps; i++) {
                    const ix = last.x + dx * (i + 1) / steps;
                    const iy = last.y + dy * (i + 1) / steps;
                    spawnParticle(ix, iy, 1 + Math.floor(Math.random() * 2), Math.min(3, 1 + speed), last.x, last.y);
                }
            } else {
                spawnParticle(x, y, 2, 1);
            }
            LastPosRef.current = { x, y };
            LastTimeRef.current = now;
        }

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });

        function update(now) {
            const dt = Math.min(50, now - LastTimeRef.current);

            LastTimeRef.current = now;
            const particles = ParticlesRef.current;
            const Particles = ParticlesRef.current;

            Ctx.clearRect(0, 0, Canvas.width/Dpr, Canvas.height/Dpr);

            for (let i = Particles.length - 1; i >= 0; i--) {
                const p = Particles[i];
                p.age += dt;
                if (p.age >= p.life) {
                    Particles.splice(i, 1);
                    PoolRef.current.push(p);
                    spawnParticle(1);
                    continue;
                }

                p.vx *= 0.995;
                p.vy *= 0.995;
                p.x += p.vx * (dt/16);
                p.y += p.vy * (dt/16) + 0.02 * (dt/16);

                const t = p.age / p.life;
                const alpha = 1 - t;
                const size = p.size * (1 - t * 0.8);

                Ctx.save();
                Ctx.beginPath();
                Ctx.fillStyle = p.color;
                Ctx.globalAlpha = alpha;
                Ctx.shadowColor = p.color;
                Ctx.shadowBlur = 10;

                Ctx.rect(p.x, p.y, size, size);
                Ctx.stroke();
                Ctx.fill();
                Ctx.restore();
            }
        }

        RafRef.current = requestAnimationFrame(update)

        return () => {
            cancelAnimationFrame(RafRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
        }
    });

    return (
        <canvas ref={CanvasRef} id='StarParticleCanvas'></canvas>
    )
}