import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="page">
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go back Home</Link>
    </div>
  )
}

export default NotFound
