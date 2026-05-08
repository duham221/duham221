// BG 07 — Floating Atmosphere
// Multi-color orbs drift in slow independent ellipses
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Vignette, Grid, Hairline, fadeIn} from './Shared';
import {rgba, rgb, POWDER, CREAM, PEACH, SAGE, ROSE, SKY, DUSTGOLD, CHARCOAL} from './palette';

export const Bg07Floating: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const t = frame / fps;

	// Each orb drifts in a slow elliptical path with unique period
	const orbs = [
		{cx: 0.20, cy: 0.50, rx: 0.04, ry: 0.06, period: 7, phase: 0, color: PEACH},
		{cx: 0.42, cy: 0.45, rx: 0.05, ry: 0.04, period: 9, phase: 1.5, color: SAGE},
		{cx: 0.60, cy: 0.55, rx: 0.04, ry: 0.05, period: 11, phase: 3.0, color: ROSE},
		{cx: 0.80, cy: 0.50, rx: 0.05, ry: 0.04, period: 8, phase: 4.5, color: SKY},
	];

	const gradients = [
		...orbs.map((o) => {
			const angle = (t / o.period) * Math.PI * 2 + o.phase;
			const x = (o.cx + Math.cos(angle) * o.rx) * 100;
			const y = (o.cy + Math.sin(angle) * o.ry) * 100;
			return `radial-gradient(ellipse 20% 22% at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${rgba(o.color, 0.7)} 0%, transparent 100%)`;
		}),
		`radial-gradient(ellipse 75% 75% at 5% 10%, ${rgba(POWDER, 0.9)} 0%, transparent 100%)`,
		`radial-gradient(ellipse 75% 75% at 95% 95%, ${rgba(CREAM, 0.9)} 0%, transparent 100%)`,
		rgb(CREAM),
	];

	return (
		<AbsoluteFill
			style={{
				opacity: fadeIn(frame),
				background: gradients.join(', '),
			}}
		>
			<Hairline x1={0.10} y1={0.74} x2={0.90} y2={0.74} color={DUSTGOLD} alpha={0.16} />
			<Grid color={CHARCOAL} alpha={0.015} spacing={144} />
			<Vignette intensity={0.14} />
		</AbsoluteFill>
	);
};
