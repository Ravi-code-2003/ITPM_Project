import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  X,
  Upload,
  FileText,
  Youtube,
  FolderOpen,
  Trash2,
  Eye,
  Download,
  Link2,
  BookMarked,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Inbox,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ── constants ─────────────────────────────────────────────────────────── */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MATERIAL_TYPES = [
  { value: 'pdf',       label: 'PDF Document', icon: FileText,   color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  { value: 'tute',      label: 'Tutorial',     icon: BookMarked, color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { value: 'pastpaper', label: 'Past Paper',   icon: FileCheck,  color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { value: 'youtube',   label: 'YouTube Link', icon: Youtube,    color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20' },
  { value: 'drive',     label: 'Google Drive', icon: FolderOpen, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
];

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pdf',       label: 'PDFs' },
  { key: 'tute',      label: 'Tutorials' },
  { key: 'pastpaper', label: 'Past Papers' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'drive',     label: 'Drive' },
];

const EMPTY_FORM = {
  type: 'pdf',
  title: '',
  description: '',
  course: '',
  linkUrl: '',
  file: null,
};

/* ── helpers ────────────────────────────────────────────────────────────── */
const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const typeInfo = (type) => MATERIAL_TYPES.find((t) => t.value === type) || MATERIAL_TYPES[0];

const MAT_TYPE_LABELS = {
  'lecture-notes': 'Lecture Notes',
  'tutorial':      'Tutorial',
  'past-paper':    'Past Paper',
  'assignment':    'Assignment',
  'other':         'Other',
};

const REQ_STATUS_CFG = {
  pending:   { label: 'Pending',   icon: Clock,        color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20',  border: 'border-yellow-200 dark:border-yellow-700' },
  fulfilled: { label: 'Fulfilled', icon: CheckCircle,  color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20',    border: 'border-green-200 dark:border-green-700'  },
  rejected:  { label: 'Rejected',  icon: XCircle,      color: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20',        border: 'border-red-200 dark:border-red-700'      },
};

const ReqStatusBadge = ({ status }) => {
  const cfg = REQ_STATUS_CFG[status] || REQ_STATUS_CFG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
};

/* ── component ──────────────────────────────────────────────────────────── */
const EducationProviderDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [materials, setMaterials]  = useState([]);
  const [loading, setLoading]      = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter]        = useState('all');
  const [form, setForm]            = useState(EMPTY_FORM);
  const [fileError, setFileError]  = useState('');
  const fileInputRef = useRef(null);

  const [studentCount, setStudentCount]   = useState(0);

  // Student requests
  const [requests, setRequests]           = useState([]);
  const [loadingReq, setLoadingReq]       = useState(false);
  const [statusModal, setStatusModal]     = useState(null); // { request }
  const [statusForm, setStatusForm]       = useState({ status: 'pending', adminNote: '' });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [reqFilter, setReqFilter]         = useState('all');

  const isFileType = ['pdf', 'tute', 'pastpaper'].includes(form.type);
  const isLinkType = ['youtube', 'drive'].includes(form.type);

  /* fetch materials */
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/education/materials');
      setMaterials(res.data.materials || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  /* fetch total student count */
  useEffect(() => {
    api.get('/education/materials/student-count')
      .then((res) => setStudentCount(res.data.count || 0))
      .catch(() => setStudentCount(0));
  }, []);

  /* fetch student requests */
  const fetchRequests = useCallback(async () => {
    setLoadingReq(true);
    try {
      const res = await api.get('/education/requests/all');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingReq(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  /* update request status */
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      await api.put(`/education/requests/${statusModal.request._id}`, statusForm);
      toast.success('Status updated successfully');
      setStatusModal(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusModal = (request) => {
    setStatusModal({ request });
    setStatusForm({ status: request.status, adminNote: request.adminNote || '' });
  };

  /* form helpers */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTypeChange = (type) => {
    setForm((f) => ({ ...f, type, file: null, linkUrl: '' }));
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(
        `File too large. Max is 10 MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`
      );
      return;
    }
    setFileError('');
    setForm((f) => ({ ...f, file }));
  };

  /* drag-and-drop */
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate the same validation as handleFileChange
      const fakeEvent = { target: { files: [file] } };
      handleFileChange(fakeEvent);
    }
  };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())                      { toast.error('Please enter a title'); return; }
    if (isFileType && !form.file)                { toast.error('Please select a PDF file'); return; }
    if (isLinkType && !form.linkUrl.trim())      { toast.error('Please enter a URL'); return; }
    if (fileError)                               { toast.error(fileError); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('type',        form.type);
      fd.append('course',      form.course.trim());
      if (isFileType) fd.append('file', form.file);
      else            fd.append('linkUrl', form.linkUrl.trim());

      await api.post('/education/materials', fd);
      toast.success('Material uploaded successfully!');
      setShowModal(false);
      resetForm();
      fetchMaterials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* delete */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await api.delete(`/education/materials/${id}`);
      toast.success('Material deleted');
      setMaterials((m) => m.filter((x) => x._id !== id));
    } catch {
      toast.error('Failed to delete material');
    }
  };

  const filteredMaterials =
    filter === 'all' ? materials : materials.filter((m) => m.type === filter);

  /* ── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">
              Education Provider Dashboard
            </h1>
            <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">
              Manage your courses and study materials
            </p>
          </div>

          {/* ── CTA button ─── */}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="h-5 w-5" />
            Upload Study Material
          </button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Uploaded Materials', value: materials.length,  Icon: Upload,        iconBg: 'bg-accent/20',                        iconColor: 'text-primary dark:text-accent' },
            { label: 'Total Students',     value: studentCount,      Icon: Users,         iconBg: 'bg-blue-100 dark:bg-blue-900/30',      iconColor: 'text-blue-600 dark:text-blue-400' },
            { label: 'Materials',          value: materials.length,  Icon: FileText,      iconBg: 'bg-purple-100 dark:bg-purple-900/30',  iconColor: 'text-purple-600 dark:text-purple-400' },
            { label: 'Rating',             value: '4.8',             Icon: GraduationCap, iconBg: 'bg-green-100 dark:bg-green-900/30',    iconColor: 'text-green-600 dark:text-green-400' },
          ].map(({ label, value, Icon, iconBg, iconColor }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-secondary dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-primary dark:text-gray-100 mt-0.5">{value}</p>
                  </div>
                  <div className={`${iconBg} p-2.5 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Materials section ──────────────────────────────────────── */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <CardTitle>Study Materials</CardTitle>
              {/* filter pills */}
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filter === key
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              /* loader */
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
              </div>
            ) : filteredMaterials.length === 0 ? (
              /* empty state */
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-secondary dark:text-gray-400 text-sm">
                  {filter === 'all'
                    ? 'No materials yet. Click "Upload Study Material" to add one.'
                    : `No ${FILTERS.find((f) => f.key === filter)?.label} found.`}
                </p>
              </div>
            ) : (
              /* materials grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMaterials.map((mat) => {
                  const info = typeInfo(mat.type);
                  const Icon = info.icon;
                  return (
                    <div
                      key={mat._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow group bg-white dark:bg-gray-800"
                    >
                      {/* top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-2 rounded-lg ${info.bg} flex-shrink-0`}>
                          <Icon className={`h-5 w-5 ${info.color}`} />
                        </div>
                        <button
                          onClick={() => handleDelete(mat._id)}
                          title="Delete material"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* content */}
                      <div className="mt-3">
                        <p className="font-semibold text-primary dark:text-gray-100 text-sm line-clamp-2">
                          {mat.title}
                        </p>
                        {mat.description && (
                          <p className="text-xs text-secondary dark:text-gray-400 mt-1 line-clamp-2">
                            {mat.description}
                          </p>
                        )}
                        {mat.course && (
                          <span className="inline-block mt-2 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                            {mat.course}
                          </span>
                        )}
                      </div>

                      {/* footer */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                        <span className="text-xs text-secondary dark:text-gray-500">{info.label}</span>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {mat.fileSize && (
                            <span className="text-xs text-secondary dark:text-gray-500">
                              {formatSize(mat.fileSize)}
                            </span>
                          )}
                          {mat.fileUrl && (
                            <a
                              href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${mat.fileUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" /> View
                            </a>
                          )}
                          {mat.linkUrl && (
                            <a
                              href={mat.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-accent hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" /> Open
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        {/* ── Student Requests Table ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Inbox className="h-5 w-5 text-accent" />
                <CardTitle>Student Material Requests</CardTitle>
              </div>
              {/* filter pills */}
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'fulfilled', 'rejected'].map((key) => (
                  <button
                    key={key}
                    onClick={() => setReqFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                      reqFilter === key
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {key === 'all' ? `All (${requests.length})` : `${key.charAt(0).toUpperCase() + key.slice(1)} (${requests.filter(r => r.status === key).length})`}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loadingReq ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-14">
                <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-secondary dark:text-gray-400 text-sm">No student requests yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Student</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Request</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Course</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Date</th>
                      <th className="py-3 px-4 text-xs font-semibold text-secondary dark:text-gray-400 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {(reqFilter === 'all' ? requests : requests.filter((r) => r.status === reqFilter)).map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-primary dark:text-gray-100 text-sm">{req.student?.fullName || '—'}</p>
                          <p className="text-xs text-secondary dark:text-gray-500">{req.student?.email || ''}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-primary dark:text-gray-100 line-clamp-1">{req.title}</p>
                          {req.description && (
                            <p className="text-xs text-secondary dark:text-gray-500 mt-0.5 line-clamp-1">{req.description}</p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-secondary dark:text-gray-400 whitespace-nowrap text-xs">
                          {MAT_TYPE_LABELS[req.materialType] || req.materialType}
                        </td>
                        <td className="py-3.5 px-4 text-secondary dark:text-gray-400 text-xs">
                          {req.course || <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <ReqStatusBadge status={req.status} />
                            {req.adminNote && (
                              <span className="flex items-center gap-1 text-xs text-secondary dark:text-gray-400">
                                <MessageSquare className="h-3 w-3 flex-shrink-0" />
                                <span className="line-clamp-1">{req.adminNote}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-secondary dark:text-gray-500 whitespace-nowrap text-xs">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => openStatusModal(req)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-xs font-medium transition-colors whitespace-nowrap"
                          >
                            Update <ChevronDown className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Status Update Modal ─────────────────────────────────────────── */}
      {statusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setStatusModal(null); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-primary dark:text-gray-100">Update Request Status</h2>
              <button onClick={() => setStatusModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5 text-secondary dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleStatusUpdate} className="px-6 py-5 space-y-4">
              {/* request summary */}
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3">
                <p className="text-xs text-secondary dark:text-gray-400">Student</p>
                <p className="font-medium text-primary dark:text-gray-100 text-sm">{statusModal.request.student?.fullName}</p>
                <p className="text-xs text-secondary dark:text-gray-400 mt-2">Requested</p>
                <p className="font-medium text-primary dark:text-gray-100 text-sm">{statusModal.request.title}</p>
              </div>

              {/* Status selector */}
              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">New Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {['pending', 'fulfilled', 'rejected'].map((s) => {
                    const cfg = REQ_STATUS_CFG[s];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusForm((f) => ({ ...f, status: s }))}
                        className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                          statusForm.status === s
                            ? `border-current ${cfg.bg} ${cfg.color}`
                            : 'border-gray-200 dark:border-gray-600 text-secondary dark:text-gray-400 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin note */}
              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                  Note to Student{' '}
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={statusForm.adminNote}
                  onChange={(e) => setStatusForm((f) => ({ ...f, adminNote: e.target.value }))}
                  placeholder={statusForm.status === 'fulfilled' ? 'e.g. See uploaded materials in the portal…' : statusForm.status === 'rejected' ? 'e.g. Material not available at this time…' : ''}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-secondary dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60 transition text-sm"
                >
                  {updatingStatus ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : null}
                  {updatingStatus ? 'Saving…' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upload Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

            {/* modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="bg-accent/10 p-2 rounded-lg">
                  <Upload className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-bold text-primary dark:text-gray-100">
                  Upload Study Material
                </h2>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-secondary dark:text-gray-400" />
              </button>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* ── Type selector ── */}
              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-2">
                  Material Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MATERIAL_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleTypeChange(value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.type === value
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-gray-200 dark:border-gray-600 text-secondary dark:text-gray-400 hover:border-accent/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Title ── */}
              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Chapter 3 – Data Structures Notes"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                />
              </div>

              {/* ── Course ── */}
              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                  Course{' '}
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                  placeholder="e.g. CS201 – Data Structures"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                />
              </div>

              {/* ── Description ── */}
              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                  Description{' '}
                  <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this material…"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition resize-none"
                />
              </div>

              {/* ── File upload (PDF/Tute/PastPaper) ── */}
              {isFileType && (
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                    Upload PDF{' '}
                    <span className="text-red-500">*</span>{' '}
                    <span className="text-xs text-gray-400 font-normal">— max 10 MB</span>
                  </label>

                  {/* drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors text-center select-none ${
                      form.file
                        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-accent hover:bg-accent/5'
                    }`}
                  >
                    {form.file ? (
                      <>
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate px-4">
                          {form.file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{formatSize(form.file.size)}</p>
                        <p className="text-xs text-accent mt-2 hover:underline">Click to change file</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-secondary dark:text-gray-400">
                          Click to browse or drag & drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF only · max 10 MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* file size bar */}
                  {form.file && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${Math.min((form.file.size / MAX_FILE_SIZE) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {formatSize(form.file.size)} / 10 MB
                      </p>
                    </div>
                  )}

                  {fileError && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {fileError}
                    </div>
                  )}
                </div>
              )}

              {/* ── Link URL (YouTube / Drive) ── */}
              {isLinkType && (
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-200 mb-1">
                    {form.type === 'youtube' ? 'YouTube URL' : 'Google Drive URL'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="url"
                      value={form.linkUrl}
                      onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                      placeholder={
                        form.type === 'youtube'
                          ? 'https://www.youtube.com/watch?v=...'
                          : 'https://drive.google.com/file/d/...'
                      }
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {form.type === 'youtube'
                      ? 'Paste a public YouTube video or playlist link.'
                      : 'Make sure the Drive file/folder is set to "Anyone with the link can view".'}
                  </p>
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-secondary dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {submitting ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {submitting ? 'Uploading…' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationProviderDashboard;
