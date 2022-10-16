import { Workout } from '../models/workout';
import { Segment } from '../models/segment';
import { Stride, StrideType } from '../models/stride';
import { Pace } from '../models/pace';
import { useRef, useState } from 'react';
import useInterval from './useInterval';

export const circleR = 40;
export const circleDasharray = 2 * Math.PI * circleR;
export const segmentCircleR = 34;
export const segmentCircleDasharray = 2 * Math.PI * segmentCircleR;

export const sToMMSS = (s: number, delim = ':'): string => {
    if (s < 0) {
        s = 0;
    }
    const showWith0 = (value: number) => `${value < 10 ? '0' : ''}${value}`;
    const minutes = showWith0(Math.floor(s / 60));
    const seconds = showWith0(Math.floor(s % 60));
    return `${minutes}${delim}${seconds}`;
};

export const percentageOffset = (percent: number, circle: number): number => {
    return (circle * percent) / 100.0;
};

const useWorkoutEngine = () => {
    const [segmentElapsedTime, setSegmentElapsedTime] = useState<number>(0);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [segmentsGraph, setSegmentsGraph] = useState<number[]>([]);
    const [duration, setDuration] = useState<number>(0);
    const [state, setState] = useState<'start' | 'stop' | 'pause' | 'end'>(
        'stop',
    );
    const timer = useRef<number>(0);
    const currentSegment = useRef<number>(0);
    let stride: Stride = StrideType.Jog;
    const time = sToMMSS(timer.current - 3);
    const totalTime = sToMMSS(duration - 3);
    const percentage = 100 - (timer.current * 100) / duration;
    const segmentNumber = currentSegment.current;
    const segmentTime = sToMMSS(segmentElapsedTime);
    const segmentPercentage =
        segments.length > currentSegment.current
            ? (segmentElapsedTime * 100) / segments[currentSegment.current].time
            : 0;

    const segment =
        segments.length > currentSegment.current
            ? segments[currentSegment.current]
            : new Segment();
    const nextSegment =
        segments.length > currentSegment.current + 1
            ? segments[currentSegment.current + 1]
            : new Segment();

    const clearComplete = () =>
        setSegments((ss) => ss.map((s) => ({ ...s, completed: undefined })));

    const setComplete = (seg: number, completed: boolean) =>
        setSegments((ss) =>
            ss.map((s, i) => ({
                ...s,
                completed: i === seg ? completed : s.completed,
            })),
        );

    const updateTimeValue = (): void => {
        const current = segments[currentSegment.current];
        setSegmentElapsedTime(current.endTime - timer.current);
        timer.current += 1;
        if (timer.current > current.endTime) {
            setComplete(currentSegment.current, true);
            currentSegment.current += 1;
            if (currentSegment.current === segments.length) {
                setState('end');
                stopInterval();
            } else {
                setComplete(currentSegment.current, false);
            }
        }
    };
    const { start: startInterval, stop: stopInterval } =
        useInterval(updateTimeValue);

    const stop = () => {
        timer.current = 0;
        currentSegment.current = 0;
        clearComplete();
        stopInterval();
        setSegmentElapsedTime(0);
        setState('stop');
    };

    const load = (workout: Workout, currentStride: Stride) => {
        const s = workout.segments.slice(0);
        s.splice(0, 0, {
            pace: Pace.start,
            time: 3,
            speed: 0,
            startTime: 0,
            endTime: 3,
        });
        stride = currentStride;
        setDuration(updateSegmentInteval(s));
        setSegments(s);
        stop();
    };

    const getSpeed = (pace: Pace): number => {
        return stride && stride.values ? stride.values[pace] : 0;
    };

    const updateSegmentInteval = (segments: Segment[]): number => {
        let elapsedTime = 0;
        const sg: number[] = [];
        segments.forEach((s) => {
            s.startTime = elapsedTime + 1;
            elapsedTime += s.time;
            s.endTime = elapsedTime;
            s.speed = getSpeed(s.pace);
            const speedTime = Math.round((s.endTime - s.startTime) / 30) + 1;
            for (let step = 0; step < speedTime; step++) {
                sg.push(s.speed);
            }
        });
        setSegmentsGraph(sg);
        return elapsedTime;
    };

    const toggle = () => {
        if (state === 'start') {
            setState('pause');
            stopInterval();
        } else if (state === 'pause') {
            setState('start');
            setComplete(currentSegment.current, false);
            updateTimeValue();
            startInterval();
        } else {
            setState('start');
            timer.current = 0;
            currentSegment.current = 0;
            clearComplete();
            setComplete(0, false);
            updateTimeValue();
            startInterval();
        }
    };

    return {
        time,
        percentage,
        segmentNumber,
        segmentTime,
        segmentPercentage,
        segment,
        nextSegment,
        segments,
        totalTime,
        segmentsGraph,
        segmentElapsedTime,
        state,

        load,
        toggle,
        stop,
    };
};

export default useWorkoutEngine;
