import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

type IconName = 'grid' | 'car' | 'route' | 'users' | 'settings' | 'help' | 'bell' | 'search' | 'plus' | 'arrow' | 'more' | 'warning' | 'layers' | 'locate' | 'filter' | 'zoomIn' | 'zoomOut' | 'expand' | 'collapse'

const icons: Record<IconName, string> = {
  grid: '⊞', car: '▰', route: '⌁', users: '♙', settings: '⚙', help: '?', bell: '♢',
  search: '⌕', plus: '+', arrow: '↗', more: '•••', warning: '△', layers: '◇', locate: '⊙', filter: '≡', zoomIn: '+', zoomOut: '−', expand: '⛶', collapse: '×',
}

function Icon({ name }: { name: IconName }) {
  return <span className={`icon icon-${name}`} aria-hidden="true">{icons[name]}</span>
}

function vehicleColor(color: string) {
  return { green: '#69b86e', blue: '#6c9ed5', amber: '#dfaa4f', returning: '#9a7bd2', red: '#df7b6e' }[color] ?? '#6c9ed5'
}

function vehicleMarkerIcon(color: string): google.maps.Icon {
  const fill = vehicleColor(color)
  const warning = color === 'red' ? '<circle cx="31" cy="5" r="5" fill="#fff"/><path d="M31 2.5v4M31 8.2v.2" stroke="#c94f4a" stroke-width="1.5" stroke-linecap="round"/>' : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="32" viewBox="0 0 42 32"><path d="M8 8.5 10.8 3h14.4L28 8.5l3.2 1.8A3 3 0 0 1 33 12.9V22a2 2 0 0 1-2 2h-2.5a3.5 3.5 0 0 1-7 0h-7a3.5 3.5 0 0 1-7 0H5a2 2 0 0 1-2-2v-9.1a3 3 0 0 1 1.8-2.6L8 8.5Z" fill="${fill}" stroke="white" stroke-width="2"/><path d="M11 7h14l1.2 3H9.8L11 7Z" fill="white" opacity=".8"/><circle cx="10" cy="23" r="2.1" fill="#263544"/><circle cx="26" cy="23" r="2.1" fill="#263544"/>${warning}</svg>`
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new google.maps.Size(42, 32), anchor: new google.maps.Point(18, 14) }
}

const navItems: { label: string; icon: IconName }[] = [
  { label: 'Overview', icon: 'grid' },
  { label: 'Fleet', icon: 'car' },
  { label: 'Live map', icon: 'route' },
  { label: 'Passengers', icon: 'users' },
]

const vehicles = [
  { id: 'OR-204', location: 'Trubarjeva cesta', state: 'On trip', battery: 86, color: 'green', eta: '3 min', position: { lat: 46.0567, lng: 14.515 }, trips: 18, speed: '32 km/h', passenger: '1 onboard', range: '214 km', lastUpdate: '12:42:08' },
  { id: 'OR-187', location: 'Dunajska cesta', state: 'Available', battery: 64, color: 'blue', eta: '—', position: { lat: 46.0712, lng: 14.501 }, trips: 22, speed: '0 km/h', passenger: 'None', range: '159 km', lastUpdate: '12:42:01' },
  { id: 'OR-221', location: 'Šmartinska cesta', state: 'Returning to charge', battery: 28, color: 'returning', eta: '18 min', position: { lat: 46.0598, lng: 14.538 }, trips: 11, speed: '24 km/h', passenger: 'None', range: '68 km', lastUpdate: '12:41:54' },
  { id: 'OR-165', location: 'Celovška cesta', state: 'Needs attention', battery: 12, color: 'red', eta: '—', position: { lat: 46.071, lng: 14.477 }, trips: 7, speed: '0 km/h', passenger: 'None', range: '29 km', lastUpdate: '12:39:42' },
  { id: 'OR-198', location: 'Šubičeva ulica', state: 'On trip', battery: 73, color: 'green', eta: '6 min', position: { lat: 46.0518, lng: 14.505 }, trips: 16, speed: '28 km/h', passenger: '2 onboard', range: '181 km', lastUpdate: '12:41:47' },
  { id: 'OR-176', location: 'Vodnikova cesta', state: 'Available', battery: 91, color: 'blue', eta: '—', position: { lat: 46.0728, lng: 14.486 }, trips: 20, speed: '0 km/h', passenger: 'None', range: '226 km', lastUpdate: '12:42:05' },
  { id: 'OR-232', location: 'Roška cesta', state: 'Charging', battery: 46, color: 'amber', eta: '27 min', position: { lat: 46.0448, lng: 14.523 }, trips: 9, speed: '0 km/h', passenger: 'None', range: '112 km', lastUpdate: '12:40:36' },
  { id: 'OR-190', location: 'Tivolska cesta', state: 'On trip', battery: 58, color: 'green', eta: '9 min', position: { lat: 46.0595, lng: 14.493 }, trips: 14, speed: '35 km/h', passenger: '1 onboard', range: '143 km', lastUpdate: '12:41:28' },
]

type MapPosition = { left: number; top: number; lat: number; lng: number; angle: number }

const movementRoutes = [
  [{ left: 35, top: 35 }, { left: 47, top: 28 }, { left: 61, top: 42 }, { left: 52, top: 57 }],
  [{ left: 58, top: 52 }, { left: 48, top: 43 }, { left: 39, top: 51 }, { left: 45, top: 65 }],
  [{ left: 80, top: 28 }, { left: 69, top: 38 }, { left: 61, top: 30 }, { left: 72, top: 20 }],
  [{ left: 69, top: 80 }, { left: 58, top: 70 }, { left: 48, top: 76 }, { left: 56, top: 87 }],
  [{ left: 43, top: 54 }, { left: 35, top: 66 }, { left: 25, top: 60 }, { left: 31, top: 47 }],
  [{ left: 29, top: 40 }, { left: 21, top: 31 }, { left: 30, top: 23 }, { left: 39, top: 31 }],
  [{ left: 61, top: 78 }, { left: 72, top: 69 }, { left: 81, top: 78 }, { left: 71, top: 88 }],
  [{ left: 47, top: 24 }, { left: 57, top: 34 }, { left: 66, top: 25 }, { left: 56, top: 15 }],
]

function useVehiclePositions() {
  const [animationTime, setAnimationTime] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setAnimationTime(Date.now()), 100)
    return () => window.clearInterval(timer)
  }, [])

  return vehicles.map((vehicle, index): MapPosition => {
    const route = movementRoutes[index]
    const isMoving = vehicle.state === 'On trip' || vehicle.state === 'Returning to charge'
    if (!isMoving) {
      const left = 20 + (vehicle.position.lng - 14.472) / (14.548 - 14.472) * 65
      const top = 88 - (vehicle.position.lat - 46.042) / (46.079 - 46.042) * 75
      return { left, top, lat: vehicle.position.lat, lng: vehicle.position.lng, angle: 0 }
    }

    const duration = vehicle.state === 'On trip' ? 30000 : 42000
    const progress = ((animationTime + index * 1900) % duration) / duration * route.length
    const segment = Math.floor(progress) % route.length
    const segmentProgress = progress - Math.floor(progress)
    const start = route[segment]
    const end = route[(segment + 1) % route.length]
    const left = start.left + (end.left - start.left) * segmentProgress
    const top = start.top + (end.top - start.top) * segmentProgress
    const angle = Math.atan2(end.top - start.top, end.left - start.left) * 180 / Math.PI
    return {
      left,
      top,
      angle,
      lat: 46.079 - (top / 100) * (46.079 - 46.042),
      lng: 14.472 + (left / 100) * (14.548 - 14.472),
    }
  })
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [notice, setNotice] = useState(true)
  const [mapFullscreen, setMapFullscreen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className={`app-shell ${mapFullscreen ? 'map-fullscreen' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {!mapFullscreen && <aside className="sidebar">
        <div className="brand"><div className="brand-mark">o</div><span>orbit</span><button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarCollapsed ? '›' : '‹'}</button></div>
        <nav className="main-nav" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => <button className={`nav-item ${activeNav === item.label ? 'active' : ''}`} onClick={() => setActiveNav(item.label)} key={item.label}><Icon name={item.icon} />{item.label}{item.label === 'Fleet' && <span className="nav-count">24</span>}</button>)}
          <p className="nav-label nav-label-spaced">Manage</p>
          <button className="nav-item"><Icon name="settings" />Settings</button>
          <button className="nav-item"><Icon name="help" />Help center</button>
        </nav>
        <div className="sidebar-footer"><div className="profile-avatar">OM</div><div><strong>Lojze Potrebuješ</strong><small>Control operator</small></div><Icon name="more" /></div>
      </aside>}

      <main className="content">
        {activeNav === 'Live map' ? <MapPage fullscreen={mapFullscreen} onFullscreenChange={setMapFullscreen} /> : activeNav === 'Fleet' ? <FleetPage /> : activeNav === 'Passengers' ? <PassengersPage /> : <div className="page">
          <div className="page-heading"><div><p className="eyebrow">Monday, 14 October 2024 <span className="live-dot" /> Live operations</p><h1>Good morning, Lojze <span>✦</span></h1><p className="subheading">Here’s what’s happening across your robotaxi network.</p></div><button className="primary-button"><Icon name="plus" />Add vehicle</button></div>
          {notice && <div className="attention-banner"><div className="attention-icon"><Icon name="warning" /></div><div><strong>1 vehicle needs attention</strong><span>OR-165 has a low battery and is currently offline.</span></div><button onClick={() => setNotice(false)}>View vehicle <Icon name="arrow" /></button><button className="close-button" onClick={() => setNotice(false)} aria-label="Dismiss">×</button></div>}

          <section className="metrics-grid">
            <div className="metric-card"><div className="metric-top"><span>Active vehicles</span><span className="metric-icon green-bg"><Icon name="car" /></span></div><strong>18 <small>/ 24</small></strong><div className="metric-foot positive">↗ 8.4% <span>vs last week</span></div></div>
            <div className="metric-card"><div className="metric-top"><span>Trips today</span><span className="metric-icon purple-bg"><Icon name="route" /></span></div><strong>247</strong><div className="metric-foot positive">↗ 12.1% <span>vs last week</span></div></div>
            <div className="metric-card"><div className="metric-top"><span>Avg. response time</span><span className="metric-icon orange-bg">◷</span></div><strong>4.2 <small>min</small></strong><div className="metric-foot positive">↘ 0.8 min <span>vs last week</span></div></div>
            <div className="metric-card"><div className="metric-top"><span>Customer rating</span><span className="metric-icon yellow-bg">★</span></div><strong>4.86 <small>/ 5</small></strong><div className="metric-foot neutral">→ 0.02 <span>vs last week</span></div></div>
          </section>

          <section className="dashboard-grid overview-grid">
            <div className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest events from your fleet</p></div><button className="more-button" aria-label="More options"><Icon name="more" /></button></div><div className="activity-list"><Activity icon="green" title="Trip completed" detail="OR-204 · Passenger dropped off" time="2 min ago" /><Activity icon="blue" title="Vehicle available" detail="OR-187 · Ready for a new trip" time="8 min ago" /><Activity icon="amber" title="Charging started" detail="OR-221 · Tržaška cesta station" time="14 min ago" /><Activity icon="red" title="Vehicle offline" detail="OR-165 · Low battery warning" time="21 min ago" /></div><button className="view-all">View all activity <Icon name="arrow" /></button></div>
            <button className="panel map-panel overview-map-button" onClick={() => setActiveNav('Live map')} aria-label="Open live map"><span className="overview-route route-one" /><span className="overview-route route-two" /><span className="overview-route route-three" /><span className="overview-node node-one" /><span className="overview-node node-two" /><span className="overview-node node-three" /><span className="overview-map-content"><span className="overview-map-label">FLEET OVERVIEW</span><span className="overview-map-title">See your network in motion</span><span className="overview-map-copy">Open the live map to monitor every vehicle</span><span className="overview-map-link">Open live map <Icon name="arrow" /></span></span></button>
          </section>

          <section className="panel fleet-panel"><div className="panel-heading"><div><h2>Fleet status</h2><p>All vehicles in your network</p></div><button className="secondary-button">View fleet <Icon name="arrow" /></button></div><div className="table-wrap"><table><thead><tr><th>Vehicle</th><th>Location</th><th>Status</th><th>Battery</th><th>ETA</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle.id}><td><div className="vehicle-name"><span className={`vehicle-avatar ${vehicle.color}`}>▰</span><strong>{vehicle.id}</strong>{vehicle.color === 'red' && <span className="assistance-badge" title="Assistance required">!</span>}</div></td><td>{vehicle.location}</td><td><span className={`status ${vehicle.color}`}><i />{vehicle.state}</span></td><td><div className="battery"><span><i style={{ width: `${vehicle.battery}%` }} className={vehicle.color} /></span>{vehicle.battery}%</div></td><td>{vehicle.eta}</td><td><button className="row-more" aria-label={`More options for ${vehicle.id}`}><Icon name="more" /></button></td></tr>)}</tbody></table></div></section>
          <footer className="page-footer"><span>Orbit Control Center <b>·</b> v0.1.0</span><span><i className="live-dot" /> All systems operational</span></footer>
        </div>}
      </main>
    </div>
  )
}

