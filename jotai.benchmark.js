import {atom, createStore} from "jotai/vanilla";
import {memoryUsage} from "node:process";


const store = createStore();
const atoms = [];

function prepare(l) {
    if (l < 16) {
        const lh = prepare(l + 1);
        const rh = prepare(l + 1);
        return atom(get => get(lh) + get(rh));
    } else {
        const a = atom(0);
        atoms.push(a);
        return a;
    }
}

(async () => {
    const timeStart = performance.now();

    const top = prepare(0);

    let total = store.get(top);

    await new Promise((resolve) => {

        let i = 0;
        store.sub(top, () => {
            total = store.get(top);
            if (i >= 100_000) {
                resolve();
            }
        });
        while (i++ < 100_000) {
            const a = atoms[(3 * i) % atoms.length];
            store.set(a, store.get(a) + 1);
        }

    });

    console.log(memoryUsage());
    console.log(total, performance.now() - timeStart);
})();

/**
 * {
 *   rss: 841252864,
 *   heapTotal: 496078848,
 *   heapUsed: 252543384,
 *   external: 1799741,
 *   arrayBuffers: 10475
 * }
 * 100000 6678.7568
 */
