import { Workout } from '../models/workout';
import { Segment } from '../models/segment';
import { Stride, StrideType } from '../models/stride';
import { Pace } from '../models/pace';
import { useRef, useState } from 'react';
import useInterval from './useInterval';

export const sToHms = (d: number) => {
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    const hDisplay = h > 0 ? `${h}:` : '';
    const mDisplay = `${('00' + m).slice(-2)}:`;
    const sDisplay = ('00' + s).slice(-2);
    return hDisplay + mDisplay + sDisplay;
};

const useWorkoutEngine = () => {
    const [segmentElapsedTime, setSegmentElapsedTime] = useState<number>(0);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [segmentsGraph, setSegmentsGraph] = useState<number[]>([]);
    const [duration, setDuration] = useState<number>(0);
    const [status, setStatus] = useState<'running' | 'stopped' | 'paused'>(
        'stopped',
    );
    const timer = useRef<number>(0);
    const currentSegment = useRef<number>(0);
    let stride: Stride = StrideType.Jog;
    const time = sToHms(timer.current);
    const totalTime = sToHms(duration);
    const percentage = 100 - (timer.current * 100) / duration;
    const segmentNumber = currentSegment.current;
    const segmentTime = sToHms(segmentElapsedTime);
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
                setStatus('stopped');
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
        setStatus('stopped');
    };

    const load = (workout: Workout, currentStride: Stride) => {
        const s = workout.segments.slice(0);
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
        if (status === 'running') {
            setStatus('paused');
            stopInterval();
        } else if (status === 'paused') {
            setStatus('running');
            setComplete(currentSegment.current, false);
            updateTimeValue();
            startInterval();
        } else {
            setStatus('running');
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
        status,

        load,
        toggle,
        stop,
    };
};

export default useWorkoutEngine;
