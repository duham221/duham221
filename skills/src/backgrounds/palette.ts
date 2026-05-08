export type Color = [number, number, number];
export const rgb = (c: Color) => `rgb(${c[0]},${c[1]},${c[2]})`;
export const rgba = (c: Color, a: number) =>
	`rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

export const PEARL: Color = [248, 246, 241];
export const PORCELAIN: Color = [252, 250, 246];
export const CREAM: Color = [245, 239, 231];
export const SAND: Color = [232, 220, 196];
export const ROSE: Color = [232, 213, 208];
export const BLUSH: Color = [240, 220, 218];
export const SAGE: Color = [200, 213, 192];
export const POWDER: Color = [213, 224, 232];
export const SKY: Color = [220, 232, 240];
export const MIST: Color = [220, 215, 205];
export const PEACH: Color = [245, 222, 200];
export const APRICOT: Color = [250, 215, 188];
export const CHARCOAL: Color = [42, 42, 48];
export const DUSTGOLD: Color = [180, 155, 105];
export const SOFTGOLD: Color = [220, 195, 145];
export const CHAMPAGNE: Color = [235, 220, 190];
