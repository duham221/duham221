// BG 01 — Pearl Foundation
// Trust as quiet substance · gold orb drifts slowly across warm field
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, Grid, Hairline, fadeIn} from './Shared';
import {rgba, rgb, SOFTGOLD, CHAMPAGNE, PORCELAIN, MIST, PEARL, DUSTGOLD, CHARCOAL} from './palette';

export const Bg01Pearl: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	const drift = Math.sin(t / 6) * 0.04; // 6s x-oscillation
	const breathe = Math.sin(t / 5) * 0.03; // 5s size breathe

	const cx = 62 + drift * 100;
	const s1 = 30 + breathe * 100;
	const s2 = 18 + breathe * 60;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${s2}% ${s2 * 1.1}% at ${cx}% 42%, ${rgba(CHAMPAGNE, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse ${s1}% ${s1 * 1.2}% at ${cx}% 42%, ${rgba(SOFTGOLD, 0.65)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 52% 52% at 30% 85%, ${rgba(PEARL, 0.9)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 72% 72% at 10% 10%, ${rgba(PORCELAIN, 0.95)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 82% 82% at 100% 100%, ${rgba(MIST, 0.9)} 0%, transparent 100%)`,
					rgb(PORCELAIN),
				].join(', '),
			}}
		>
			<Hairline x1={0.08} y1={0.85} x2={0.92} y2={0.85} color={DUSTGOLD} alpha={0.20} />
			<Grid color={CHARCOAL} alpha={0.02} spacing={120} />
			<Vignette intensity={0.12} />
		</AbsoluteFill>
	);
};
