/**
 * Nearby Hospitals Page
 * Real location-based hospital discovery
 * Uses browser Geolocation API + backend Places service
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Clock, Star, Navigation, AlertCircle,
  Search, Filter, Stethoscope, Heart, Brain, Bone,
  Eye, Baby, Loader2, ExternalLink,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import hospitalsService from '@/services/hospitalsService'
import EmptyState from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

// ─── Specialist icon map ───────────────────────────────────────────────────────
const SPECIALIST_ICONS = {
  cardiologist: Heart,
  neurologist: Brain,
  orthopedic: Bone,
  ophthalmologist: Eye,
  pediatrician: Baby,
  general: Stethoscope,
}

// ─── Hospital Card ─────────────────────────────────────────────────────────────
function HospitalCard({ hospital, isEmergency }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 hover:shadow-glow transition-all duration-300 ${isEmergency ? 'border-l-4 border-red-400' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display font-semibold text-slate-800 text-sm">{hospital.name}</h3>
            {isEmergency && (
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Emergency
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {hospital.address}
          </p>
        </div>
        {hospital.distance_km && (
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full whitespace-nowrap">
            {hospital.distance_km} km
          </span>
        )}
      </div>

      {/* Rating & type */}
      <div className="flex items-center gap-3 mb-3">
        {hospital.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-slate-700">{hospital.rating}</span>
          </div>
        )}
        {hospital.type && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {hospital.type}
          </span>
        )}
        {hospital.open_now !== undefined && (
          <span className={`text-xs font-semibold ${hospital.open_now ? 'text-emerald-600' : 'text-red-500'}`}>
            {hospital.open_now ? '● Open' : '● Closed'}
          </span>
        )}
      </div>

      {/* Specialists */}
      {hospital.specialists && hospital.specialists.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hospital.specialists.slice(0, 4).map((spec) => {
            const Icon = SPECIALIST_ICONS[spec.toLowerCase()] || Stethoscope
            return (
              <span key={spec} className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                <Icon className="w-3 h-3" />
                {spec}
              </span>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {hospital.phone && (
          <a href={`tel:${hospital.phone}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
        )}
        {hospital.maps_url && (
          <a href={hospital.maps_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">
            <Navigation className="w-3.5 h-3.5" />
            Directions
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ─── Location Permission Banner ────────────────────────────────────────────────
function LocationBanner({ onAllow, status }) {
  if (status === 'granted' || status === 'loading') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-100 mb-5"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Navigation className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 text-sm">Enable Location Access</p>
          <p className="text-xs text-slate-500 mt-0.5">Allow location access to find hospitals near you</p>
        </div>
        <button onClick={onAllow} className="btn-primary text-sm py-2 px-4">
          Allow
        </button>
      </div>
      {status === 'denied' && (
        <p className="text-xs text-red-500 mt-3">
          Location access was denied. Please enable it in your browser settings to use this feature.
        </p>
      )}
    </motion.div>
  )
}

// ─── Specialist Card ───────────────────────────────────────────────────────────
function SpecialistCard({ recommendation }) {
  const Icon = SPECIALIST_ICONS[recommendation.specialty?.toLowerCase()] || Stethoscope
  return (
    <div className="glass-card p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-teal-500" />
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-sm">{recommendation.specialty}</p>
        <p className="text-xs text-slate-500 mt-0.5">{recommendation.reason}</p>
        {recommendation.urgency && (
          <span className={`text-xs mt-1.5 inline-block font-semibold px-2 py-0.5 rounded-full ${
            recommendation.urgency === 'urgent' ? 'bg-red-100 text-red-600' :
            recommendation.urgency === 'soon' ? 'bg-amber-100 text-amber-600' :
            'bg-teal-100 text-teal-600'
          }`}>
            {recommendation.urgency === 'urgent' ? 'See urgently' : recommendation.urgency === 'soon' ? 'See soon' : 'Routine visit'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NearbyHospitalsPage() {
  const [locationStatus, setLocationStatus] = useState('idle') // idle | loading | granted | denied
  const [coords, setCoords] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  const requestLocation = () => {
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationStatus('granted')
      },
      () => setLocationStatus('denied'),
      { timeout: 10000 }
    )
  }

  // Auto-request on mount
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') requestLocation()
    })
  }, [])

  const { data: hospitalsData, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['hospitals', coords?.lat, coords?.lng, search, filterType],
    queryFn: () =>
      search
        ? hospitalsService.searchHospitals({ query: search, lat: coords?.lat, lng: coords?.lng })
        : hospitalsService.getNearbyHospitals({ lat: coords?.lat, lng: coords?.lng, type: filterType || null }),
    enabled: !!coords || !!search,
  })

  const { data: emergencyData } = useQuery({
    queryKey: ['emergency-hospitals', coords?.lat, coords?.lng],
    queryFn: () => hospitalsService.getEmergencyHospitals({ lat: coords?.lat, lng: coords?.lng }),
    enabled: !!coords,
  })

  const { data: specialistData } = useQuery({
    queryKey: ['specialist-recommendations', coords?.lat, coords?.lng],
    queryFn: () => hospitalsService.getSpecialistRecommendations({ lat: coords?.lat, lng: coords?.lng }),
    enabled: !!coords,
  })

  const hospitals = hospitalsData?.hospitals || []
  const emergencyHospitals = emergencyData?.hospitals || []
  const specialistRecs = specialistData?.recommendations || []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display font-bold text-2xl text-slate-900">Nearby Healthcare</h1>
        <p className="text-slate-500 text-sm mt-0.5">Hospitals, clinics, and specialist recommendations near you</p>
      </motion.div>

      {/* Location banner */}
      <LocationBanner status={locationStatus} onAllow={requestLocation} />

      {/* Loading location */}
      {locationStatus === 'loading' && (
        <div className="flex items-center gap-3 text-sm text-slate-500 mb-5">
          <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
          Detecting your location...
        </div>
      )}

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals by name or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm text-slate-600 placeholder-slate-400 outline-none bg-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none"
        >
          <option value="">All Types</option>
          <option value="hospital">Hospital</option>
          <option value="clinic">Clinic</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Emergency hospitals */}
          {emergencyHospitals.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Emergency Care Nearby
              </h2>
              <div className="space-y-3">
                {emergencyHospitals.map((h, i) => (
                  <HospitalCard key={h.place_id || i} hospital={h} isEmergency />
                ))}
              </div>
            </div>
          )}

          {/* All hospitals */}
          <div>
            <h2 className="font-display font-semibold text-slate-800 mb-3 text-sm">
              {search ? 'Search Results' : 'Nearby Hospitals & Clinics'}
            </h2>

            {!coords && !search ? (
              <EmptyState
                icon={MapPin}
                title="Location required"
                description="Allow location access or search by name to find nearby hospitals."
                action={requestLocation}
                actionLabel="Enable Location"
              />
            ) : hospitalsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card p-5">
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : hospitals.length === 0 ? (
              <EmptyState icon={MapPin} title="No hospitals found" description="Try adjusting your search or expanding the radius." />
            ) : (
              <div className="space-y-3">
                {hospitals.map((h, i) => (
                  <HospitalCard key={h.place_id || i} hospital={h} isEmergency={false} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: specialist recommendations */}
        <div className="space-y-4">
          {/* Map placeholder */}
          <div className="glass-card overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-teal-50 to-sky-50 flex items-center justify-center border-b border-slate-100">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-teal-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  {coords ? 'Map view available with Google Maps API key' : 'Enable location to view map'}
                </p>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-500 text-center">
                Configure <code className="bg-slate-100 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code> to enable interactive maps
              </p>
            </div>
          </div>

          {/* Specialist recommendations */}
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-500" />
              AI Specialist Recommendations
            </h3>
            {!coords ? (
              <p className="text-xs text-slate-400 text-center py-3">Enable location for personalized recommendations</p>
            ) : specialistData === undefined ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : specialistRecs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">No specialist recommendations based on your profile</p>
            ) : (
              <div className="space-y-3">
                {specialistRecs.map((r, i) => <SpecialistCard key={i} recommendation={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
