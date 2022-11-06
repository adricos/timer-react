import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
);

export type WorkoutChartProps = {
    segmentsGraph: number[];
};
const WorkoutChart = ({ segmentsGraph }: WorkoutChartProps) => {
    return (
        <>
            {segmentsGraph.length > 0 && (
                <Line
                    options={{
                        plugins: {
                            tooltip: {
                                enabled: false,
                            },
                            legend: {
                                display: false,
                                labels: {
                                    font: {
                                        family: 'Bahnschrift',
                                        size: 20,
                                    },
                                },
                            },
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                display: false,
                            },
                            y: {
                                beginAtZero: true,
                                display: true,
                                grid: {
                                    drawBorder: false,
                                },
                                ticks: {
                                    display: true,
                                    font: {
                                        family: 'Bahnschrift',
                                        size: 20,
                                    },
                                },
                            },
                        },
                    }}
                    data={{
                        labels: segmentsGraph.map(() => ''),
                        datasets: [
                            {
                                data: segmentsGraph,
                                backgroundColor: 'rgba(0, 0, 0, 0)',
                                borderColor: 'rgb(38, 194, 129)',
                                borderWidth: 3,
                                pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                                pointBorderColor: 'rgba(0, 0, 0, 0)',
                            },
                        ],
                    }}
                />
            )}
        </>
    );
};
export default WorkoutChart;
