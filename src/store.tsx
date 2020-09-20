import React, { createContext, useContext, useState, useEffect } from 'react'
import { unstable_batchedUpdates } from 'react-dom'

export const createStore = (reducer, initialState = {}) => {
  let state = initialState
  const listeners = []

  return {
    getState() {
      return state
    },
    // Subscribe adds a listener to listeners, and returns unsubscribe method, which removes listener
    subscribe(listener) {
      listeners.push(listener)

      // Returns an unsubscribe function
      return () => {
        const index = listeners.indexOf(listener)
        listeners.splice(index, 1)
      }
    },
    // Dispatch calls all listeners
    dispatch(action) {
      state = reducer(state, action)

      unstable_batchedUpdates(() => {
        listeners.forEach(listener => {
          listener()
        })
      })
    },
  }
}

const Context = createContext()

export const Provider = ({ children, store }) => <Context.Provider value={store}>{children}</Context.Provider>

/**
 * Connect a component to store made available by Provider context, and ensure
 * component rerenders whenever an action is dispatched to store to update its
 * state.
 *
 * @param mapStateToProps - Function that maps Redux state to props passed in to
 *     wrapped component whenever state is updated
 *
 * @returns Wrapped component that passes through props, plus props derived from
 *     store tate
 */
export const connect = mapStateToProps => WrappedComponent => props => {
  const store = useContext(Context)
  const [, forceUpdate] = useState(0)
  const mappedState = mapStateToProps(store.getState(), props)

  useEffect(() => {
    // Have listener just force this connected component to re-render with new
    // mapped props after dispatch is called
    return store.subscribe(() => {
      forceUpdate(c => c + 1)
    })
  }, [store, forceUpdate])

  return <WrappedComponent {...props} {...mappedState} dispatch={store.dispatch} />
}
