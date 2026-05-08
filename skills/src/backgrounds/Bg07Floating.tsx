// BG 07 — Floating Atmosphere
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, Grid, Hairline, fadeIn} from './Shared';
import {rgba, rgb, POWDER, CREAM, PEACH, SAGE, ROSE, SKY, DUSTGOLD, CHARCOAL} from './palette';

export const Bg07Floating: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = frame / fps;

	const orbs = [
		{cx: 0.22, cy: 0.50, rx: 0.14, ry: 0.18, period: 7,  phase: 0,   color: PEACH, size: 22},
		{cx: 0.42, cy: 0.45, rx: 0.18, ry: 0.12, period: 9,  phase: 1.5, color: SAGE,  size: 20},
		{cx: 0.60, cy: 0.55, rx: 0.14, ry: 0.16, period: 11, phase: 3.0, color: ROSE,  size: 22},
		{cx: 0.80, cy: 0.50, rx: 0.16, ry: 0.12, period: 8,  phase: 4.5, color: SKY,   size: 24},
	];

	const gradients = [
		...orbs.map((o) => {
			const angle = (t / o.period) * Math.PI * 2 + o.phase;
			const x = (o.cx + Math.cos(angle) * o.rx) * 100;
			const y = (o.cy + Math.sin(angle) * o.ry) * 100;
			return `radial-gradient(ellipse ${o.size}% ${o.size * 1.1}% at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${rgba(o.color, 0.85)} 0%, transparent 100%)`;
		}),
		`radial-gradient(ellipse 75% 75% at 5% 10%, ${rgba(POWDER, 0.9)} 0%, transparent 100%)`,
		`radial-gradient(ellipse 75% 75% at 95% 95%, ${rgba(CREAM, 0.9)} 0%, transparent 100%)`,
		rgb(CREAM),
	];

	return (
		<AbsoluteFill style={{opacity: fadeIn(frame), background: gradients.join(', ')}}>
			<Hairline x1={0.10} y1={0.74} x2={0.90} y2={0.74} color={DUSTGOLD} alpha={0.25} />
			<Grid color={CHARCOAL} alpha={0.022} spacing={144} />
			<Vignette intensity={0.18} />
		</AbsoluteFill>
	);
};
