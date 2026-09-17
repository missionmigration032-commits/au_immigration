import { useSearchParams, Link } from 'react-router-dom'

function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  return (
    <div className="page" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Search Results</h1>
      {query ? (
        <>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Showing results for: <strong>"{query}"</strong>
          </p>
          <p style={{ color: '#999' }}>
            No results found. This is a demo search page.
          </p>
        </>
      ) : (
        <p style={{ color: '#999' }}>Please enter a search term.</p>
      )}
      <Link to="/" style={{ color: '#0061a5', marginTop: '1rem', display: 'inline-block' }}>
        ← Back to Home
      </Link>
    </div>
  )
}

export default SearchResults
