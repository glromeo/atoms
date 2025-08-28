# Atoms

I fell in love with **Atoms** (aka **Signals**) since I first saw [this video](https://youtu.be/_ISAA_Jt9kI)  
on [Recoil](https://recoiljs.org/), and I’ve been using them regularly since early 2023.

My library of choice was [Jotai](https://jotai.org/), thanks to its straightforward vanilla API.  
Still, I found some room for improvement—particularly in the React hooks layer, such as adopting [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).

With the experience I gained using Jotai, I decided to roll out my own implementation of Atoms. Once it reached a decent level of completeness, I compared its performance.

---

## Benchmarks

|              | Jotai    | Mine     |
|--------------|----------|----------|
| **duration** | 6.678 s  | 0.698 s  |
| **rss**      | 841 MB   | 429 MB   |
| **heapTotal**| 496 MB   | 396 MB   |
| **heapUsed** | 252 MB   | 365 MB   |
| **external** | 1.79 MB  | 1.79 MB  |

My PoC is roughly **10× faster**, using about **½ the memory**.

> The benchmark builds a binary tree 16 levels deep (~64k nodes).  
> Leaf nodes are primitive atoms. For 100k iterations, one third of the leaves are updated,  
> triggering recomputation up to the subscribed root node.

I don’t believe the runtime around Atoms is usually the bottleneck in applications.  
But I still see value in betting on my own solution—both to squeeze more performance  
and to have full control over the internals when I want to tweak them.

---

## What are Atoms?

An **Atom** is just a key (an object) that represents a piece of state.  
Atoms don’t store values directly; instead, they are looked up in a **molecule**,  
which is just a [WeakMap](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) managed by a `Scope`.

- **Primitive Atoms** hold raw values.
- **Derived Atoms** compute values from other atoms.
- All values are cached in the molecule until invalidated.

### Primitive atoms

```js
const { get, set } = new Scope()
const count = atom(9)

console.log(get(count))  // → 9
set(count, 5)
console.log(get(count))  // → 5
```

### Derived atoms

```js
const num = atom(5)
const doubled = atom(get => get(num) * 2)

console.log(get(doubled))  // → 10
```

The function of a derived atom is only re-executed when its dependencies change.

### Multiple scopes

Atoms are keys; their values are scoped.  
You can create as many independent scopes (molecules) as you need:

```js
const scope1 = new Scope()
const scope2 = new Scope()
const value = atom(9)

scope1.set(value, 5)
scope2.set(value, 10)

console.log(scope1.get(value))  // → 5
console.log(scope2.get(value))  // → 10
```

### Subscribing to changes

You can observe atom changes in a given scope:

```js
scope1.bind(value, () => console.log('value changed in scope1'))
scope2.bind(value, () => console.log('value changed in scope2'))

scope1.set(value, 42)
// → "value changed in scope1"
```

Listeners are local to the scope in which they are bound.  
Changing the same atom in another scope does not trigger them.

### Async atoms

Derived atoms can return a promise, making async state straightforward:

```js
const user = atom(async get => {
  const res = await fetch('/api/user')
  return res.json()
})

scope.get(user).then(data => {
  console.log('loaded user', data)
})
```

The promise is cached until resolved; listeners are called when the final value is available.

---

## API Overview

- **`atom(init | read, write?)`**  
  Create a primitive or derived atom.

- **`new Scope()`**  
  Creates a molecule (container for atom states).  
  Provides:
    - `get(atom)` → value | Promise
    - `set(atom, value | ...args)`
    - `bind(atom, callback)` → unsubscribe function
    - `unbind(atom?, callback?)`
    - `dismiss()` → remove all bindings

- **Events**  
  Atoms can define lifecycle hooks with `on('bind', handler)`  
  where `handler(scope)` may return a cleanup function.

---

## Why another atom library?

- Faster runtime (see benchmarks).
- Simpler internal model for experimenting.
- Full control over lifecycle hooks and bindings.
- Works outside React by design—can be used in any JS app.

---

## Status

This is still an **experimental** project, but already functional.  
Expect the API to evolve as I refine features and ergonomics.

Contributions, ideas, and benchmarks are welcome! 🚀
