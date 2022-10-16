import { useRef } from 'react';

const useInterval = (intervalFunc: () => void, milliseconds = 1000) => {
    const interval = useRef<NodeJS.Timeout | undefined>(undefined);
    const start = () => {
        interval.current = setInterval(() => intervalFunc(), milliseconds);
    };

    const stop = () => {
        clearInterval(interval.current);
    };

    return {
        start,
        stop,
    };
};

export default useInterval;
