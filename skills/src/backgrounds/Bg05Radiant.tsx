// BG 05 — Radiant Bloom
// Soft central radiance · expanding warm field pulses outward
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, fadeIn} from './Shared';
import {rgba, rgb, APRICOT, ROSE, CREAM, MIST} from './palette';

export const Bg05Radiant: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	const pulse = Math.sin(t / 5) * 0.5 + 0.5; // 5s, 0..1
	const inner = 19 + pulse * 6;
	const mid = 37 + pulse * 10;
	const outer = 64 + pulse * 8;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${inner}% ${inner}% at 50% 50%, rgba(255,235,215,0.95) 0%, transparent 100%)`,
					`radial-gradient(ellipse ${mid}% ${mid}% at 50% 50%, ${rgba(APRICOT, 0.75)} 0%, transparent 100%)`,
					`radial-gradient(ellipse ${outer}% ${outer}% at 50% 50%, ${rgba(ROSE, 0.65)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 90% 90% at 5% 5%, ${rgba(CREAM, 0.9)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 90% 90% at 95% 95%, ${rgba(MIST, 0.9)} 0%, transparent 100%)`,
					rgb(CREAM),
				].join(', '),
			}}
		>
			<Vignette intensity={0.16} />
		</AbsoluteFill>
	);
};