function PassengersPage() {
  const [vehicleFilter, setVehicleFilter] = useState('All vehicles')
  const [resolvedTroubles, setResolvedTroubles] = useState<string[]>([])
  const reviews = [
    { id: 'review-1', passenger: 'Nina K.', vehicle: 'OR-204', rating: 5, text: 'Smooth ride and a very clean cabin. The arrival estimate was spot on.', time: '12 min ago' },
    { id: 'review-2', passenger: 'Matej R.', vehicle: 'OR-198', rating: 4, text: 'Comfortable trip, but the pickup point was a little confusing.', time: '34 min ago' },
    { id: 'review-3', passenger: 'Sara M.', vehicle: 'OR-165', rating: 2, text: 'The car arrived late and the cabin temperature was too warm.', time: '1 hr ago' },
    { id: 'review-4', passenger: 'Luka P.', vehicle: 'OR-190', rating: 5, text: 'Great experience. Quiet drive and friendly in-app updates.', time: '2 hrs ago' },
  ]
  const troubles = [
    { id: 'trouble-1', vehicle: 'OR-165', title: 'Cabin temperature issue', detail: 'Passenger reported a warm cabin during the trip.', severity: 'High', time: '1 hr ago' },
    { id: 'trouble-2', vehicle: 'OR-198', title: 'Pickup point confusion', detail: 'Passenger had trouble finding the vehicle at pickup.', severity: 'Medium', time: '34 min ago' },
    { id: 'trouble-3', vehicle: 'OR-204', title: 'No issues reported', detail: 'Trip feedback was positive with no follow-up needed.', severity: 'Resolved', time: '12 min ago' },
  ]
  const visibleReviews = vehicleFilter === 'All vehicles' ? reviews : reviews.filter((review) => review.vehicle === vehicleFilter)
  const openTroubles = troubles.filter((trouble) => trouble.severity !== 'Resolved' && !resolvedTroubles.includes(trouble.id))

  return <div className="page passengers-page">
    <div className="page-heading"><div><p className="eyebrow"><span className="live-dot" /> Passenger experience · Updated just now</p><h1>Passengers</h1><p className="subheading">Track reviews, ratings, and vehicle-specific issues from every trip.</p></div><button className="secondary-button"><Icon name="arrow" />Export feedback</button></div>
    <section className="metrics-grid passenger-metrics">
      <div className="metric-card"><div className="metric-top"><span>Average rating</span><span className="metric-icon yellow-bg">★</span></div><strong>4.86 <small>/ 5</small></strong><div className="metric-foot positive">↗ 0.12 <span>vs last month</span></div></div>
      <div className="metric-card"><div className="metric-top"><span>Reviews this week</span><span className="metric-icon purple-bg"><Icon name="users" /></span></div><strong>128</strong><div className="metric-foot positive">↗ 14.6% <span>vs last week</span></div></div>
      <div className="metric-card"><div className="metric-top"><span>Open troubles</span><span className="metric-icon orange-bg"><Icon name="warning" /></span></div><strong>{openTroubles.length}</strong><div className="metric-foot neutral">Across <span>2 vehicles</span></div></div>
      <div className="metric-card"><div className="metric-top"><span>Response rate</span><span className="metric-icon green-bg">↗</span></div><strong>96<small>%</small></strong><div className="metric-foot positive">↗ 3.2% <span>vs last month</span></div></div>
    </section>
    <section className="passenger-dashboard">
      <div className="panel reviews-panel"><div className="panel-heading"><div><h2>Passenger reviews</h2><p>Recent feedback linked to a vehicle</p></div><select className="feedback-filter" value={vehicleFilter} onChange={(event) => setVehicleFilter(event.target.value)} aria-label="Filter reviews by vehicle"><option>All vehicles</option>{vehicles.map((vehicle) => <option key={vehicle.id}>{vehicle.id}</option>)}</select></div><div className="rating-summary"><strong>4.86</strong><div><div className="rating-stars">★★★★★</div><span>Based on 1,284 passenger ratings</span></div><div className="rating-bars"><span>5 <i><b style={{ width: '86%' }} /></i></span><span>4 <i><b style={{ width: '10%' }} /></i></span><span>3 <i><b style={{ width: '3%' }} /></i></span><span>2 <i><b style={{ width: '1%' }} /></i></span><span>1 <i><b style={{ width: '0%' }} /></i></span></div></div><div className="review-list">{visibleReviews.map((review) => <article className="review-card" key={review.id}><div className="review-avatar">{review.passenger.charAt(0)}</div><div className="review-content"><div className="review-topline"><strong>{review.passenger}</strong><span>{review.vehicle}</span><time>{review.time}</time></div><div className="rating-stars small-stars">{'★'.repeat(review.rating)}<span>{'★'.repeat(5 - review.rating)}</span></div><p>{review.text}</p></div></article>)}</div></div>
      <div className="panel troubles-panel"><div className="panel-heading"><div><h2>Vehicle troubles</h2><p>Issues raised by passengers</p></div><span className="open-issue-count">{openTroubles.length} open</span></div><div className="trouble-list">{troubles.map((trouble) => { const resolved = trouble.severity === 'Resolved' || resolvedTroubles.includes(trouble.id); return <article className={`trouble-card ${resolved ? 'resolved' : ''}`} key={trouble.id}><div className={`trouble-icon ${resolved ? 'green-bg' : trouble.severity === 'High' ? 'red' : 'amber'}`}><Icon name={resolved ? 'arrow' : 'warning'} /></div><div className="trouble-content"><div className="trouble-heading"><strong>{trouble.title}</strong><span className={`trouble-severity ${resolved ? 'resolved' : trouble.severity.toLowerCase()}`}>{resolved ? 'Resolved' : trouble.severity}</span></div><p>{trouble.detail}</p><small><b>{trouble.vehicle}</b> · {trouble.time}</small>{!resolved && <button onClick={() => setResolvedTroubles((current) => [...current, trouble.id])}>Mark resolved <Icon name="arrow" /></button>}</div></article> })}</div></div>
    </section>
  </div>
}

