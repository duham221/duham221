// BG 05 — Radiant Bloom
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, fadeIn} from './Shared';
import {rgba, rgb, APRICOT, ROSE, CREAM, MIST} from './palette';

export const Bg05Radiant: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = (frame / fps) * Math.PI * 2;
	// Hard inhale/exhale — min 12%, max 52%
	const pulse = Math.sin(t / 5) * 0.5 + 0.5;
	const inner = 12 + pulse * 20;
	const mid = 28 + pulse * 28;
	const outer = 52 + pulse * 24;

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: [
					`radial-gradient(ellipse ${inner}% ${inner}% at 50% 50%, rgba(255,235,215,1) 0%, transparent 100%)`,
					`radial-gradient(ellipse ${mid}% ${mid}% at 50% 50%, ${rgba(APRICOT, 0.80)} 0%, transparent 100%)`,
					`radial-gradient(ellipse ${outer}% ${outer}% at 50% 50%, ${rgba(ROSE, 0.65)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 90% 90% at 5% 5%, ${rgba(CREAM, 0.9)} 0%, transparent 100%)`,
					`radial-gradient(ellipse 90% 90% at 95% 95%, ${rgba(MIST, 0.9)} 0%, transparent 100%)`,
					rgb(CREAM),
				].join(', '),
			}}
		>
			<Vignette intensity={0.20} />
		</AbsoluteFill>
	);
};
