import { useState, useEffect, useRef } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonItem,
    IonPage,
    IonRange,
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
    pause,
    play,
    square,
    removeOutline,
} from 'ionicons/icons';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { Preferences } from '@capacitor/preferences';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { useGetLanguageCode } from '@capacitor-community/device-react';
import { Http } from '@capacitor-community/http';
import { sortBy } from 'lodash';
import { GitFile } from 'models/gitFile';
import { Workout } from 'models/workout';
import { Strides } from 'models/stride';

import useWorkoutEngine, { sToHms } from 'hooks/useWorkoutEngine';
import useInterval from 'hooks/useInterval';
import useWindowDimensions from 'hooks/useWindowsDimension';
import WorkoutStatus from 'components/WorkoutStatus/WorkoutStatus';
import WorkoutChart from 'components/WorkoutChart/WorkoutChart';

import './Home.css';
import Person from 'components/Icons/Person';
import PersonRunning from 'components/Icons/PersonRunning';

const Home: React.FC = () => {
    const engine = useWorkoutEngine();
    const { height, width } = useWindowDimensions();
    const { languageCode } = useGetLanguageCode();

    const [workoutsArray, setWorkoutsArray] = useState<Workout[]>([]);
    const [workout, setWorkout] = useState<number>();
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [stride, setStride] = useState<number>(1);
    const [time, setTime] = useState<string>();
    const scroll = useRef<VirtuosoHandle>(null);
    const { data: languages } = useQuery(['getSupportedVoices'], () =>
        TextToSpeech.getSupportedLanguages().then((result) => result.languages),
    );
    const isMediaDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
    ).matches;

    const repo = 'https://api.github.com/repos/adricos/workouts/contents/files';

    const updateTime = () => {
        setTime(format(Date.now(), 'HH:mm'));
    };

    const { start, stop } = useInterval(updateTime);

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
                        if (results.length > 0) {
                            const newWorkoutsArray = sortBy(
                                results.map((r) => JSON.parse(r.data)),
                                'name',
                            );
                            Preferences.set({
                                key: 'workouts',
                                value: JSON.stringify(newWorkoutsArray),
                            });
                            return newWorkoutsArray;
                        }
                        return [];
                    });
                })
                .finally(() => {
                    setIsSyncing(false);
                });
        });
    };

    useEffect(() => {
        setIsDarkMode(isMediaDark);
        document.body.classList.toggle('dark', isMediaDark);
    }, [isMediaDark]);

    useEffect(() => {
        Preferences.get({ key: 'workouts' })
            .then((val) =>
                val.value === null
                    ? sync()
                    : setWorkoutsArray(JSON.parse(val.value ?? '{}')),
            )
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
        if (scroll && scroll.current) {
            scroll.current.scrollToIndex(engine.segmentNumber);
        }
    }, [engine.segmentNumber]);

    const toggleDarkMode = () => {
        document.body.classList.toggle('dark');
        setIsDarkMode((d) => !d);
    };

    const loadWorkout = (event: any) => {
        setWorkout(event.detail.value);
        engine.load(workoutsArray[event.detail.value], Strides[stride]);
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
                                engine.status !== 'stopped'
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
                            disabled={isSyncing || engine.status !== 'stopped'}
                        >
                            {isSyncing ? (
                                <IonSpinner name="lines-small" />
                            ) : (
                                <IonIcon icon={syncIcon} />
                            )}
                        </IonButton>
                        <IonButton
                            size="large"
                            color="primary"
                            fill="solid"
                            onClick={toggleDarkMode}
                        >
                            <IonIcon icon={isDarkMode ? sunny : moon} />
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
                        {engine.status !== 'stopped' ? (
                            <WorkoutStatus engine={engine} />
                        ) : (
                            <WorkoutChart
                                segmentsGraph={engine.segmentsGraph}
                            />
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
                            data={engine.segments}
                            itemContent={(index, segment) => {
                                return (
                                    <IonItem
                                        {...(segment.completed === undefined
                                            ? {}
                                            : {
                                                  color: segment.completed
                                                      ? 'success'
                                                      : 'primary',
                                              })}
                                        className="segment"
                                    >
                                        <div className="item-content">
                                            <div
                                                style={{ justifySelf: 'start' }}
                                            >
                                                {sToHms(segment.time)}
                                            </div>
                                            <div
                                                style={{
                                                    justifySelf: 'center',
                                                }}
                                            >
                                                {segment.speed.toFixed(1)}
                                            </div>
                                            <div style={{ justifySelf: 'end' }}>
                                                {index}
                                            </div>
                                        </div>
                                    </IonItem>
                                );
                            }}
                        />
                    </div>
                </div>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0px 8px',
                            gap: '4px',
                            width: '100%',
                            minHeight: '58px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignContent: 'center',
                                gap: '8px',
                                fontSize: '26px',
                            }}
                        >
                            {engine.status !== 'stopped' ? (
                                time
                            ) : (
                                <>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignContent: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <IonIcon icon={statsChart} />
                                        <div>
                                            {engine.segments.length - 1 < 0
                                                ? 0
                                                : engine.segments.length - 1}
                                        </div>
                                    </div>
                                    <IonIcon icon={removeOutline} />
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignContent: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <IonIcon icon={stopwatch} />
                                        <div>{engine.totalTime}</div>
                                    </div>
                                </>
                            )}
                        </div>
                        {engine.status === 'stopped' && (
                            <div
                                style={{
                                    width: '300px',
                                }}
                            >
                                <IonRange
                                    value={stride}
                                    onIonChange={({ detail }) => {
                                        if (workout !== undefined) {
                                            engine.load(
                                                workoutsArray[workout],
                                                Strides[detail.value as number],
                                            );
                                        }
                                        setStride(detail.value as number);
                                    }}
                                    ticks={true}
                                    snaps={true}
                                    min={0}
                                    max={2}
                                >
                                    <div slot="start">
                                        <Person />
                                    </div>
                                    <div slot="end">
                                        <PersonRunning />
                                    </div>
                                </IonRange>
                            </div>
                        )}
                        <div>
                            <IonButtons slot="end">
                                {engine.status !== 'stopped' && (
                                    <IonButton
                                        size="large"
                                        color="primary"
                                        fill="solid"
                                        onClick={engine.stop}
                                    >
                                        <IonIcon icon={square} />
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
                                        icon={
                                            engine.status === 'running'
                                                ? pause
                                                : play
                                        }
                                    />
                                </IonButton>
                            </IonButtons>
                        </div>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default Home;
