// BG 08 — Golden Mist
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {Vignette, Hairline, fadeIn} from './Shared';
import {rgba, rgb, APRICOT, SOFTGOLD, ROSE, SAND, DUSTGOLD} from './palette';

export const Bg08GoldenMist: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	const breathe = Math.sin(t / 4) * 0.5 + 0.5;
	// Glow expands from 14%→52% at peak
	const inner = 14 + breathe * 16;
	const mid = 36 + breathe * 26;
	// Glow drifts upward then returns
	const cy = 42 - Math.sin(t / 4) * 12;

	const lineAlpha = interpolate(frame, [20, 70], [0, 0.35], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${inner}% ${inner * 1.1}% at 50% ${cy}%, rgba(255,245,225,1) 0%, transparent 100%)`,
					`radial-gradient(ellipse ${mid}% ${mid * 1.2}% at 50% ${cy}%, ${rgba(APRICOT, 0.85)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 50% 50% at 50% 5%, ${rgba(SOFTGOLD, 0.75)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 56% 56% at 50% 95%, ${rgba(ROSE, 0.72)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 56% 56% at 5% 50%, ${rgba(SAND, 0.68)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 56% 56% at 95% 50%, ${rgba(SAND, 0.68)} 0%, transparent 100%)`,
					rgb(ROSE),
				].join(', '),
			}}
		>
			<Hairline x1={0} y1={0.70} x2={1} y2={0.70} color={DUSTGOLD} alpha={lineAlpha} />
			<Vignette intensity={0.28} />
		</AbsoluteFill>
	);
};