function FleetPage() {
  return <div className="page fleet-page">
    <div className="page-heading"><div><p className="eyebrow"><span className="live-dot" /> Live fleet data</p><h1>Fleet</h1><p className="subheading">Every vehicle, status, and operational detail in one place.</p></div><button className="primary-button"><Icon name="plus" />Add vehicle</button></div>
    <section className="metrics-grid fleet-metrics"><div className="metric-card"><div className="metric-top"><span>Available vehicles</span><span className="metric-icon blue-bg"><Icon name="car" /></span></div><strong>2</strong><div className="metric-foot positive">Ready for trips <span>now</span></div></div><div className="metric-card"><div className="metric-top"><span>Charging</span><span className="metric-icon orange-bg">◷</span></div><strong>1</strong><div className="metric-foot neutral">OR-232 <span>at charging station</span></div></div><div className="metric-card"><div className="metric-top"><span>Needs attention</span><span className="metric-icon yellow-bg"><Icon name="warning" /></span></div><strong>1</strong><div className="metric-foot neutral">OR-165 <span>assistance required</span></div></div><div className="metric-card"><div className="metric-top"><span>On trip</span><span className="metric-icon green-bg"><Icon name="route" /></span></div><strong>3</strong><div className="metric-foot positive">Passengers onboard <span>now</span></div></div></section>
    <section className="panel fleet-panel fleet-full-panel"><div className="panel-heading"><div><h2>All vehicles</h2><p>Live operational data · Updated just now</p></div><div className="fleet-actions"><button className="secondary-button"><Icon name="filter" />Filter</button><button className="secondary-button">Export <Icon name="arrow" /></button></div></div><div className="table-wrap"><table className="full-fleet-table"><thead><tr><th>Vehicle</th><th>Location</th><th>Status</th><th>Battery</th><th>Speed</th><th>Passenger</th><th>Range</th><th>Trips today</th><th>Last update</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle.id}><td><div className="vehicle-name"><span className={`vehicle-avatar ${vehicle.color}`}>▰</span><strong>{vehicle.id}</strong>{vehicle.color === 'red' && <span className="assistance-badge" title="Assistance required">!</span>}</div></td><td>{vehicle.location}</td><td><span className={`status ${vehicle.color}`}><i />{vehicle.state}</span></td><td><div className="battery"><span><i style={{ width: `${vehicle.battery}%` }} className={vehicle.color} /></span>{vehicle.battery}%</div></td><td>{vehicle.speed}</td><td>{vehicle.passenger}</td><td>{vehicle.range}</td><td>{vehicle.trips}</td><td>{vehicle.lastUpdate}</td><td><button className="row-more" aria-label={`More options for ${vehicle.id}`}><Icon name="more" /></button></td></tr>)}</tbody></table></div></section>
  </div>
}

