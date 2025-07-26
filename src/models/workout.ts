import { Segment } from './segment';
export type Workout = {
    name: string;
    segments: Segment[];
    path: string;
};

export interface WorkoutNode {
    name: string;
    path?: string;
    children?: WorkoutNode[];
    workout?: Workout;
}
