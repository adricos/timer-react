import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import { NativeAudio } from '@capacitor-community/native-audio';

import './App.scss';

/* Theme variables */
import './theme/variables.css';

NativeAudio.preload({
    assetId: '1',
    assetPath: 'assets/sounds/1.mp3',
}).catch((e) => console.log(e));
NativeAudio.preload({
    assetId: '2',
    assetPath: 'assets/sounds/2.mp3',
}).catch((e) => console.log(e));
NativeAudio.preload({
    assetId: '3',
    assetPath: 'assets/sounds/3.mp3',
}).catch((e) => console.log(e));
NativeAudio.preload({
    assetId: '4',
    assetPath: 'assets/sounds/4.mp3',
}).catch((e) => console.log(e));
NativeAudio.preload({
    assetId: '5',
    assetPath: 'assets/sounds/5.mp3',
}).catch((e) => console.log(e));

setupIonicReact();

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <Route exact path="/home">
                    <Home />
                </Route>
                <Route exact path="/">
                    <Redirect to="/home" />
                </Route>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