function MapPage({ fullscreen, onFullscreenChange }: { fullscreen: boolean; onFullscreenChange: (fullscreen: boolean) => void }) {
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0])
  const [statusFilter, setStatusFilter] = useState('All')
  const [zoom, setZoom] = useState(1)
  const [showTraffic, setShowTraffic] = useState(false)
  const [dispatchSent, setDispatchSent] = useState(false)
  const [activePanel, setActivePanel] = useState<'stats' | 'activity' | null>(null)
  const filters = ['All', 'On trip', 'Available', 'Returning to charge', 'Needs attention']
  const filteredVehicles = vehicles.filter((vehicle) => statusFilter === 'All' || vehicle.state === statusFilter)

  return <div className="map-page">
    <div className="map-page-heading">
      <div><p className="eyebrow"><span className="live-dot" /> Live operations <b>·</b> Updated just now</p><h1>Live map</h1><p className="subheading">Monitor and assist every vehicle across Ljubljana.</p></div>
      <div className="map-heading-actions"><button className={`map-tool-button ${showTraffic ? 'selected' : ''}`} onClick={() => setShowTraffic(!showTraffic)}><Icon name="layers" />{showTraffic ? 'Hide traffic' : 'Traffic layer'}</button><button className="map-tool-button" onClick={() => onFullscreenChange(!fullscreen)}><Icon name={fullscreen ? 'collapse' : 'expand'} />{fullscreen ? 'Exit map' : 'Fullscreen map'}</button><button className="primary-button" onClick={() => setDispatchSent(false)}><Icon name="plus" />Dispatch trip</button></div>
    </div>
    <div className="map-workspace">
      <section className={`map-canvas ${showTraffic ? 'traffic-on' : ''}`}>
        {fullscreen && <button className="map-exit-button" onClick={() => onFullscreenChange(false)}><Icon name="collapse" />Show dashboard</button>}
        <div className="map-canvas-toolbar"><div className="map-search"><Icon name="search" /><input aria-label="Search map" placeholder="Search address or vehicle" /></div><div className="map-toolbar-buttons"><button onClick={() => setShowTraffic(!showTraffic)} className={showTraffic ? 'active' : ''} aria-label="Toggle layers"><Icon name="layers" /></button><button onClick={() => setZoom(Math.min(1.3, zoom + .1))} aria-label="Zoom in"><Icon name="zoomIn" /></button><button onClick={() => setZoom(Math.max(.8, zoom - .1))} aria-label="Zoom out"><Icon name="zoomOut" /></button><button onClick={() => setZoom(1)} aria-label="Center map"><Icon name="locate" /></button></div></div>
        <div className="map-stat-dock"><button className={activePanel === 'stats' ? 'active' : ''} onClick={() => setActivePanel(activePanel === 'stats' ? null : 'stats')}><Icon name="grid" />Fleet stats</button><button className={activePanel === 'activity' ? 'active' : ''} onClick={() => setActivePanel(activePanel === 'activity' ? null : 'activity')}><Icon name="route" />Activity</button><button className={showTraffic ? 'active' : ''} onClick={() => setShowTraffic(!showTraffic)}><Icon name="layers" />Traffic</button></div>
        {activePanel === 'stats' && <div className="map-floating-panel stats-floating-panel"><div className="floating-heading"><div><strong>Fleet at a glance</strong><small>Live network status</small></div><button onClick={() => setActivePanel(null)}>×</button></div><div className="floating-stat-grid"><div><strong>18</strong><span>On trip</span></div><div><strong>7</strong><span>Available</span></div><div><strong>3</strong><span>Charging</span></div><div><strong>1</strong><span>Attention</span></div></div><div className="floating-progress"><span><i style={{ width: '75%' }} /></span><small>75% of fleet active</small></div></div>}
        {activePanel === 'activity' && <div className="map-floating-panel activity-floating-panel"><div className="floating-heading"><div><strong>Recent activity</strong><small>Latest fleet events</small></div><button onClick={() => setActivePanel(null)}>×</button></div><Activity icon="green" title="Trip completed" detail="OR-204 · 2 min ago" time="" /><Activity icon="blue" title="Vehicle available" detail="OR-187 · 8 min ago" time="" /><Activity icon="amber" title="Charging started" detail="OR-221 · 14 min ago" time="" /></div>}
        <GoogleMapSurface showTraffic={showTraffic} selectedVehicle={selectedVehicle} onVehicleSelect={setSelectedVehicle} zoom={zoom} />
        <div className="large-map-legend"><span><i className="pin-green" />On trip</span><span><i className="pin-blue" />Available</span><span><i className="pin-returning" />Returning</span><span><i className="pin-red" />Attention</span></div>
        <div className="map-scale">500 m</div>
      </section>
      <aside className="map-sidebar">
        <div className="fleet-sidebar-heading"><div><h2>Fleet vehicles</h2><p>{filteredVehicles.length} vehicles shown</p></div><button className="filter-button"><Icon name="filter" />Filter</button></div>
        <div className="filter-tabs">{filters.map((filter) => <button key={filter} className={statusFilter === filter ? 'active' : ''} onClick={() => setStatusFilter(filter)}>{filter}</button>)}</div>
        <div className="map-vehicle-list">{filteredVehicles.map((vehicle) => <button className={`map-vehicle-row ${selectedVehicle.id === vehicle.id ? 'selected' : ''}`} key={vehicle.id} onClick={() => setSelectedVehicle(vehicle)}><span className={`vehicle-avatar ${vehicle.color}`}>▰</span><span className="map-vehicle-info"><strong>{vehicle.id}{vehicle.color === 'red' && <span className="assistance-badge" title="Assistance required">!</span>}</strong><small>{vehicle.location}</small></span><span className={`status ${vehicle.color}`}><i />{vehicle.state}</span></button>)}</div>
        <div className="selected-vehicle"><div className="selected-vehicle-heading"><div><span className={`vehicle-avatar ${selectedVehicle.color}`}>▰</span><div><strong>{selectedVehicle.id}{selectedVehicle.color === 'red' && <span className="assistance-badge" title="Assistance required">!</span>}</strong><small>{selectedVehicle.state} · {selectedVehicle.location}</small></div></div><button aria-label="More vehicle options"><Icon name="more" /></button></div><div className="selected-details"><div><span>Battery</span><strong>{selectedVehicle.battery}%</strong></div><div><span>Passenger</span><strong>{selectedVehicle.state === 'On trip' ? '1 onboard' : 'None'}</strong></div><div><span>Next stop</span><strong>{selectedVehicle.eta === '—' ? 'Available' : selectedVehicle.eta}</strong></div></div><button className="assist-button" onClick={() => setDispatchSent(true)}>{dispatchSent ? 'Assistance request sent' : 'Contact vehicle'} <Icon name="arrow" /></button></div>
      </aside>
    </div>
  </div>
}

