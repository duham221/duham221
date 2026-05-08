import React from 'react';
import {useVideoConfig} from 'remotion';
import {type Color, rgba} from './palette';

export const Vignette: React.FC<{intensity?: number}> = ({intensity = 0.15}) => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${intensity}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

export const Grid: React.FC<{
	color: Color;
	alpha?: number;
	spacing?: number;
	opacity?: number;
}> = ({color, alpha = 0.025, spacing = 120, opacity = 1}) => {
	const {width, height} = useVideoConfig();
	const vLines: React.ReactNode[] = [];
	const hLines: React.ReactNode[] = [];
	for (let x = 0; x <= width; x += spacing) {
		vLines.push(<line key={x} x1={x} y1={0} x2={x} y2={height} />);
	}
	for (let y = 0; y <= height; y += spacing) {
		hLines.push(<line key={y} x1={0} y1={y} x2={width} y2={y} />);
	}
	return (
		<svg
			style={{
				position: 'absolute',
				inset: 0,
				pointerEvents: 'none',
				opacity,
			}}
			width={width}
			height={height}
		>
			<g stroke={rgba(color, alpha)} strokeWidth={1} fill="none">
				{vLines}
				{hLines}
			</g>
		</svg>
	);
};

// x1, y1, x2, y2 are fractions [0..1] of canvas dimensions
export const Hairline: React.FC<{
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	color: Color;
	alpha?: number;
	strokeWidth?: number;
}> = ({x1, y1, x2, y2, color, alpha = 0.18, strokeWidth = 1}) => {
	const {width, height} = useVideoConfig();
	return (
		<svg
			style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
			width={width}
			height={height}
		>
			<line
				x1={x1 * width}
				y1={y1 * height}
				x2={x2 * width}
				y2={y2 * height}
				stroke={rgba(color, alpha)}
				strokeWidth={strokeWidth}
			/>
		</svg>
	);
};

// baseY in pixels; frequency in radians/pixel; phase in radians
export const SineCurve: React.FC<{
	baseY: number;
	amplitude: number;
	frequency: number;
	phase: number;
	color: Color;
	alpha?: number;
	strokeWidth?: number;
}> = ({baseY, amplitude, frequency, phase, color, alpha = 0.18, strokeWidth = 1}) => {
	const {width, height} = useVideoConfig();
	const pts: string[] = [];
	for (let x = 0; x <= width; x += 4) {
		const y =
			baseY +
			amplitude * Math.sin(x * frequency + phase) +
			amplitude * 0.4 * Math.sin(x * frequency * 1.7 + phase * 1.2);
		pts.push(`${x},${Math.round(y)}`);
	}
	return (
		<svg
			style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
			width={width}
			height={height}
		>
			<polyline
				points={pts.join(' ')}
				fill="none"
				stroke={rgba(color, alpha)}
				strokeWidth={strokeWidth}
			/>
		</svg>
	);
};

export const fadeIn = (frame: number, durationFrames = 20) =>
	Math.min(1, frame / durationFrames);
