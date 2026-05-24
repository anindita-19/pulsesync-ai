/**
 * Medical Reports Page
 * Drag-and-drop upload, Cloudinary via backend, dynamic report list
 */
import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  FileText, Upload, X, Eye, Trash2, Download, Filter,
  Search, CheckCircle, Clock, AlertCircle, Plus, MoreVertical,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import reportsService from '@/services/reportsService'
import { QUERY_KEYS, ACCEPTED_REPORT_TYPES, MAX_FILE_SIZE, REPORT_TYPES } from '@/constants'
import EmptyState from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useNotification } from '@/context/NotificationContext'

// ─── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ file, onClose, onUploaded }) {
  const [metadata, setMetadata] = useState({
    reportType: '',
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    doctorName: '',
    hospitalName: '',
  })
  const [progress, setProgress] = useState(0)
  const { toast } = useNotification()

  const uploadMutation = useMutation({
    mutationFn: () => reportsService.uploadReport(file, metadata, setProgress),
    onSuccess: (data) => {
      toast.success('Report uploaded and saved successfully!', { title: 'Upload Complete' })
      onUploaded(data)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Upload failed. Please try again.', { title: 'Upload Error' })
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-slate-900">Upload Report</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File preview */}
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl p-3 mb-5">
          <FileText className="w-8 h-8 text-teal-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        {/* Metadata form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Report Type *</label>
            <select
              value={metadata.reportType}
              onChange={(e) => setMetadata((p) => ({ ...p, reportType: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white"
            >
              <option value="">Select type...</option>
              {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Report Date *</label>
            <input
              type="date"
              value={metadata.reportDate}
              onChange={(e) => setMetadata((p) => ({ ...p, reportDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Doctor Name</label>
            <input
              type="text"
              value={metadata.doctorName}
              onChange={(e) => setMetadata((p) => ({ ...p, doctorName: e.target.value }))}
              placeholder="Dr. Smith"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={metadata.notes}
              onChange={(e) => setMetadata((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white resize-none"
            />
          </div>
        </div>

        {/* Progress */}
        {uploadMutation.isPending && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} disabled={uploadMutation.isPending} className="flex-1 btn-secondary text-sm py-2.5">
            Cancel
          </button>
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!metadata.reportType || !metadata.reportDate || uploadMutation.isPending}
            className="flex-1 btn-primary text-sm py-2.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploadMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Analyzed' },
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
    processing: { icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50', label: 'Processing' },
    failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
  }
  const status = statusConfig[report.analysis_status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-5 hover:shadow-glow transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{report.report_type}</p>
            <p className="text-xs text-slate-400">
              {report.report_date ? format(new Date(report.report_date), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden w-36"
              >
                <a href={report.file_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <Eye className="w-4 h-4" /> View
                </a>
                <a href={report.file_url} download
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  onClick={() => { onDelete(report._id); setMenuOpen(false) }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {report.doctor_name && (
        <p className="text-xs text-slate-500 mb-2">Dr. {report.doctor_name}</p>
      )}
      {report.notes && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.notes}</p>
      )}

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
        <span className="text-xs text-slate-400">
          {report.file_size ? `${(report.file_size / 1024).toFixed(0)} KB` : ''}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicalReportsPage() {
  const [pendingFile, setPendingFile] = useState(null)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { toast } = useNotification()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.REPORTS, filter, search, page],
    queryFn: () => reportsService.getReports({ type: filter || null, search: search || null, page }),
  })

  const deleteMutation = useMutation({
    mutationFn: reportsService.deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS] })
      toast.success('Report deleted')
    },
    onError: () => toast.error('Failed to delete report'),
  })

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0]
      if (err.code === 'file-too-large') toast.error('File is too large. Max 20MB.')
      else if (err.code === 'file-invalid-type') toast.error('Only PDF and image files are accepted.')
      else toast.error('File rejected: ' + err.message)
      return
    }
    if (acceptedFiles.length > 0) {
      setPendingFile(acceptedFiles[0])
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_REPORT_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  const reports = data?.reports || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 10)

  const handleUploaded = () => {
    setPendingFile(null)
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REPORTS] })
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD] })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Upload modal */}
      <AnimatePresence>
        {pendingFile && (
          <UploadModal
            file={pendingFile}
            onClose={() => setPendingFile(null)}
            onUploaded={handleUploaded}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Medical Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} report{total !== 1 ? 's' : ''} in your vault</p>
        </div>
      </motion.div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-6 ${
          isDragActive
            ? 'border-teal-400 bg-teal-50 scale-[1.01]'
            : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-center mx-auto mb-4"
        >
          <Upload className={`w-7 h-7 ${isDragActive ? 'text-teal-600' : 'text-teal-400'}`} />
        </motion.div>
        <p className="font-semibold text-slate-700 mb-1">
          {isDragActive ? 'Drop your report here' : 'Drag & drop your medical report'}
        </p>
        <p className="text-sm text-slate-400">Supports PDF, JPG, PNG, WEBP · Max 20MB</p>
        <button type="button" className="mt-4 btn-primary text-sm py-2 px-5 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Browse Files
        </button>
      </motion.div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 text-sm text-slate-600 placeholder-slate-400 outline-none bg-transparent"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1) }}
            className="text-sm text-slate-600 outline-none bg-transparent"
          >
            <option value="">All Types</option>
            {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Report Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports uploaded yet"
          description="Upload your first medical report — lab tests, prescriptions, scans, or any health document."
        />
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((r) => (
                <ReportCard
                  key={r._id}
                  report={r}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm btn-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm btn-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