function GoogleMapSurface({ showTraffic, selectedVehicle, onVehicleSelect, zoom }: { showTraffic: boolean; selectedVehicle: typeof vehicles[number]; onVehicleSelect: (vehicle: typeof vehicles[number]) => void; zoom: number }) {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null)
  const [mapError, setMapError] = useState('')
  const positions = useVehiclePositions()
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !mapElement.current) return
    setOptions({ key: apiKey, v: 'weekly' })
    importLibrary('maps').then(({ Map }) => {
      if (!mapElement.current) return
      mapRef.current = new Map(mapElement.current, {
        center: { lat: 46.0569, lng: 14.5058 },
        zoom: 13,
        disableDefaultUI: true,
        clickableIcons: false,
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      })
      markersRef.current = vehicles.map((vehicle) => {
        const marker = new google.maps.Marker({ map: mapRef.current, position: vehicle.position, title: vehicle.id, icon: vehicleMarkerIcon(vehicle.color) })
        marker.addListener('click', () => onVehicleSelect(vehicle))
        return marker
      })
      trafficRef.current = new google.maps.TrafficLayer()
      trafficRef.current.setMap(showTraffic ? mapRef.current : null)
    }).catch(() => setMapError('Google Maps could not load. Check your API key and enabled APIs.'))
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      trafficRef.current?.setMap(null)
    }
  }, [apiKey])

  useEffect(() => {
    positions.forEach((position, index) => markersRef.current[index]?.setPosition({ lat: position.lat, lng: position.lng }))
  }, [positions])

  useEffect(() => {
    if (mapRef.current) mapRef.current.setZoom(13 + Math.round((zoom - 1) * 3))
    if (trafficRef.current) trafficRef.current.setMap(showTraffic ? mapRef.current : null)
  }, [showTraffic, zoom])

  useEffect(() => {
    markersRef.current.forEach((marker) => marker.setAnimation(marker.getTitle() === selectedVehicle.id ? google.maps.Animation.BOUNCE : null))
  }, [selectedVehicle])

  if (!apiKey) return <MockMap positions={positions} />
  return <div className="google-map-container"><div ref={mapElement} className="google-map" />{mapError && <div className="map-load-error">{mapError}</div>}</div>
}

