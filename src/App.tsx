import React from 'react'

import { createStore, Provider, connect } from './store_v5'

const reducer = (state, action) => {
  switch (action.type) {
    case 'DELETE': {
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
      }
    }
    default:
      return state
  }
}

const Todo = ({ todo, onClick }) => <li onClick={() => onClick(todo.id)}>{todo.content}</li>

const TodoList = ({ todos, dispatch }) => (
  <ul>
    {todos.map(todo => (
      <Todo
        key={todo.id}
        todo={todo}
        onClick={id => {
          dispatch({ type: 'DELETE', payload: id })
        }}
      />
    ))}
  </ul>
)

const TodoListContainer = connect(state => ({
  todos: state.todos,
}))(TodoList)

const store = createStore(reducer, {
  todos: [{ id: 'a', content: 'A' }, { id: 'b', content: 'B' }],
})

const App = () => (
  <Provider store={store}>
    <TodoListContainer />
  </Provider>
)

export default App
