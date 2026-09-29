import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <main className="wrap"><section className="panel">
      <span className="tag">404</span>
      <h1 style={{ margin: '20px 0' }}>Route not found</h1>
      <Link className="btn solid" to="/">Back to sign in</Link>
    </section></main>
  )
}
