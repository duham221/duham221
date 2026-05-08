// BG 03 — Dawn Memory
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, Hairline, fadeIn} from './Shared';
import {rgba, rgb, ROSE, APRICOT, CREAM, BLUSH, DUSTGOLD} from './palette';

export const Bg03Dawn: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	// Sun rises smoothly over full duration
	const cy = 55 - Math.sin(t / 5) * 18; // swings 18% vertically
	const breathe = 1 + Math.sin(t / 3) * 0.30; // 30% pulse
	const sunInner = 16 * breathe;
	const sunMid = 32 * breathe;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${sunInner}% ${sunInner * 1.1}% at 50% ${cy}%, rgba(255,240,220,1) 0%, transparent 100%)`,
					`radial-gradient(ellipse ${sunMid}% ${sunMid * 1.2}% at 50% ${cy}%, ${rgba(APRICOT, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 60% 60% at 50% 10%, ${rgba(ROSE, 0.75)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 55% 55% at 50% 95%, ${rgba(CREAM, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 10% 50%, ${rgba(BLUSH, 0.7)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 90% 50%, ${rgba(BLUSH, 0.7)} 0%, transparent 100%)`,
					rgb(ROSE),
				].join(', '),
			}}
		>
			<Hairline x1={0} y1={0.62} x2={1} y2={0.62} color={DUSTGOLD} alpha={0.35} />
			<Hairline x1={0} y1={0.78} x2={1} y2={0.78} color={DUSTGOLD} alpha={0.15} />
			<Vignette intensity={0.22} />
		</AbsoluteFill>
	);
};
