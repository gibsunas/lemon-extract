import Arborist from '@npmcli/arborist';

const emptyArborist = new Arborist({
    path: 'configurations/empty'
});

const reactArborist = new Arborist({
    path: 'configurations/one'
});
const selfArborist = new Arborist({
    path: 'configurations/@lemon/extract'
});
const pinnedArborist = new Arborist({
    path: 'configurations/pinned'
});

// await emptyArborist
//     .loadVirtual()
//     .then(tree => {
//         console.dir({ name: 'empty', tree });
//     });
// await reactArborist
//     .loadVirtual()
//     .then(tree => {
//         console.dir({ name: 'react', tree });
//     });
await pinnedArborist
    .buildIdealTree({})
    .then(tree => {
        // console.dir({ name: 'pinned', tree });

        console.dir(
            Array.from(
                tree.children.values()
            )
                .map(
                    (child) => ({
                        name: child.name,
                        childrenCount: Array.from(child.children.values()).length,
                        children: Array.from(child.children.values()).map(p => `${p.name}@${p.version}`)
                    })
                )
        );
    });
false && await selfArborist
    .buildIdealTree({})
    .then(tree => {
        // console.dir({ name: 'self', tree });
        // console.dir(Array.from(tree.children.values()).map(p => `${p.name}@${p.version}`));
        console.dir(
            Array.from(
                tree.children.values()
            )
                .map(
                    (child) => ({
                        name: child.name,
                        childrenCount: Array.from(child.children.values()).length,
                        children: Array.from(child.children.values()).map(p => `${p.name}@${p.version}`)
                    })
                )
        );
        // console.dir({ name: 'lockfile', yarnLock: tree.yarnLock.fromTree(tree) });
    });
