import {
    IonItem,
    IonIcon,
    IonLabel,
    IonList,
    IonMenuToggle,
} from '@ionic/react';
import {
    folderOpenOutline,
    folderOutline,
    documentTextOutline,
} from 'ionicons/icons';
import { useState } from 'react';
import { WorkoutNode, Workout } from 'models/workout';

const MenuItem = ({
    node,
    onSelectWorkout,
    depth = 0,
}: {
    node: WorkoutNode;
    onSelectWorkout: (workout: Workout) => void;
    depth?: number;
}) => {
    const [subMenuOpen, setSubMenuOpen] = useState(false);

    const toggleSubMenu = () => {
        setSubMenuOpen(!subMenuOpen);
    };

    const Item = () => (
        <>
            <IonItem
                button
                onClick={() => {
                    if (node.children) {
                        toggleSubMenu();
                    } else {
                        if (node.workout && onSelectWorkout) {
                            onSelectWorkout(node.workout);
                        }
                    }
                }}
                style={{ paddingLeft: `${depth * 10}px` }}
            >
                <IonIcon
                    slot="start"
                    icon={
                        node.children && node.children.length > 0
                            ? subMenuOpen
                                ? folderOpenOutline
                                : folderOutline
                            : documentTextOutline
                    }
                />
                <IonLabel>{node.name}</IonLabel>
            </IonItem>
            {node.children && node.children.length > 0 && subMenuOpen && (
                <IonList lines="none">
                    {node.children.map((child, childIndex) => (
                        <MenuItem
                            key={childIndex}
                            node={child}
                            onSelectWorkout={onSelectWorkout}
                            depth={depth + 1}
                        />
                    ))}
                </IonList>
            )}
        </>
    );

    return (
        <>
            {node.children && node.children.length > 0 ? (
                <Item />
            ) : (
                <IonMenuToggle autoHide={false}>
                    <Item />
                </IonMenuToggle>
            )}
        </>
    );
};

export default MenuItem;
