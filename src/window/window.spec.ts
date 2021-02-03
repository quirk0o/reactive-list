import { SlidingWindow } from './window'

describe('SlidingWindow', () => {
  it('', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    let w = new SlidingWindow(items)

    expect(w.top).toEqual([])
    expect(w.window).toEqual([])
    expect(w.bottom).toEqual(items)
    expect(w.peekTop()).toBeNull()
    expect(w.peekWindow()).toEqual([null, null])
    expect(w.peekBottom()).toEqual('a')

    w = w.shiftIn('a')
    
    expect(w.top).toEqual([])
    expect(w.window).toEqual(['a'])
    expect(w.bottom).toEqual(['b', 'c', 'd', 'e'])
    expect(w.peekTop()).toBeNull()
    expect(w.peekWindow()).toEqual(['a', 'a'])
    expect(w.peekBottom()).toEqual('b')
    
    w = w.shiftOut('a')
    
    expect(w.top).toEqual(['a'])
    expect(w.window).toEqual([])
    expect(w.bottom).toEqual(['b', 'c', 'd', 'e'])
    expect(w.peekTop()).toEqual('a')
    expect(w.peekWindow()).toEqual([null, null])
    expect(w.peekBottom()).toEqual('b')
    
    w = w.shiftIn('b')

    expect(w.top).toEqual(['a'])
    expect(w.window).toEqual(['b'])
    expect(w.bottom).toEqual(['c', 'd', 'e'])
    expect(w.peekTop()).toEqual('a')
    expect(w.peekWindow()).toEqual(['b', 'b'])
    expect(w.peekBottom()).toEqual('c')
  })
})
