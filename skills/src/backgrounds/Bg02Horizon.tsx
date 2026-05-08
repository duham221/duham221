// BG 02 — Horizon Flow
// Cool/warm split · three sine curves flow downstream
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, SineCurve, fadeIn} from './Shared';
import {rgba, rgb, POWDER, CREAM, CHAMPAGNE, APRICOT, DUSTGOLD} from './palette';

export const Bg02Horizon: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();

	const t = frame / fps;
	// Three curves flow at different speeds for depth
	const phase1 = t * 0.6;
	const phase2 = t * 0.45 + 1.2;
	const phase3 = t * 0.3 + 2.4;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse 72% 72% at 15% 20%, ${rgba(POWDER, 0.9)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 66% 66% at 85% 30%, ${rgba(CREAM, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 60% 60% at 50% 85%, ${rgba(CHAMPAGNE, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 85% 85%, ${rgba(APRICOT, 0.7)} 0%, transparent 100%)`,
					rgb(CREAM),
				].join(', '),
			}}
		>
			<SineCurve
				baseY={height * 0.62}
				amplitude={70}
				frequency={0.0014}
				phase={phase1}
				color={DUSTGOLD}
				alpha={0.22}
				strokeWidth={2}
			/>
			<SineCurve
				baseY={height * 0.68}
				amplitude={55}
				frequency={0.0016}
				phase={phase2}
				color={DUSTGOLD}
				alpha={0.16}
				strokeWidth={2}
			/>
			<SineCurve
				baseY={height * 0.74}
				amplitude={40}
				frequency={0.0012}
				phase={phase3}
				color={DUSTGOLD}
				alpha={0.12}
				strokeWidth={1}
			/>
			<Vignette intensity={0.14} />
		</AbsoluteFill>
	);
};
