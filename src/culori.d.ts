declare module 'culori' {
    export interface OklchColor {
        c: number;
        h: number;
        l?: number;
        alpha?: number;
        mode?: 'oklch';
    }

    export interface RgbColor {
        r: number;
        g: number;
        b: number;
        alpha?: number;
        mode?: 'rgb';
    }

    export function converter(mode: 'oklch'): (value: string) => OklchColor | undefined;
    export function converter(mode: 'rgb'): (value: string) => RgbColor | undefined;
}
