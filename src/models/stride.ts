import { Pace } from './pace';
export class Stride {
    public values: number[] = [0, 0, 0, 0, 0, 0];
    constructor(
        warmUp: number,
        niceSteady: number,
        pickItUp: number,
        toTheMax: number,
        walkItOut: number,
        coolDown: number,
    ) {
        this.values[Pace.warmUp] = warmUp;
        this.values[Pace.niceSteady] = niceSteady;
        this.values[Pace.pickItUp] = pickItUp;
        this.values[Pace.toTheMax] = toTheMax;
        this.values[Pace.walkItOut] = walkItOut;
        this.values[Pace.coolDown] = coolDown;
    }
}

export enum StrideType {
    Walk,
    Jog,
    Run,
}

export const Strides = [
    new Stride(2.5, 3.0, 3.5, 4.0, 2.5, 2.5),
    new Stride(3.5, 5.0, 6.5, 7.5, 3.5, 3.5),
    new Stride(3.5, 5.0, 7.5, 9, 3.5, 3.5),
];
