// BG 06 — Topography
// Sage-mist · layered contour curves flow like water
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, SineCurve, fadeIn} from './Shared';
import {rgba, rgb, PEARL, SAGE, CHAMPAGNE, MIST, DUSTGOLD} from './palette';

export const Bg06Topography: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();

	const t = frame / fps;

	const curves = [
		{dy: 0, amp: 70, freq: 0.0011, speed: 0.5, alpha: 0.10},
		{dy: 95, amp: 64, freq: 0.00125, speed: 0.42, alpha: 0.125},
		{dy: 190, amp: 58, freq: 0.0013, speed: 0.36, alpha: 0.15},
		{dy: 285, amp: 52, freq: 0.00115, speed: 0.28, alpha: 0.175},
		{dy: 380, amp: 46, freq: 0.0012, speed: 0.22, alpha: 0.20},
	];

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse 72% 72% at 20% 20%, ${rgba(PEARL, 0.95)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 72% 72% at 80% 80%, ${rgba(SAGE, 0.8)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 34% 34% at 78% 28%, ${rgba(CHAMPAGNE, 0.7)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 30% 70%, ${rgba(MIST, 0.75)} 0%, transparent 100%)`,
					rgb(PEARL),
				].join(', '),
			}}
		>
			{curves.map((c, i) => (
				<SineCurve
					key={i}
					baseY={height * 0.40 + c.dy}
					amplitude={c.amp}
					frequency={c.freq}
					phase={t * c.speed + i * 0.7}
					color={DUSTGOLD}
					alpha={c.alpha}
					strokeWidth={1}
				/>
			))}
			<Vignette intensity={0.16} />
		</AbsoluteFill>
	);
};
