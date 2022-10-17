import { useState, useEffect, useRef } from 'react';
import {
    IonButton,
    IonButtons,
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
    removeOutline,
} from 'ionicons/icons';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useQuery } from 'react-query';
import { Preferences } from '@capacitor/preferences';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { useGetLanguageCode } from '@capacitor-community/device-react';
import { Http } from '@capacitor-community/http';
import { PaceName } from 'models/pace';
import { GitFile } from 'models/gitFile';
import { Workout } from 'models/workout';
import { StrideType } from 'models/stride';

import useWorkoutEngine, { sToMMSS } from 'hooks/useWorkoutEngine';
import useInterval from 'hooks/useInterval';
import useWindowDimensions from 'hooks/useWindowsDimension';
import WorkoutStatus from 'components/WorkoutStatus/WorkoutStatus';
import WorkoutChart from 'components/WorkoutChart/WorkoutChart';

import './Home.css';

const Home: React.FC = () => {
    const engine = useWorkoutEngine();
    const { height, width } = useWindowDimensions();
    const { languageCode } = useGetLanguageCode();

    const [workoutsArray, setWorkoutsArray] = useState<Workout[]>([]);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [time, setTime] = useState<string>();
    const scroll = useRef<VirtuosoHandle>(null);
    const { data: languages } = useQuery(['getSupportedVoices'], () =>
        TextToSpeech.getSupportedLanguages().then((result) => result.languages),
    );

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
            .then((val) => {
                if (val.value === null) {
                    sync();
                } else {
                    setWorkoutsArray(JSON.parse(val.value ?? '{}'));
                }
            })
            .catch(() => sync())
            .finally(() => start());
        return () => {
            stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const s = engine.segmentElapsedTime;
        if (s < 6 && s > 0) {
            TextToSpeech.speak({
                text: s.toString(),
                rate: 1.3,
                lang:
                    languages?.find((l) =>
                        l.startsWith(languageCode ?? 'en'),
                    ) ?? 'en-US',
            });
        }
    }, [engine.segmentElapsedTime, languageCode, languages]);

    useEffect(() => {
        scrollTo(engine.segmentNumber);
    }, [engine.segmentNumber]);

    const scrollTo = (item: number): void => {
        if (scroll && scroll.current) {
            scroll.current.scrollToIndex(item);
        }
    };

    const toggleDarkMode = () => document.body.classList.toggle('dark');
    const isDarkMode = () => document.body.classList.contains('dark');

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

    const loadWorkout = (event: any) => {
        engine.load(workoutsArray[event.detail.value], StrideType.Jog);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>
                        <IonSelect
                            placeholder="Select Workout"
                            interface="popover"
                            onIonChange={loadWorkout}
                            disabled={
                                workoutsArray.length <= 0 ||
                                !['end', 'stop'].includes(engine.status)
                            }
                        >
                            {workoutsArray.map((item, i) => (
                                <IonSelectOption key={item.name} value={i}>
                                    {item.name}
                                </IonSelectOption>
                            ))}
                        </IonSelect>
                    </IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            size="large"
                            color="primary"
                            fill="solid"
                            onClick={sync}
                            disabled={
                                isSyncing ||
                                !['end', 'stop'].includes(engine.status)
                            }
                        >
                            {isSyncing && <IonSpinner name="lines-small" />}
                            {!isSyncing && (
                                <IonIcon slot="icon-only" icon={syncIcon} />
                            )}
                        </IonButton>
                        <IonButton
                            size="large"
                            color="primary"
                            fill="solid"
                            onClick={toggleDarkMode}
                        >
                            <IonIcon
                                slot="icon-only"
                                icon={isDarkMode() ? sunny : moon}
                            />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <div
                    style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: width > height ? 'row' : 'column',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: width > height ? '100%' : '60%',
                        }}
                    >
                        {['start', 'pause'].includes(engine.status) ? (
                            <WorkoutStatus engine={engine} time={time} />
                        ) : engine.segments.length > 0 ? (
                            <WorkoutChart
                                segmentsGraph={engine.segmentsGraph}
                            />
                        ) : (
                            ''
                        )}
                    </div>
                    <div
                        style={{
                            width: '100%',
                            height: width > height ? '100%' : '40%',
                        }}
                    >
                        <Virtuoso
                            className="ion-content-scroll-host"
                            ref={scroll}
                            totalCount={engine.segments.length}
                            itemContent={(index) => {
                                return (
                                    <IonItem
                                        {...(engine.segments[index]
                                            .completed === undefined
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
                                            {sToMMSS(
                                                engine.segments[index].time,
                                            )}
                                        </IonLabel>
                                        <IonLabel>
                                            <h1>
                                                {`${(
                                                    engine.segments[index]
                                                        .speed ?? 0
                                                ).toFixed(1)} mph`}
                                            </h1>
                                        </IonLabel>
                                        <IonIcon
                                            slot="end"
                                            icon={
                                                PaceName[
                                                    engine.segments[index].pace
                                                ]
                                            }
                                        />
                                    </IonItem>
                                );
                            }}
                        />
                    </div>
                </div>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <IonTitle>
                        {['start', 'pause'].includes(engine.status) ? (
                            <>
                                <IonIcon icon={PaceName[engine.segment.pace]} />
                                <IonIcon icon={arrowForward} />
                                <IonIcon
                                    icon={PaceName[engine.nextSegment.pace]}
                                />
                            </>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <div>
                                        <IonIcon icon={statsChart} />
                                    </div>
                                    <div>{`${
                                        engine.segments.length - 1 < 0
                                            ? 0
                                            : engine.segments.length - 1
                                    }`}</div>
                                </div>
                                <div>
                                    <IonIcon icon={removeOutline} />
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}
                                >
                                    <IonIcon icon={stopwatch} />
                                    <div>{engine.totalTime}</div>
                                </div>
                            </div>
                        )}
                    </IonTitle>
                    <IonButtons slot="end">
                        {!['end', 'stop'].includes(engine.status) && (
                            <IonButton
                                size="large"
                                color="primary"
                                fill="solid"
                                onClick={engine.stop}
                            >
                                <IonIcon slot="icon-only" icon={square} />
                            </IonButton>
                        )}
                        <IonButton
                            disabled={engine.segments.length <= 0}
                            size="large"
                            color="primary"
                            fill="solid"
                            onClick={engine.toggle}
                        >
                            <IonIcon
                                slot="icon-only"
                                icon={
                                    ['pause', 'end', 'stop'].includes(
                                        engine.status,
                                    )
                                        ? play
                                        : pause
                                }
                            />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default Home;
