import { Pace } from './pace';
export class Segment {
    public pace: Pace = Pace.niceSteady;
    public time = 0;
    public startTime = 0;
    public endTime = 0;
    public completed?: boolean;
    public speed?: number;
}
