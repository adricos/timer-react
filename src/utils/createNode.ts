import { GitTreeNode } from 'models/gitTreeNode';
import { WorkoutNode, Workout } from 'models/workout';

const createNode = (
    node: GitTreeNode,
    workouts: Workout[],
    tree: GitTreeNode[],
): WorkoutNode => {
    const path = node.path.split('/');
    const subTree = tree.filter(
        (child) =>
            child.path.startsWith(node.path) &&
            child.path.split('/').length === node.path.split('/').length + 1,
    );
    const workout = workouts.find((w) => w.path === node.path);
    return {
        name: workout?.name ?? path[path.length - 1],
        workout: workout,
        path: node.path,
        children:
            node.type === 'tree'
                ? subTree.map((child) => createNode(child, workouts, tree))
                : undefined,
    };
};

export default createNode;
