import { useEffect } from 'react';
import Lenis from 'lenis';

const SmoothScroll = () => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 0.8, // Slightly faster, snappier
            easing: (t) => 1 - Math.pow(1 - t, 3), // Simpler cubic easing for less math overhead in 90Hz+ displays
            smoothWheel: true,
            wheelMultiplier: 0.9,
            syncTouch: true, // Ensure touch syncs seamlessly with the scroll thread
            touchMultiplier: 1.5,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return null; // This component doesn't render anything UI-wise
};

export default SmoothScroll;
