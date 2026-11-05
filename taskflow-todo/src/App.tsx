import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, CheckCheck, Circle, ListTodo, Plus, Trash2 } from 'lucide-react'
import type { Filter, Todo } from './types'

const STORAGE_KEY = 'taskflow-todos'

const filterOptions: { label: string; value: Filter }[] = [
  { label: 'Все задачи', value: 'all' },
  { label: 'Активные', value: 'active' },
  { label: 'Выполненные', value: 'completed' },
]

function readTodos(): Todo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is Todo =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        item.text.trim().length > 0 &&
        typeof item.completed === 'boolean' &&
        typeof item.createdAt === 'number' &&
        Number.isFinite(item.createdAt),
    )
  } catch {
    return []
  }
}

function App() {
  const [todos, setTodos] = useState<Todo[]>(readTodos)
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
      setStorageError(false)
    } catch {
      // The app remains usable even when browser storage is unavailable.
      setStorageError(true)
    }
  }, [todos])

  const activeCount = todos.filter((todo) => !todo.completed).length
  const completedCount = todos.length - activeCount

  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((todo) => !todo.completed)
    if (filter === 'completed') return todos.filter((todo) => todo.completed)
    return todos
  }, [todos, filter])

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text) return

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    }

    setTodos((current) => [newTodo, ...current])
    setInput('')
  }

  function toggleTodo(id: string) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    )
  }

  function deleteTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }

  const emptyTitle =
    filter === 'active'
      ? 'Активных задач нет'
      : filter === 'completed'
        ? 'Выполненных задач пока нет'
        : 'Пока здесь пусто'

  const emptyDescription =
    filter === 'all'
      ? 'Добавьте первую задачу, чтобы спланировать свой день.'
      : 'Попробуйте выбрать другой фильтр или добавьте новую задачу.'

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="todo-app" aria-label="Список задач">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark"><CheckCheck size={19} strokeWidth={2.5} /></span>
            <span>taskflow</span>
          </div>
          <span className="topbar-note">Ваш день под контролем</span>
        </header>

        <div className="intro">
          <div className="eyebrow"><span className="eyebrow-dot" /> ЛИЧНЫЙ ПЛАНИРОВЩИК</div>
          <h1>Меньше хаоса.<br /><span>Больше сделанного.</span></h1>
          <p>Запишите важное и двигайтесь к цели шаг за шагом.</p>
        </div>

        <form className="add-form" onSubmit={addTodo}>
          <Plus className="input-plus" size={20} />
          <input
            aria-label="Новая задача"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Что нужно сделать?"
            maxLength={180}
          />
          <button className="add-button" type="submit" disabled={!input.trim()}>
            Добавить <span>↗</span>
          </button>
        </form>

        <div className="overview">
          <div className="overview-copy">
            <span className="section-kicker">МОЙ СПИСОК</span>
            <h2>Задачи <span className="total-count">{todos.length}</span></h2>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{activeCount}</span>
              <span className="stat-label">активные</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">{completedCount}</span>
              <span className="stat-label">готово</span>
            </div>
          </div>
        </div>

        <nav className="filters" aria-label="Фильтр задач">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`filter-button ${filter === option.value ? 'selected' : ''}`}
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
            >
              {option.label}
              {option.value === 'all' && <span className="filter-count">{todos.length}</span>}
            </button>
          ))}
        </nav>

        <div className="task-list" aria-live="polite">
          {visibleTodos.length > 0 ? (
            visibleTodos.map((todo) => (
              <article className={`task-item ${todo.completed ? 'is-completed' : ''}`} key={todo.id}>
                <button
                  className="complete-button"
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={todo.completed ? `Вернуть задачу «${todo.text}» в активные` : `Отметить задачу «${todo.text}» выполненной`}
                  aria-pressed={todo.completed}
                >
                  {todo.completed ? <Check size={15} strokeWidth={3} /> : <Circle size={20} strokeWidth={1.7} />}
                </button>
                <span className="task-text">{todo.text}</span>
                <span className="task-status">{todo.completed ? 'Готово' : 'В работе'}</span>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Удалить задачу «${todo.text}»`}
                  title="Удалить задачу"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><ListTodo size={25} /></div>
              <h3>{emptyTitle}</h3>
              <p>{emptyDescription}</p>
            </div>
          )}
        </div>

        <footer className="app-footer" aria-live="polite">
          <span>
            <span className={`footer-dot ${storageError ? 'footer-dot-error' : ''}`} />
            {storageError ? 'Не удалось сохранить в браузере' : 'Сохраняется автоматически'}
          </span>
          <span>{activeCount === 0 && todos.length > 0 ? 'Все задачи выполнены ✨' : 'Шаг за шагом'}</span>
        </footer>
      </section>
      <div className="page-caption">ПРОСТРАНСТВО ДЛЯ ВАШИХ ПЛАНОВ</div>
    </main>
  )
}

export default App
