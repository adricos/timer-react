import { Engine } from 'hooks/useWorkoutEngine';
import './WorkoutStatus.css';

export type WorkoutStatusProps = {
    engine: Engine;
};

const WorkoutStatus = ({ engine }: WorkoutStatusProps) => {
    const circleR = 40;
    const circleDasharray = 2 * Math.PI * circleR;
    const segmentCircleR = 34;
    const segmentCircleDasharray = 2 * Math.PI * segmentCircleR;

    const getCircleClass = (value: number) => {
        return `elapsed-${value < 6 && value > 0 ? value.toString() : 'any'}`;
    };

    const percentageOffset = (percent: number, circle: number): number => {
        return (circle * percent) / 100.0;
    };

    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                cx="50%"
                cy="50%"
                strokeWidth="12"
                r={(circleR + segmentCircleR) / 2}
                className={getCircleClass(engine.segmentElapsedTime)}
            />
            <circle
                className="timer-circle timer-circle-general"
                r={circleR}
                strokeDasharray={circleDasharray}
                strokeDashoffset={percentageOffset(
                    engine.percentage,
                    circleDasharray,
                )}
            />
            <circle
                className="timer-circle timer-circle-segment"
                r={segmentCircleR}
                strokeDasharray={segmentCircleDasharray}
                strokeDashoffset={percentageOffset(
                    engine.segmentPercentage,
                    segmentCircleDasharray,
                )}
            />
            <text x="3%" y="9%" className="timer-subtext">
                {`${engine.segmentNumber + 1} / ${engine.segments.length}`}
            </text>
            <text x="77%" y="9%" className="timer-subtext">
                {engine.totalTime}
            </text>
            <text x="40%" y="30%" className="timer-subtext">
                {engine.time}
            </text>
            <text x="50%" y="50%" className="timer-text">
                {engine.segmentTime}
            </text>
            <text x="50%" y="68%" className="timer-text">
                {(engine.segment.speed ?? 0).toFixed(1)}
            </text>
            <text x="44%" y="78%" className="timer-subtext">
                {(engine.nextSegment.speed ?? 0).toFixed(1)}
            </text>
            <text x="77%" y="98%" className="timer-subtext">
                {/* {time} */}
            </text>
        </svg>
    );
};
export default WorkoutStatus;
