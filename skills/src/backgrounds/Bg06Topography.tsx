// BG 06 — Topography
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, SineCurve, fadeIn} from './Shared';
import {rgba, rgb, PEARL, SAGE, CHAMPAGNE, MIST, DUSTGOLD} from './palette';

export const Bg06Topography: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, height} = useVideoConfig();

	const t = frame / fps;

	const curves = [
		{dy: 0,   amp: 100, freq: 0.0013, speed: 0.9,  alpha: 0.30},
		{dy: 90,  amp: 88,  freq: 0.0015, speed: 0.72, alpha: 0.38},
		{dy: 180, amp: 76,  freq: 0.0014, speed: 0.56, alpha: 0.46},
		{dy: 270, amp: 64,  freq: 0.0012, speed: 0.42, alpha: 0.52},
		{dy: 360, amp: 52,  freq: 0.0013, speed: 0.30, alpha: 0.58},
	];

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse 72% 72% at 20% 20%, ${rgba(PEARL, 0.95)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 72% 72% at 80% 80%, ${rgba(SAGE, 0.80)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 34% 34% at 78% 28%, ${rgba(CHAMPAGNE, 0.70)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 30% 70%, ${rgba(MIST, 0.75)} 0%, transparent 100%)`,
					rgb(PEARL),
				].join(', '),
			}}
		>
			{curves.map((c, i) => (
				<SineCurve
					key={i}
					baseY={height * 0.35 + c.dy}
					amplitude={c.amp}
					frequency={c.freq}
					phase={t * c.speed + i * 0.8}
					color={DUSTGOLD}
					alpha={c.alpha}
					strokeWidth={i === 0 ? 2 : 1}
				/>
			))}
			<Vignette intensity={0.18} />
		</AbsoluteFill>
	);
};
