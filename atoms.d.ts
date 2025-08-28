// Sentinels for internal state
export declare const UNSET: unique symbol;
export declare const STALE: unique symbol;

export type Getter = <V>(atom: Atom<V, any, any>) => V | Promise<V>;

export type Write<A extends unknown[], R> =
    (get: Getter, set: Setter, ...args: A) => R;

// Overloaded setter: either simple value or custom args
export type Setter = {
    <V>(atom: Atom<V, [V], any>, value: V): void;
    <A extends unknown[], R>(atom: Atom<any, A, R>, ...args: A): R;
};

// Core atom type
export type Atom<V, A extends unknown[] = [V], R = void> = {
    readonly atomId: string;
    init?: V;
    read?: (get: Getter) => V | Promise<V>;
    write?: Write<A, R>;
    on(event: 'bind', action: (scope: Scope) => void | (() => void)): Atom<V, A, R>; // fluent
};

// Public-facing state (keep minimal; align with runtime)
export type AtomState<V> = {
    value: V | typeof UNSET | typeof STALE;
    listeners: Set<(value: V) => void> | null;
    // Optional extras if you expose them:
    // pending?: Promise<V> | null;
};

export function atom<V, A extends unknown[] = [V], R = void>(
    read: V | ((get: Getter) => V | Promise<V>) | void,
    write?: Write<A, R>
): Atom<V, A, R>;

export type AnyAtom = Atom<unknown, unknown[], unknown>;

// Scope API
export type Scope = {
    get: Getter;
    set: Setter;

    // returns an unbind function for convenience
    bind: <V>(atom: Atom<V, any, any>, callback: (value: V) => void) => () => void;

    // unbind variants via optional params
    unbind: (atom?: AnyAtom, callback?: () => void) => void;
};
