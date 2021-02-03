import { always, cond, equals, T } from "ramda"

export class SlidingWindow<T> {
  private items: T[]
  private topLast: number
  private bottomFirst: number

  constructor(items: T[], { top, bottom }: { top?: number; bottom?: number } = {}) {
    this.items = items
    this.topLast = top || 0
    this.bottomFirst = bottom || items.length * -1
  }

  get top(): T[] {
    return this.items.slice(0, this.topLast)
  }

  get window(): T[] {
    return this.items.slice(this.topLast, this.bottomFirst)
  }

  get bottom(): T[] {
    return this.items.slice(this.bottomFirst)
  }

  get length(): number {
    return this.items.length
  }

  peekTop(): T | null {
    return this.items[this.topLast - 1] || null
  }

  peekBottom(): T | null {
    return this.items[this.length + this.bottomFirst] || null
  }

  peekWindow(): [T | null, T | null] {
    const topIdx = this.topLast
    const bottomIdx = this.length + this.bottomFirst - 1
    if (bottomIdx < topIdx) return [null, null]

    return [this.items[topIdx], this.items[bottomIdx]]
  }

  push = (): SlidingWindow<T> => {
    return new SlidingWindow(this.items, {
      top: this.topLast - 1,
      bottom: this.bottomFirst
    })
  }

  pop = (): SlidingWindow<T> => {
    return new SlidingWindow(this.items, {
      top: this.topLast + 1,
      bottom: this.bottomFirst
    })
  }

  inject = (): SlidingWindow<T> => {
    return new SlidingWindow(this.items, {
      top: this.topLast,
      bottom: this.bottomFirst + 1
    })
  }

  eject = (): SlidingWindow<T> => {
    return new SlidingWindow(this.items, {
      top: this.topLast,
      bottom: this.bottomFirst - 1
    })
  }

  shiftIn(item: T): SlidingWindow<T> {
    return cond<T, SlidingWindow<T>>([
      [equals(this.peekTop()), this.push],
      [equals(this.peekBottom()), this.inject],
      [T, always(this)]
    ])(item, item, item)
  }

  shiftOut(item: T): SlidingWindow<T> {
    const [top, bottom] = this.peekWindow()

    return cond<T, SlidingWindow<T>>([
      [equals(top), this.pop],
      [equals(bottom), this.eject],
      [T, always(this)]
    ])(item, item, item)
  }
}
