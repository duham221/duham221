// BG 08 — Golden Mist
// Cinematic warm finale · glow breathes · horizon line fades in
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {Vignette, Hairline, fadeIn} from './Shared';
import {rgba, rgb, APRICOT, SOFTGOLD, ROSE, SAND, DUSTGOLD} from './palette';

export const Bg08GoldenMist: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	const breathe = Math.sin(t / 4) * 0.5 + 0.5; // 4s period, 0..1
	const inner = 17 + breathe * 5;
	const mid = 41 + breathe * 10;

	const lineAlpha = interpolate(frame, [20, 70], [0, 0.22], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${inner}% ${inner * 1.1}% at 50% 42%, rgba(255,240,220,0.95) 0%, transparent 100%)`,
					`radial-gradient(ellipse ${mid}% ${mid * 1.1}% at 50% 42%, ${rgba(APRICOT, 0.8)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 48% 48% at 50% 5%, ${rgba(SOFTGOLD, 0.7)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 54% 54% at 50% 95%, ${rgba(ROSE, 0.7)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 54% 54% at 5% 50%, ${rgba(SAND, 0.65)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 54% 54% at 95% 50%, ${rgba(SAND, 0.65)} 0%, transparent 100%)`,
					rgb(ROSE),
				].join(', '),
			}}
		>
			<Hairline x1={0} y1={0.70} x2={1} y2={0.70} color={DUSTGOLD} alpha={lineAlpha} />
			<Vignette intensity={0.22} />
		</AbsoluteFill>
	);
};
