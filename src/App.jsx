import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.restcountries.com/countries/v5'
const API_KEY = (import.meta.env.VITE_API_KEY || 'rc_live_demo').trim()
const FIELDS = 'names,codes,capitals,region,subregion,population,flag,languages,currencies,links,area'

const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(value || 0)

function normalizeCountry(country) {
  return {
    name: country.names,
    capital: country.capitals?.length ? [country.capitals.find((item) => item.attributes?.primary)?.name || country.capitals[0].name] : [],
    region: country.region,
    subregion: country.subregion,
    population: country.population,
    flags: { svg: country.flag?.url_svg, alt: country.flag?.description },
    cca3: country.codes?.alpha_3,
    languages: country.languages || [],
    currencies: country.currencies || [],
    maps: { googleMaps: country.links?.google_maps },
    area: country.area?.kilometers,
  }
}

async function apiRequest(path, signal) {
  const separator = path.includes('?') ? '&' : '?'
  const requestUrl = `${API_URL}${path}${separator}api-key=${encodeURIComponent(API_KEY)}`
  const response = await fetch(requestUrl, { signal })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const apiMessage = payload?.errors?.[0]?.message
    throw new Error(apiMessage || `A API respondeu com o erro ${response.status}.`)
  }
  const payload = await response.json()
  return payload.data?.objects || []
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/"><span className="brand-mark">◎</span> atlas.</Link>
        <p>REST Countries Explorer</p>
      </header>
      {children}
      <footer>
        <p>Projeto educacional com dados da REST Countries API.</p>
        <a href="https://restcountries.com" target="_blank" rel="noreferrer">Fonte dos dados</a>
      </footer>
    </div>
  )
}

function CountryCard({ country }) {
  return (
    <Link className="country-card" to={`/pais/${country.cca3}`}>
      <div className="flag-wrap"><img src={country.flags.svg} alt={country.flags.alt || `Bandeira de ${country.name.common}`} loading="lazy" /></div>
      <div className="card-body">
        <span className="region-tag">{country.region}</span>
        <h2>{country.name.common}</h2>
        <dl>
          <div><dt>Capital</dt><dd>{country.capital?.[0] || 'Não informada'}</dd></div>
          <div><dt>População</dt><dd>{formatNumber(country.population)}</dd></div>
        </dl>
        <span className="view-link">Ver detalhes</span>
      </div>
    </Link>
  )
}

function Home() {
  const [countries, setCountries] = useState([])
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('Todas')
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    async function loadCountries() {
      try {
        setStatus('loading')
        setErrorMessage('')
        const pages = await Promise.all([0, 100, 200].map((offset) => apiRequest(`?limit=100&offset=${offset}&response_fields=${FIELDS}`, controller.signal)))
        const data = pages.flat().map(normalizeCountry)
        const uniqueCountries = [...new Map(data.map((country) => [country.cca3, country])).values()]
        setCountries(uniqueCountries.sort((a, b) => a.name.common.localeCompare(b.name.common, 'pt-BR')))
        setStatus('success')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorMessage(error.message)
          setStatus('error')
        }
      }
    }
    loadCountries()
    return () => controller.abort()
  }, [])

  const filteredCountries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return countries.filter((country) => {
      const matchesName = country.name.common.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      const matchesRegion = region === 'Todas' || country.region === region
      return matchesName && matchesRegion
    })
  }, [countries, query, region])

  return (
    <Layout>
      <main>
        <section className="hero">
          <p className="eyebrow">Explore o mundo</p>
          <h1>Um planeta.<br /><span>Muitas histórias.</span></h1>
          <p>Pesquise países e descubra capitais, populações, idiomas, moedas e outras informações oficiais em poucos cliques.</p>
        </section>

        <section className="explorer" aria-labelledby="explorer-title">
          <div className="section-heading">
            <div><p className="eyebrow">Países</p><h2 id="explorer-title">Descubra novos lugares</h2></div>
            {status === 'success' && <p><strong>{filteredCountries.length}</strong> resultados</p>}
          </div>
          <div className="controls">
            <label className="search-control">
              <span aria-hidden="true">⌕</span>
              <span className="sr-only">Buscar país</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome do país..." />
            </label>
            <label className="select-control">
              <span className="sr-only">Filtrar por região</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="Todas">Todas as regiões</option><option value="Africa">África</option><option value="Americas">Américas</option><option value="Asia">Ásia</option><option value="Europe">Europa</option><option value="Oceania">Oceania</option>
              </select>
            </label>
          </div>

          {status === 'loading' && <div className="state-card"><span className="loader"></span><h3>Carregando países...</h3></div>}
          {status === 'error' && <div className="state-card error-state"><h3>Não foi possível carregar os países.</h3><p>{errorMessage || 'Verifique sua conexão e tente novamente.'}</p><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div>}
          {status === 'success' && filteredCountries.length === 0 && <div className="state-card"><h3>Nenhum país encontrado.</h3><p>Tente outro nome ou selecione outra região.</p></div>}
          {status === 'success' && <div className="country-grid">{filteredCountries.map((country) => <CountryCard key={country.cca3} country={country} />)}</div>}
        </section>
      </main>
    </Layout>
  )
}

function Detail() {
  const { code } = useParams()
  const [country, setCountry] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
    async function loadCountry() {
      try {
        const data = await apiRequest(`/codes.alpha_3/${code}?response_fields=${FIELDS}`, controller.signal)
        setCountry(data[0] ? normalizeCountry(data[0]) : null)
        setStatus('success')
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('error')
      }
    }
    loadCountry()
    return () => controller.abort()
  }, [code])

  if (status === 'loading') return <Layout><main className="detail-state"><span className="loader"></span><h1>Carregando país...</h1></main></Layout>
  if (status === 'error' || !country) return <Layout><main className="detail-state"><h1>País não encontrado.</h1><Link className="primary-button" to="/">Voltar ao início</Link></main></Layout>

  const languages = country.languages.map((language) => language.name).join(', ') || 'Não informado'
  const currencies = country.currencies.map((currency) => `${currency.name} (${currency.symbol || '—'})`).join(', ') || 'Não informada'

  return (
    <Layout>
      <main className="detail-page">
        <Link className="back-link" to="/">Voltar para países</Link>
        <div className="detail-layout">
          <div className="detail-flag"><img src={country.flags.svg} alt={country.flags.alt || `Bandeira de ${country.name.common}`} /></div>
          <div className="detail-content">
            <p className="eyebrow">{country.region}</p>
            <h1>{country.name.common}</h1>
            <p className="official-name">{country.name.official}</p>
            <dl className="detail-specs">
              <div><dt>Capital</dt><dd>{country.capital?.[0] || 'Não informada'}</dd></div>
              <div><dt>Sub-região</dt><dd>{country.subregion || 'Não informada'}</dd></div>
              <div><dt>População</dt><dd>{formatNumber(country.population)}</dd></div>
              <div><dt>Área</dt><dd>{formatNumber(country.area)} km²</dd></div>
              <div><dt>Idiomas</dt><dd>{languages}</dd></div>
              <div><dt>Moedas</dt><dd>{currencies}</dd></div>
            </dl>
            {country.maps?.googleMaps && <a className="primary-button" href={country.maps.googleMaps} target="_blank" rel="noreferrer">Ver no mapa</a>}
          </div>
        </div>
      </main>
    </Layout>
  )
}

function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/pais/:code" element={<Detail />} /><Route path="*" element={<Layout><main className="detail-state"><h1>Página não encontrada.</h1><Link className="primary-button" to="/">Voltar ao início</Link></main></Layout>} /></Routes>
}

export default App
