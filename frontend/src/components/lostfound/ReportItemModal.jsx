import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const DEFAULT_FORM = {
  postType: "lost",
  title: "",
  description: "",
  location: "",
  date: "",
  category: "electronics",
  contactInfo: "",
  image: null,
};

const CATEGORIES = ["electronics", "id card", "bag", "keys", "books", "other"];

const ReportItemModal = ({ isOpen, isSubmitting, onClose, onSubmit }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [previewUrl, setPreviewUrl] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setForm(DEFAULT_FORM);
      setPreviewUrl("");
      setFormError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!form.image) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(form.image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.image]);

  const dateLabel = useMemo(() => (form.postType === "lost" ? "Date Lost" : "Date Found"), [form.postType]);
  const locationLabel = useMemo(
    () => (form.postType === "lost" ? "Location item was lost" : "Location item was found"),
    [form.postType]
  );

  if (!isOpen) return null;

  const handleInput = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim() || !form.description.trim() || !form.location.trim() || !form.date || !form.category) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (form.postType === "found" && !form.image) {
      setFormError("Found item photo is required.");
      return;
    }

    const formData = new FormData();
    formData.append("postType", form.postType);
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("location", form.location.trim());
    formData.append("date", form.date);
    formData.append("category", form.category);
    formData.append("contactInfo", form.contactInfo.trim());
    if (form.image) formData.append("image", form.image);

    await onSubmit(formData);
  };

  return (
    <div className="lostfound-modal-backdrop">
      <div className="lostfound-modal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-primary dark:text-gray-100">Report Item</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="lostfound-toggle">
            <button
              type="button"
              className={form.postType === "lost" ? "active" : ""}
              onClick={() => handleInput("postType", "lost")}
            >
              Lost Item
            </button>
            <button
              type="button"
              className={form.postType === "found" ? "active" : ""}
              onClick={() => handleInput("postType", "found")}
            >
              Found Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="lostfound-label">Item title *</label>
              <input
                type="text"
                className="lostfound-input"
                value={form.title}
                onChange={(e) => handleInput("title", e.target.value)}
                maxLength={120}
              />
            </div>

            <div className="md:col-span-2">
              <label className="lostfound-label">Description *</label>
              <textarea
                className="lostfound-input min-h-[90px]"
                value={form.description}
                onChange={(e) => handleInput("description", e.target.value)}
                maxLength={1000}
              />
            </div>

            <div>
              <label className="lostfound-label">{locationLabel} *</label>
              <input
                type="text"
                className="lostfound-input"
                value={form.location}
                onChange={(e) => handleInput("location", e.target.value)}
              />
            </div>

            <div>
              <label className="lostfound-label">{dateLabel} *</label>
              <input
                type="date"
                className="lostfound-input"
                value={form.date}
                onChange={(e) => handleInput("date", e.target.value)}
              />
            </div>

            <div>
              <label className="lostfound-label">Category *</label>
              <select
                className="lostfound-input"
                value={form.category}
                onChange={(e) => handleInput("category", e.target.value)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="lostfound-label">Contact information (optional)</label>
              <input
                type="text"
                className="lostfound-input"
                value={form.contactInfo}
                onChange={(e) => handleInput("contactInfo", e.target.value)}
                placeholder="Email / phone"
                maxLength={200}
              />
            </div>

            <div className="md:col-span-2">
              <label className="lostfound-label">
                Upload photo {form.postType === "found" ? "*" : "(optional)"} (JPG/PNG)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handleInput("image", e.target.files?.[0] || null)}
                className="lostfound-input"
              />
            </div>

            {previewUrl && (
              <div className="md:col-span-2">
                <p className="lostfound-label">Image preview</p>
                <img src={previewUrl} alt="Preview" className="h-40 w-40 rounded-lg object-cover border border-gray-200" />
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportItemModal;
