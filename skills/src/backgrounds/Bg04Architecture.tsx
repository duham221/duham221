// BG 04 — Architecture of Calm
// Paper-soft · vertical light columns breathe · grid fades in
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {Vignette, Grid, Hairline, fadeIn} from './Shared';
import {rgba, rgb, PORCELAIN, MIST, CHAMPAGNE, SOFTGOLD, CHARCOAL, DUSTGOLD} from './palette';

export const Bg04Architecture: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	const breathe = Math.sin(t / 5) * 0.5 + 0.5; // 5s period, 0..1
	const bandAlpha = 0.08 + breathe * 0.07;

	const gridOpacity = interpolate(frame, [30, 90], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});

	const champSize = 40 + breathe * 8;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					// Vertical light bands (tall narrow ellipses)
					`radial-gradient(ellipse 3% 58% at 30% 50%, ${rgba(SOFTGOLD, bandAlpha)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 4% 58% at 42% 50%, ${rgba(SOFTGOLD, bandAlpha)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 2% 58% at 50% 50%, ${rgba(SOFTGOLD, bandAlpha)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 4% 58% at 58% 50%, ${rgba(SOFTGOLD, bandAlpha)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 3% 58% at 70% 50%, ${rgba(SOFTGOLD, bandAlpha)} 0%, transparent 100%)`,
					// Base mesh
					`radial-gradient(ellipse ${champSize}% ${champSize * 0.8}% at 50% 40%, ${rgba(CHAMPAGNE, 0.6)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 95% 95% at 0% 0%, ${rgba(PORCELAIN, 0.98)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 95% 95% at 100% 100%, ${rgba(MIST, 0.9)} 0%, transparent 100%)`,
					rgb(PORCELAIN),
				].join(', '),
			}}
		>
			<Hairline x1={0.10} y1={0.86} x2={0.90} y2={0.86} color={CHARCOAL} alpha={0.16} />
			<Grid color={CHARCOAL} alpha={0.018} spacing={144} opacity={gridOpacity} />
			<Vignette intensity={0.15} />
		</AbsoluteFill>
	);
};
