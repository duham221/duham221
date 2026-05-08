import {Composition, Folder} from 'remotion';
import {MyAnimation as BarChartAnimation} from '../skills/remotion/rules/assets/charts-bar-chart';
import {MyAnimation as TypewriterAnimation} from '../skills/remotion/rules/assets/text-animations-typewriter';
import {MyAnimation as WordHighlightAnimation} from '../skills/remotion/rules/assets/text-animations-word-highlight';
import {Bg01Pearl} from './backgrounds/Bg01Pearl';
import {Bg02Horizon} from './backgrounds/Bg02Horizon';
import {Bg03Dawn} from './backgrounds/Bg03Dawn';
import {Bg04Architecture} from './backgrounds/Bg04Architecture';
import {Bg05Radiant} from './backgrounds/Bg05Radiant';
import {Bg06Topography} from './backgrounds/Bg06Topography';
import {Bg07Floating} from './backgrounds/Bg07Floating';
import {Bg08GoldenMist} from './backgrounds/Bg08GoldenMist';

const W = 1920;
const H = 1080;
const FPS = 30;

export const RemotionRoot = () => {
	return (
		<>
			<Folder name="SoftBackgrounds">
				<Composition
					id="Bg01-Pearl-Foundation"
					component={Bg01Pearl}
					durationInFrames={180}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg02-Horizon-Flow"
					component={Bg02Horizon}
					durationInFrames={240}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg03-Dawn-Memory"
					component={Bg03Dawn}
					durationInFrames={150}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg04-Architecture-of-Calm"
					component={Bg04Architecture}
					durationInFrames={180}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg05-Radiant-Bloom"
					component={Bg05Radiant}
					durationInFrames={150}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg06-Topography"
					component={Bg06Topography}
					durationInFrames={240}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg07-Floating-Atmosphere"
					component={Bg07Floating}
					durationInFrames={210}
					fps={FPS}
					width={W}
					height={H}
				/>
				<Composition
					id="Bg08-Golden-Mist"
					component={Bg08GoldenMist}
					durationInFrames={180}
					fps={FPS}
					width={W}
					height={H}
				/>
			</Folder>
			<Composition
				id="BarChart"
				component={BarChartAnimation}
				durationInFrames={120}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="Typewriter"
				component={TypewriterAnimation}
				durationInFrames={180}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					fullText: 'From prompt to motion graphics. This is Remotion.',
					pauseAfter: 'From prompt to motion graphics.',
				}}
			/>
			<Composition
				id="WordHighlight"
				component={WordHighlightAnimation}
				durationInFrames={90}
				fps={30}
				width={1080}
				height={1080}
			/>
		</>
	);
};