function MockMap({ positions }: { positions: MapPosition[] }) {
  return <div className="large-map"><div className="map-stage"><div className="city-water" /><div className="city-park park-one" /><div className="city-park park-two" /><div className="large-road lr-one" /><div className="large-road lr-two" /><div className="large-road lr-three" /><div className="large-road lr-four" /><div className="large-road lr-five" /><span className="city-label city-center">CENTER</span><span className="city-label city-bezigrad">BEŽIGRAD</span><span className="city-label city-trnovo">TRNOVO</span><span className="city-label city-siska">ŠIŠKA</span>{vehicles.map((vehicle, index) => <span key={vehicle.id} className={`large-map-car ${vehicle.color}`} style={{ left: `${positions[index].left}%`, top: `${positions[index].top}%`, transform: `rotate(${positions[index].angle}deg)` }}><span className="car-roof" /><i className="car-wheel left" /><i className="car-wheel right" />{vehicle.color === 'red' && <b className="map-warning-badge">!</b>}</span>)}</div><div className="map-provider-notice">Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to use Google Maps</div></div>
}

function Activity({ icon, title, detail, time }: { icon: string; title: string; detail: string; time: string }) {
  return <div className="activity-row"><span className={`activity-icon ${icon}`}>▰</span><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>
}

export default App
