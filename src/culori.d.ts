declare module 'culori' {
    export interface OklchColor {
        c: number;
        h: number;
        l?: number;
        alpha?: number;
        mode?: 'oklch';
    }

    export function converter(mode: 'oklch'): (value: string) => OklchColor | undefined;
}
