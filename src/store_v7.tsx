import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import { unstable_batchedUpdates } from 'react-dom'

import shallowEqual from './shallowEqual'

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

const createSubscription = () => {
  const listeners = []

  return {
    // Can overwrite subscribe method from top-level store, so that
    // notifyUpdates only causes descendants of this component to rerender
    subscribe(listener) {
      listeners.push(listener)

      // Returns an unsubscribe function
      return () => {
        const index = listeners.indexOf(listener)
        listeners.splice(index, 1)
      }
    },
    // Like dispatch but doesn't update state
    notifyUpdates() {
      listeners.forEach(listener => {
        listener()
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

  // subStore's getState and dispatch come from top-level store, while subscribe
  // is overridden by identical method returned by createSubscription
  const subStore = useMemo(
    () => ({
      ...store,
      ...createSubscription(),
    }),
    [store],
  )

  const [, forceUpdate] = useState(0)
  const mappedPropsRef = useRef()
  mappedPropsRef.current = mapStateToProps(store.getState(), props)
  const propsRef = useRef()
  propsRef.current = props

  useEffect(() => {
    // If dispatch called, compute next mapped props, and don't force component
    // to update unless nextMappedProps are different from current mapped props
    return store.subscribe(() => {
      const nextMappedProps = mapStateToProps(store.getState(), propsRef.current)

      if (shallowEqual(mappedPropsRef.current, nextMappedProps)) {
        // Bail out of updates early (don't rerender this component), and
        // immediately notify descendants of updates
        subStore.notifyUpdates()
        return
      }

      forceUpdate(c => c + 1)
    })
  }, [store, propsRef, mappedPropsRef, forceUpdate, subStore])

  // If this component is forced to rerender (i.e. because it got new props or
  // because its mapped props changed), notify its descendants after render is
  // complete (remember, useEffect runs after rendering)
  useEffect(() => {
    subStore.notifyUpdates()
  })

  return (
    <Provider store={subStore}>
      <WrappedComponent {...props} {...mappedPropsRef.current} dispatch={store.dispatch} />
    </Provider>
  )
}

export const useDispatch = () => {
  const store = useContext(Context)
  return store.dispatch
}

export const useSelector = selector => {
  const store = useContext(Context)
  const [, forceUpdate] = useState(0)
  const currentState = useRef()
  // Try to get the state in the render phase to safely get the latest props
  currentState.current = selector(store.getState())

  useEffect(() => {
    return store.subscribe(() => {
      try {
        const nextState = selector(store.getState())

        if (currentState.current === nextState) {
          // Bail out of updates early
          return
        }
      } catch (err) {
        // Ignore errors
      }

      // Either way we want to force a re-render
      forceUpdate(c => c + 1)
    })
  }, [store, forceUpdate, selector, currentState])

  return currentState.current
}
