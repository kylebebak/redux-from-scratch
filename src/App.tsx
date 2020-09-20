import React from 'react'

import { createStore, Provider, connect, useDispatch, useSelector } from './store_v7'

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

const TodoListWithHooks = () => {
  const dispatch = useDispatch()
  const todos = useSelector(state => state.todos)
  return (
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
}

const App = () => (
  <Provider store={store}>
    {/*<TodoListContainer />*/}
    <TodoListWithHooks />
  </Provider>
)

export default App
