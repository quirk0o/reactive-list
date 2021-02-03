import { intersection } from 'fp-ts/lib/ReadonlySet'
import {
  adjust,
  always,
  and,
  any,
  append,
  apply,
  both,
  complement,
  cond,
  equals,
  flip,
  gt,
  head,
  ifElse,
  invoker,
  lt,
  negate,
  pipe,
  prepend,
  prop,
  reverse,
  T,
  tap,
  unapply,
  when,
  xor,
  __
} from 'ramda'
import React, { useCallback, useEffect, useRef } from 'react'
import { groupBy, toPairs } from 'remeda'
import { from, merge, NEVER, partition, ReplaySubject } from 'rxjs'
import {
  map,
  materialize,
  scan,
  startWith,
  switchMap,
  groupBy as group,
  mergeAll,
  mergeMap,
  take,
  pairwise,
  withLatestFrom,
  mapTo,
  filter,
  distinctUntilChanged
} from 'rxjs/operators'
import { SlidingWindow } from '../window/window'
import './anchored-list.css'

class Stack {
  private items: any[]

  constructor(...items: any[]) {
    this.items = reverse(items)
  }

  get length(): number {
    return this.items.length
  }

  peek(): number {
    return this.items[this.length - 1]
  }

  push(elem: any) {
    return this.items.push(elem)
  }

  pop() {
    return this.items.pop()
  }

  inspect() {
    return `Stack(${reverse(this.items)})`
  }
}

class Deque {
  private items: any[]

  constructor(...items: any[]) {
    this.items = reverse(items)
  }

  get length(): number {
    return this.items.length
  }

  peekFront(): any {
    return this.items[this.length - 1]
  }

  peekBack(): any {
    return this.items[0]
  }

  push(elem: any) {
    return this.items.push(elem)
  }

  pop() {
    return this.items.pop()
  }

  inject(elem: any) {
    return this.items.unshift(elem)
  }

  eject() {
    return this.items.shift()
  }

  inspect() {
    return `Deque(${reverse(this.items)})`
  }
}

// class SlidingWindow {
//   private front: Stack
//   private window: Deque
//   private back: Stack

//   constructor(...items: any[]) {
//     this.front = new Stack()
//     this.window = new Deque()
//     this.back = new Stack(...items)
//   }

//   shiftIn(elem: any) {
//     return cond<any, any>([
//       [equals(this.front.peek()), () => this.push()],
//       [equals(this.back.peek()), () => this.inject()]
//     ])(elem, elem, elem)
//   }

//   shiftOut(elem: any) {
//     return cond<any, any>([
//       [equals(this.window.peekFront()), () => this.pop()],
//       [equals(this.window.peekBack()), () => this.eject()]
//     ])(elem, elem, elem)
//   }

//   push() {
//     this.window.push(this.front.pop())
//   }

//   pop() {
//     this.front.push(this.window.pop())
//   }

//   inject() {
//     this.window.inject(this.back.pop())
//   }

//   eject() {
//     this.back.push(this.window.eject())
//   }

//   inspect() {
//     return `Deque(front: ${this.front.inspect()}, window: ${this.window.inspect()}, back: ${this.back.inspect()})`
//   }
// }

type Item = {
  name: string
  group: string
}

const items: Item[] = [
  { name: 'A1', group: 'A' },
  { name: 'A2', group: 'A' },
  { name: 'A3', group: 'A' },
  { name: 'A4', group: 'A' },
  { name: 'A5', group: 'A' },
  { name: 'A6', group: 'A' },
  { name: 'B1', group: 'B' },
  { name: 'B2', group: 'B' },
  { name: 'B3', group: 'B' },
  { name: 'B4', group: 'B' },
  { name: 'B5', group: 'B' },
  { name: 'B6', group: 'B' },
  { name: 'B7', group: 'B' },
  { name: 'B8', group: 'B' },
  { name: 'B9', group: 'B' },
  { name: 'B10', group: 'B' },
  { name: 'B11', group: 'B' },
  { name: 'B12', group: 'B' },
  { name: 'B13', group: 'B' },
  { name: 'B14', group: 'B' },
  { name: 'B15', group: 'B' },
  { name: 'B16', group: 'B' },
  { name: 'B17', group: 'B' },
  { name: 'B18', group: 'B' },
  { name: 'C1', group: 'C' },
  { name: 'C2', group: 'C' },
  { name: 'C3', group: 'C' },
  { name: 'C4', group: 'C' },
  { name: 'C5', group: 'C' },
  { name: 'C6', group: 'C' },
  { name: 'D1', group: 'D' },
  { name: 'D2', group: 'D' },
  { name: 'D3', group: 'D' },
  { name: 'D4', group: 'D' },
  { name: 'D5', group: 'D' },
  { name: 'D6', group: 'D' },
  { name: 'E1', group: 'E' },
  { name: 'E2', group: 'E' },
  { name: 'E3', group: 'E' },
  { name: 'E4', group: 'E' },
  { name: 'E5', group: 'E' },
  { name: 'E6', group: 'E' }
]

const scrollIntoView = (node: HTMLElement, root?: HTMLElement) => {
  return new Promise<null>((resolve, reject) => {
    let timeout: number
    let observer: IntersectionObserver
    observer = new IntersectionObserver(
      entries => {
        if (any(prop('isIntersecting'), entries)) {
          resolve(null)
          clearTimeout(timeout)
          observer.disconnect()
        }
      },
      {
        root,
        threshold: 1
      }
    )
    observer.observe(node)
    node.scrollIntoView({ behavior: 'smooth' })
    timeout = setTimeout(() => {
      observer.disconnect()
      reject()
    }, 1000)
  })
}

