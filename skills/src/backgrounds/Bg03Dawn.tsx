// BG 03 — Dawn Memory
// Warm sunrise · sun orb slowly rises and breathes
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Vignette, Hairline, fadeIn} from './Shared';
import {rgba, rgb, ROSE, APRICOT, CREAM, BLUSH, DUSTGOLD} from './palette';

export const Bg03Dawn: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	// Sun gently rises then holds; loops via interpolate extrapolate clamp
	const rise = interpolate(frame, [0, fps * 2.5], [0.55, 0.45], {
		extrapolateRight: 'clamp',
	});
	const breathe = 1 + Math.sin(t / 4) * 0.04; // 4s period
	const sunSize = 15 * breathe;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${sunSize}% ${sunSize * 1.1}% at 50% ${rise * 100}%, rgba(255,235,215,0.95) 0%, transparent 100%)`,
					`radial-gradient(ellipse ${sunSize * 2.3}% ${sunSize * 2.5}% at 50% ${rise * 100}%, ${rgba(APRICOT, 0.75)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 60% 60% at 50% 10%, ${rgba(ROSE, 0.75)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 55% 55% at 50% 95%, ${rgba(CREAM, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 10% 50%, ${rgba(BLUSH, 0.7)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 90% 50%, ${rgba(BLUSH, 0.7)} 0%, transparent 100%)`,
					rgb(ROSE),
				].join(', '),
			}}
		>
			<Hairline x1={0} y1={0.62} x2={1} y2={0.62} color={DUSTGOLD} alpha={0.28} />
			<Hairline x1={0} y1={0.78} x2={1} y2={0.78} color={DUSTGOLD} alpha={0.10} />
			<Vignette intensity={0.18} />
		</AbsoluteFill>
	);
};
