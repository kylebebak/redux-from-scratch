import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

export const createStore = (reducer, initialState = {}) => {
  let state = initialState
  const listeners = []

  return {
    getState() {
      return state
    },
    subscribe(listener) {
      listeners.push(listener)

      // Returns an unsubscribe function
      return () => {
        const index = listeners.indexOf(listener)
        listeners.splice(index, 1)
      }
    },
    dispatch(action) {
      state = reducer(state, action)

      listeners.forEach(listener => {
        listener()
      })
    },
  }
}

const Context = createContext()

export const Provider = ({ children, store }) => <Context.Provider value={store}>{children}</Context.Provider>

export const connect = mapStateToProps => WrappedComponent => props => {
  const store = useContext(Context)
  const [state, setState] = useState(() => mapStateToProps(store.getState(), props))
  const propsRef = useRef()
  propsRef.current = props

  useEffect(() => {
    return store.subscribe(() => {
      setState(mapStateToProps(store.getState(), propsRef.current))
    })
  }, [store, setState, propsRef])

  return <WrappedComponent {...props} {...state} dispatch={store.dispatch} />
}