const groupedItems: Record<string, Item[]> = groupBy<Item>(items, (item: Item) => item.group)

const nodeId = (node: HTMLElement): string => node.getAttribute('id')!
const target = prop<string, string>('target')
const entryId = pipe<IntersectionObserverEntry, HTMLElement, string>(target, nodeId)

const intersectionRatio = prop('intersectionRatio')
const intersectionGt10 = pipe(intersectionRatio, gt(__, 0.1))
const isIntersecting = prop('isIntersecting')
const boundingRect = prop('boundingClientRect')

const isNegative = lt(0)
const isPositive = gt(0)

const verticalDirection = cond([
  [isPositive, always('DOWN')],
  [isNegative, always('UP')],
  [T, always(null)]
])
const horizontalDirection = cond([
  [isPositive, always('RIGHT')],
  [isNegative, always('LEFT')],
  [T, always(null)]
])
const positionDiff = (r1: DOMRectReadOnly, r2: DOMRectReadOnly) => [
  r2.top - r1.top,
  r2.left - r1.left
]
const scrollDirection = pipe(
  positionDiff,
  prop(0),
  verticalDirection
)

const isVisible = both(isIntersecting, intersectionGt10)

type Direction = 'IN' | 'OUT'
const Direction: Readonly<{ [key: string]: Direction }> = {
  In: 'IN',
  Out: 'OUT'
}

export const AnchoredList: React.FC = () => {
  const containerRef = useRef(null)
  const nodes = useRef<(HTMLElement | null)[]>([])
  const registerNode = useCallback(
    (ref: HTMLElement | null) => {
      nodes.current.push(ref)
    },
    [nodes]
  )
  const window = useRef(new SlidingWindow([]))

  useEffect(() => {
    window.current = new SlidingWindow(nodes.current.map(node => node.getAttribute('id')))
  }, [nodes])

  const click$ = new ReplaySubject<string>(1)
  const handleClick = (id: string) => click$.next(id)

  useEffect(() => {
    const intersection$ = new ReplaySubject<IntersectionObserverEntry>(1)

    intersection$.subscribe(console.log)

    const nodeIntersection$$ = intersection$.pipe(
      group(entryId),
      mergeMap(intersection$ => {
        
        const direction$ = intersection$.pipe(map(boundingRect), pairwise(), map(apply(scrollDirection)))
        const visibility$ = intersection$.pipe(map(isVisible))
        const [enter$, exit$] = partition(visibility$.pipe(
          distinctUntilChanged()
          ), equals(true))
          const visibilityChange$ = merge(
            enter$.pipe(mapTo('IN')),
            exit$.pipe(mapTo('OUT')),
          )

        return visibilityChange$.pipe(withLatestFrom(direction$), map(prepend(intersection$.key)))
      })
    ).subscribe(console.log)

    const [enter$, exit$] = partition(
      intersection$,
      (entry: IntersectionObserverEntry) => entry.isIntersecting && entry.intersectionRatio > 0.1
    )

    const handler = (entries: IntersectionObserverEntry[]) =>
      entries.forEach(entry => intersection$.next(entry))
    const observer = new IntersectionObserver(handler, {
      root: containerRef.current,
      threshold: [0, 0.1]
    })

    nodes.current.forEach(node => observer.observe(node!))

    const scroll$ = click$.pipe(
      map(id => document.getElementById(id)!),
      switchMap((node: HTMLElement) =>
        from(scrollIntoView(node, containerRef.current!)).pipe(materialize())
      )
    )

    const nodeIds = nodes.current.map(node => node.getAttribute('id'))
    const window$ = merge(
      enter$.pipe(map(entry => ({ type: 'enter', entry }))),
      exit$.pipe(map(entry => ({ type: 'exit', entry })))
    ).pipe(
      map(({ type, entry }) => ({
        type,
        id: entry.target.getAttribute('id')
      })),
      // map(tap(console.log)),
      scan((window, { type, id }) => {
        if (type === 'enter') return window.shiftIn(id)
        if (type === 'exit') return window.shiftOut(id)
      }, new SlidingWindow(nodeIds))
    )

    const pause$ = merge(click$.pipe(materialize()), scroll$).pipe(
      map(prop('kind')),
      startWith('C'),
      map(complement(equals('C')))
      // map(tap(console.log))
    )

    merge(pause$.pipe(switchMap(paused => (paused ? NEVER : window$)))).subscribe(window => {
      // console.log(window.top, window.window, window.bottom)
    })

    return () => {
      // nodes.current.forEach((node) => observer.unobserve(node!));
    }
  }, [nodes])

  return (
    <div className="root">
      <section className="nav">
        {Object.keys(groupedItems).map(key => (
          <button key={key} onClick={() => handleClick(key)}>
            {key}
          </button>
        ))}
      </section>
      <section ref={containerRef} className="list">
        <ul>
          {toPairs(groupedItems).map(([key, items]: [string, Item[]]) => (
            <li key={key} id={key} ref={registerNode} className="item">
              <h1>{key}</h1>
              <ul>
                {items.map((item, idx) => (
                  <li key={idx}>{item.name}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
