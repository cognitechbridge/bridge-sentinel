import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	const scaleConversion = (
		valueA: number,
		scaleA: [number, number],
		scaleB: [number, number]
	) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (
		style: Record<string, number | string | undefined>
	): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, "");
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export function shortenFilePath(filePath: string, maxLength: number = 45): string {
	if (filePath.length <= maxLength) {
		return filePath;
	}
	const separator = filePath.includes('/') ? '/' : '\\';
	const segments = filePath.split(separator);

	// Handle cases where path length is too short to be meaningfully shortened
	if (segments.length < 3) {
		return filePath.slice(0, maxLength - 3) + separator + '...';
	}

	let start = segments[0];
	let end = segments[segments.length - 1];

	// Include the leading separator for absolute paths
	if (filePath.startsWith(separator)) {
		start = separator + start;
	}

	let middle = '...';

	// Adjust according to the maximum length allowed
	const startMaxLength = Math.ceil((maxLength - middle.length - end.length) / 2);
	const endMaxLength = Math.floor((maxLength - middle.length - start.length) / 2);

	if (start.length > startMaxLength) {
		start = start.slice(0, startMaxLength - 1) + '…';
	}

	if (end.length > endMaxLength) {
		end = '…' + end.slice(-endMaxLength + 1);
	}

	// Reassemble the path using the determined separator
	return start + separator + middle + separator + end;
}

export function isDev() {
	return process.env.NODE_ENV === 'development';
}
