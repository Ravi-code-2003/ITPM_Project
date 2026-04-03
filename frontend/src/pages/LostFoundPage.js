import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  MapPin,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { lostFoundService } from '../services/lostFoundService';
import { getImageUrl } from '../utils/imageHelper';

const CATEGORY_OPTIONS = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'keys', label: 'Keys' },
  { value: 'bags', label: 'Bags' },
  { value: 'other', label: 'Other' },
];

const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'chat', label: 'Chat App' },
  { value: 'other', label: 'Other' },
];

const INITIAL_FORM = {
  itemName: '',
  category: 'other',
  campus: '',
  locationDetails: '',
  lostDate: '',
  description: '',
};

const LostFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('open');
  const [mineOnly, setMineOnly] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [respondingItemId, setRespondingItemId] = useState('');
  const [responseDraft, setResponseDraft] = useState({
    message: '',
    contactMethod: 'email',
    contactNote: '',
  });
  const [sendingResponse, setSendingResponse] = useState(false);
  const [resolvingId, setResolvingId] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await lostFoundService.getItems({
        status: statusFilter,
        mine: mineOnly,
        q: searchText.trim(),
      });

      setItems(Array.isArray(response.items) ? response.items : []);
    } catch (error) {
      console.error('Failed to fetch lost & found items:', error);
      toast.error('Failed to load lost items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [statusFilter, mineOnly]);

  const myId = useMemo(() => String(user?._id || user?.id || ''), [user]);

  const handleCreateItem = async (event) => {
    event.preventDefault();

    if (!form.itemName.trim() || !form.campus.trim() || !form.locationDetails.trim() || !form.lostDate || !form.description.trim()) {
      toast.error('Please fill all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('itemName', form.itemName.trim());
    formData.append('category', form.category);
    formData.append('campus', form.campus.trim());
    formData.append('locationDetails', form.locationDetails.trim());
    formData.append('lostDate', form.lostDate);
    formData.append('description', form.description.trim());

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      setCreating(true);
      const response = await lostFoundService.createItem(formData);
      if (response.item) {
        setItems((prev) => [response.item, ...prev]);
      }
      setForm(INITIAL_FORM);
      setImageFile(null);
      setImagePreview('');
      toast.success('Lost item posted successfully.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to post lost item.';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDeleteItem = async (itemId) => {
    const confirmed = window.confirm('Delete this post?');
    if (!confirmed) return;

    try {
      await lostFoundService.deleteItem(itemId);
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      toast.success('Post deleted.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete post.';
      toast.error(message);
    }
  };

  const openResponseBox = (itemId) => {
    setRespondingItemId(itemId);
    setResponseDraft({ message: '', contactMethod: 'email', contactNote: '' });
  };

  const handleSendResponse = async (itemId) => {
    if (!responseDraft.message.trim()) {
      toast.error('Please write a message.');
      return;
    }

    try {
      setSendingResponse(true);
      const response = await lostFoundService.sendResponse(itemId, {
        message: responseDraft.message.trim(),
        contactMethod: responseDraft.contactMethod,
        contactNote: responseDraft.contactNote.trim(),
      });

      if (response.item) {
        setItems((prev) => prev.map((item) => (item._id === itemId ? response.item : item)));
      }

      setRespondingItemId('');
      toast.success('Response sent. Owner can contact you now.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send response.';
      toast.error(message);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleResolve = async (itemId, responseId) => {
    try {
      setResolvingId(`${itemId}:${responseId}`);
      const response = await lostFoundService.resolveItem(itemId, responseId);
      if (response.item) {
        setItems((prev) => prev.map((item) => (item._id === itemId ? response.item : item)));
      }
      toast.success('Marked as resolved.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resolve item.';
      toast.error(message);
    } finally {
      setResolvingId('');
    }
  };

  const openCount = useMemo(() => items.filter((item) => item.status === 'open').length, [items]);
  const resolvedCount = useMemo(() => items.filter((item) => item.status === 'resolved').length, [items]);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="px-2 sm:px-1 py-1">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/student/dashboard')}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/90 dark:bg-slate-900/70 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors shadow-sm"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center rounded-full border border-amber-300/80 dark:border-amber-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-900/20">
                  Campus Community Recovery Hub
                </span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-primary dark:text-gray-100">Lost & Found</h1>
                <p className="text-secondary dark:text-gray-400 mt-2 text-sm sm:text-base max-w-2xl leading-relaxed">
                  Share what you lost, discover matching reports, and connect quickly with verified students to recover your item safely.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-900 text-center shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-secondary dark:text-gray-400">Total Reports</p>
            <p className="mt-1 text-2xl font-extrabold text-primary dark:text-gray-100">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-900 text-center shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-secondary dark:text-gray-400">Open Cases</p>
            <p className="mt-1 text-2xl font-extrabold text-primary dark:text-gray-100">{openCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-900 text-center shadow-sm">
            <p className="text-[11px] uppercase tracking-wide text-secondary dark:text-gray-400">Recovered</p>
            <p className="mt-1 text-2xl font-extrabold text-primary dark:text-gray-100">{resolvedCount}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Card className="xl:col-span-4 xl:sticky xl:top-24 h-fit border border-amber-200/80 dark:border-amber-900/40 bg-white/90 dark:bg-surface-dark/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">Report a Lost Item</CardTitle>
              <p className="text-xs text-secondary dark:text-gray-400">Tip: add clear details and a photo for faster recovery.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateItem} className="space-y-3">
                <input
                  type="text"
                  placeholder="Item name *"
                  value={form.itemName}
                  onChange={(event) => setForm((prev) => ({ ...prev, itemName: event.target.value }))}
                  className="w-full rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                    className="rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {CATEGORY_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={form.lostDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, lostDate: event.target.value }))}
                    className="rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Campus *"
                  value={form.campus}
                  onChange={(event) => setForm((prev) => ({ ...prev, campus: event.target.value }))}
                  className="w-full rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="text"
                  placeholder="Last seen location *"
                  value={form.locationDetails}
                  onChange={(event) => setForm((prev) => ({ ...prev, locationDetails: event.target.value }))}
                  className="w-full rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />

                <label className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm flex items-center justify-between gap-2 cursor-pointer">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Camera className="h-4 w-4 text-amber-700 shrink-0" />
                    <span className="truncate">{imageFile ? imageFile.name : 'Upload photo (optional)'}</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-300 text-amber-700">Choose</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>

                <textarea
                  placeholder="Description *"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                />

                {imagePreview && (
                  <div className="rounded-xl border border-amber-200 p-2 bg-amber-50/60 dark:bg-amber-900/10">
                    <img src={imagePreview} alt="Preview" className="h-36 w-full object-cover rounded-lg border border-amber-200" />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold px-5 py-2.5 shadow-md transition-all duration-200 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {creating ? 'Posting...' : 'Post Lost Item'}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="xl:col-span-8 border border-amber-200/80 dark:border-amber-900/40 bg-white/90 dark:bg-surface-dark/90 shadow-xl">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Community Feed</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('open')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === 'open' ? 'bg-primary text-white border-primary' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'}`}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('resolved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === 'resolved' ? 'bg-primary text-white border-primary' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'}`}
                  >
                    Resolved
                  </button>
                  <label className="inline-flex items-center gap-1.5 text-xs text-secondary dark:text-gray-400 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10">
                    <input
                      type="checkbox"
                      checked={mineOnly}
                      onChange={(event) => setMineOnly(event.target.checked)}
                    />
                    My posts only
                  </label>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-3 py-2">
                <Search className="h-4 w-4 text-amber-700" />
                <input
                  type="text"
                  placeholder="Search by item, campus, or location"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={loadItems}
                  className="text-xs font-semibold text-primary px-2 py-1 rounded hover:bg-amber-100"
                >
                  Search
                </button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 p-8 text-center text-secondary dark:text-gray-400 bg-white/80 dark:bg-slate-900/30">
                  No posts found for current filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[72vh] overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isMine = String(item.reportedBy?._id || '') === myId;

                    return (
                      <article
                        key={item._id}
                        className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-900 dark:to-slate-900/70 p-4 sm:p-5 space-y-3 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {item.imageUrl && (
                          <img src={getImageUrl(item.imageUrl)} alt={item.itemName} className="w-full h-44 object-cover rounded-xl border border-amber-200" />
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg text-primary dark:text-gray-100 truncate">{item.itemName}</h3>
                            <p className="text-xs text-secondary dark:text-gray-400 capitalize">{item.category}</p>
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border shrink-0 ${item.status === 'resolved' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'}`}>
                            {item.status}
                          </span>
                        </div>

                        <p className="text-sm text-secondary dark:text-gray-300 whitespace-pre-wrap line-clamp-4">{item.description}</p>

                        <div className="text-xs text-secondary dark:text-gray-400 space-y-1 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-amber-100 dark:border-amber-900/40 p-2.5">
                          <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {item.campus} · {item.locationDetails}</p>
                          <p>Lost on: {new Date(item.lostDate).toLocaleDateString()}</p>
                          <p>Posted by: {item.reportedBy?.fullName} ({item.reportedBy?.email})</p>
                        </div>

                        {isMine && item.status === 'open' && (
                          <div className="rounded-xl border border-amber-200 dark:border-amber-800 p-3 space-y-2 bg-amber-50/40 dark:bg-amber-900/10">
                            <h4 className="text-sm font-semibold text-primary">Responses ({item.responses?.length || 0})</h4>
                            {!item.responses?.length ? (
                              <p className="text-xs text-secondary">No responses yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {item.responses.map((response) => (
                                  <div key={response._id} className="rounded-lg border border-amber-200 dark:border-amber-700 p-2 text-xs space-y-1 bg-white dark:bg-slate-900/70">
                                    <p className="font-semibold">{response.responderId?.fullName} ({response.responderId?.email})</p>
                                    <p>{response.message}</p>
                                    <p className="text-secondary">Preferred contact: {response.contactMethod}{response.contactNote ? ` - ${response.contactNote}` : ''}</p>
                                    <button
                                      type="button"
                                      onClick={() => handleResolve(item._id, response._id)}
                                      disabled={resolvingId === `${item._id}:${response._id}`}
                                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      {resolvingId === `${item._id}:${response._id}` ? 'Saving...' : 'Mark Resolved'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {!isMine && item.status === 'open' && (
                          <div className="space-y-2">
                            {respondingItemId === item._id ? (
                              <div className="rounded-xl border border-amber-300 dark:border-amber-700 p-3 space-y-2 bg-amber-50/50 dark:bg-amber-900/10">
                                <textarea
                                  rows={2}
                                  value={responseDraft.message}
                                  onChange={(event) => setResponseDraft((prev) => ({ ...prev, message: event.target.value }))}
                                  placeholder="I found something similar. Here's where/when I found it..."
                                  className="w-full rounded-lg border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs focus:outline-none"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <select
                                    value={responseDraft.contactMethod}
                                    onChange={(event) => setResponseDraft((prev) => ({ ...prev, contactMethod: event.target.value }))}
                                    className="rounded-lg border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs focus:outline-none"
                                  >
                                    {CONTACT_METHOD_OPTIONS.map((method) => (
                                      <option key={method.value} value={method.value}>{method.label}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={responseDraft.contactNote}
                                    onChange={(event) => setResponseDraft((prev) => ({ ...prev, contactNote: event.target.value }))}
                                    placeholder="Contact detail (optional)"
                                    className="rounded-lg border border-amber-300/70 dark:border-amber-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs focus:outline-none"
                                  />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setRespondingItemId('')}
                                    className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-xs font-semibold"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendResponse(item._id)}
                                    disabled={sendingResponse}
                                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold disabled:opacity-60"
                                  >
                                    {sendingResponse ? 'Sending...' : 'Send Response'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openResponseBox(item._id)}
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm"
                              >
                                I Found This
                              </button>
                            )}
                          </div>
                        )}

                        {isMine && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item._id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LostFoundPage;
