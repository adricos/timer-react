import {
    IonButton,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonTitle,
    IonToolbar,
} from '@ionic/react';
import {
    sync as syncIcon,
    sunny,
    moon,
    statsChart,
    stopwatch,
    arrowForward,
    pause,
    play,
    square,
} from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import { NativeAudio } from '@capacitor-community/native-audio';
import { Http } from '@capacitor-community/http';
import { PaceName } from 'models/pace';

import './Home.css';
import { GitFile } from 'models/gitFile';
import { Workout } from 'models/workout';
import { StrideType } from 'models/stride';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Line } from 'react-chartjs-2';
import useWorkoutEngine, {
    circleDasharray,
    circleR,
    percentageOffset,
    segmentCircleDasharray,
    segmentCircleR,
    sToMMSS,
} from 'hooks/useWorkoutEngine';

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
import useInterval from 'hooks/useInterval';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
);

const Home: React.FC = () => {
    const engine = useWorkoutEngine();
    const [workoutsArray, setWorkoutsArray] = useState<Workout[]>([]);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [circleColor, setCircleColor] = useState<string>();
    const [time, setTime] = useState<string>();
    const content = useRef<HTMLIonContentElement>(null);
    const scroll = useRef<VirtuosoHandle>(null);

    const repo = 'https://api.github.com/repos/adricos/workouts/contents/files';

    const updateTime = () => {
        const currentTime = Date.now();
        const GMT = -new Date().getTimezoneOffset() / 60;
        const totalSeconds = Math.floor(currentTime / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const minutes = ('0' + (totalMinutes % 60)).slice(-2);
        const totalHours = Math.floor(totalMinutes / 60);
        const hours = ('0' + ((totalHours + GMT) % 24)).slice(-2);
        setTime(hours + ':' + minutes);
    };

    const { start, stop } = useInterval(updateTime);

    useEffect(() => {
        Preferences.get({ key: 'workouts' })
            .then((val) => setWorkoutsArray(JSON.parse(val.value ?? '{}')))
            .catch(() => sync())
            .finally(() => start());
        return () => {
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const s = engine.segmentElapsedTime;
        setCircleColor(getCircleClass(s));
        if (s < 6 && s > 0) {
            NativeAudio.play({ assetId: s.toString(), time: 0 });
        }
    }, [engine.segmentElapsedTime]);

    useEffect(() => {
        scrollTo(engine.segmentNumber);
    }, [engine.segmentNumber]);

    const toggleDarkMode = () => document.body.classList.toggle('dark');

    const isDarkMode = () => document.body.classList.contains('dark');

    const scrollTo = (item: number): void => {
        if (scroll && scroll.current) {
            scroll.current.scrollToIndex(item);
        }
    };

    const sync = () => {
        setIsSyncing(true);

        Http.get({
            url: repo,
        }).then((data) => {
            const files = data.data as GitFile[];
            const arr = files.map((f) => Http.get({ url: f.download_url }));
            Promise.all(arr)
                .then((results) => {
                    setWorkoutsArray((w) => {
                        const newWorkoutsArray = results
                            .map((r) => JSON.parse(r.data) as Workout)
                            .sort(function (a, b) {
                                const nameA = a.name.toUpperCase();
                                const nameB = b.name.toUpperCase();
                                if (nameA < nameB) {
                                    return -1;
                                }
                                if (nameA > nameB) {
                                    return 1;
                                }
                                return 0;
                            });
                        if (newWorkoutsArray.length > 0) {
                            Preferences.set({
                                key: 'workouts',
                                value: JSON.stringify(newWorkoutsArray),
                            });
                        }
                        return newWorkoutsArray;
                    });
                })
                .finally(() => {
                    setIsSyncing(false);
                });
        });
    };

    const getCircleClass = (value: number) => {
        if (value < 6 && value > 0) {
            return 'elapsed-' + value.toString();
        }
        return 'elapsed-any';
    };

    const loadWorkout = (event: any) => {
        engine.load(workoutsArray[event.detail.value], StrideType.Jog);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonSelect
                        placeholder="Select Workout"
                        interface="popover"
                        onIonChange={loadWorkout}
                        disabled={
                            workoutsArray.length <= 0 ||
                            (engine.state !== 'end' && engine.state !== 'stop')
                        }
                    >
                        {workoutsArray.map((item, i) => (
                            <IonSelectOption key={item.name} value={i}>
                                {item.name}
                            </IonSelectOption>
                        ))}
                    </IonSelect>

                    <IonButton
                        slot="primary"
                        onClick={() => sync()}
                        disabled={
                            isSyncing ||
                            (engine.state !== 'end' && engine.state !== 'stop')
                        }
                    >
                        {isSyncing && <IonSpinner name="lines-small" />}
                        {!isSyncing && (
                            <IonIcon slot="icon-only" icon={syncIcon} />
                        )}
                    </IonButton>
                    <IonButton slot="primary" onClick={() => toggleDarkMode()}>
                        <IonIcon
                            slot="icon-only"
                            icon={isDarkMode() ? sunny : moon}
                        />
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            {['start', 'pause'].includes(engine.state) && (
                <svg
                    width="100vw"
                    height="64vh"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        cx="50%"
                        cy="50%"
                        strokeWidth="12"
                        r={(circleR + segmentCircleR) / 2}
                        className={circleColor}
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
                        {engine.segmentNumber} / {engine.segments.length - 1}
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
                        {time}
                    </text>
                </svg>
            )}
            {engine.segments.length > 0 &&
                !['start', 'pause'].includes(engine.state) && (
                    <Line
                        options={{
                            plugins: {
                                tooltip: {
                                    enabled: false,
                                },
                                legend: {
                                    display: false,
                                },
                            },
                            scales: {
                                x: {
                                    display: false,
                                },
                                y: {
                                    display: true,
                                    grid: {
                                        drawBorder: false,
                                    },
                                    ticks: {
                                        display: false,
                                    },
                                },
                            },
                        }}
                        data={{
                            labels: engine.segmentsGraph.map(() => ''),
                            datasets: [
                                {
                                    data: engine.segmentsGraph,
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
            <IonItem
                hidden={
                    engine.segments.length <= 0 ||
                    ['start', 'pause'].includes(engine.state)
                }
            >
                <IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div>
                            <IonIcon icon={statsChart} />
                        </div>
                        <div>{` ${engine.segments.length - 1} - `}</div>
                        <div>
                            <IonIcon icon={stopwatch} />
                        </div>
                        <div>{engine.totalTime}</div>
                    </div>
                </IonLabel>
            </IonItem>
            <IonContent ref={content} scrollY={false}>
                <Virtuoso
                    className="ion-content-scroll-host"
                    ref={scroll}
                    style={{ height: '100%' }}
                    totalCount={engine.segments.length}
                    itemContent={(index) => {
                        return (
                            <IonItem
                                {...(engine.segments[index].completed ===
                                undefined
                                    ? {}
                                    : {
                                          color: engine.segments[index]
                                              .completed
                                              ? 'success'
                                              : 'primary',
                                      })}
                                className="segment"
                            >
                                <IonLabel>
                                    {sToMMSS(engine.segments[index].time)}
                                </IonLabel>
                                <IonLabel>
                                    <h1>
                                        {`${(
                                            engine.segments[index].speed ?? 0
                                        ).toFixed(1)} mph`}
                                    </h1>
                                </IonLabel>
                                <IonIcon
                                    slot="end"
                                    icon={PaceName[engine.segments[index].pace]}
                                />
                            </IonItem>
                        );
                    }}
                />
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    {engine.state !== 'stop' &&
                        engine.state !== 'end' &&
                        engine.nextSegment.time > 0 && (
                            <IonTitle>
                                <IonIcon icon={PaceName[engine.segment.pace]} />
                                <IonIcon icon={arrowForward} />
                                <IonIcon
                                    icon={PaceName[engine.nextSegment.pace]}
                                />
                            </IonTitle>
                        )}
                    <IonButton
                        disabled={engine.segments.length <= 0}
                        size="large"
                        slot="primary"
                        expand="block"
                        color="primary"
                        onClick={engine.toggle}
                    >
                        <IonIcon
                            slot="icon-only"
                            icon={
                                ['pause', 'end', 'stop'].includes(engine.state)
                                    ? play
                                    : pause
                            }
                        />
                    </IonButton>
                    {engine.state !== 'stop' && engine.state !== 'end' && (
                        <IonButton
                            size="large"
                            slot="secondary"
                            expand="block"
                            color="primary"
                            onClick={engine.stop}
                        >
                            <IonIcon slot="icon-only" icon={square} />
                        </IonButton>
                    )}
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default Home;
