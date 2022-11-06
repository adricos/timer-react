export type PaceProps = {
    color?: string;
    size?: number;
};

const Pace = ({ color = 'currentcolor', size = 24 }: PaceProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="0"
                y="0"
                rx="20"
                ry="20"
                width="100%"
                height="100%"
                fill={color}
            />
        </svg>
    );
};
export default Pace;
