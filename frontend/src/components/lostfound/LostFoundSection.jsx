import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import ReportItemModal from "./ReportItemModal";
import LostItemList from "./LostItemList";
import FoundItemList from "./FoundItemList";
import { lostFoundAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./lostfound.css";

const LostFoundSection = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("lost");
  const [lostPosts, setLostPosts] = useState([]);
  const [foundPosts, setFoundPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchAlert, setMatchAlert] = useState({ show: false, matches: [] });

  const currentUserId = useMemo(() => user?._id || "", [user]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const [lostRes, foundRes] = await Promise.all([lostFoundAPI.getLostPosts(), lostFoundAPI.getFoundPosts()]);
      setLostPosts(lostRes.posts || []);
      setFoundPosts(foundRes.posts || []);
    } catch (err) {
      setError("Failed to load lost and found items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreate = async (formData) => {
    try {
      setSubmitting(true);
      const response = await lostFoundAPI.createPost(formData);

      if (response.post?.postType === "lost") {
        setLostPosts((prev) => [response.post, ...prev]);
        if (response.hasMatches) {
          setMatchAlert({ show: true, matches: response.matches || [] });
          toast.success("⚠ Possible match found! Check similar found items.");
        } else {
          setMatchAlert({ show: false, matches: [] });
          toast.success("Lost item reported successfully.");
        }
      } else {
        setFoundPosts((prev) => [response.post, ...prev]);
        toast.success("Found item reported successfully.");
      }

      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (postId) => {
    try {
      const response = await lostFoundAPI.resolvePost(postId);
      const updatedPost = response.post;

      setLostPosts((prev) => prev.map((post) => (post._id === postId ? updatedPost : post)));
      setFoundPosts((prev) => prev.map((post) => (post._id === postId ? updatedPost : post)));
      toast.success("Post marked as resolved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (postId) => {
    try {
      await lostFoundAPI.deletePost(postId);
      setLostPosts((prev) => prev.filter((post) => post._id !== postId));
      setFoundPosts((prev) => prev.filter((post) => post._id !== postId));
      setMatchAlert((prev) => ({
        ...prev,
        matches: prev.matches.filter((post) => post._id !== postId),
      }));
      toast.success("Post deleted successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Lost and Found</CardTitle>
          <CardDescription>Report lost/found items and discover possible matches.</CardDescription>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover w-full sm:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          Report Item
        </button>
      </CardHeader>

      <CardContent>
        {matchAlert.show && (
          <div className="lostfound-alert mb-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm sm:text-base font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                ⚠ Possible match detected! Check found items that might belong to you.
              </p>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border border-amber-400 hover:bg-amber-100"
                onClick={() => setMatchAlert({ show: false, matches: [] })}
              >
                Dismiss
              </button>
            </div>

            {matchAlert.matches.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <FoundItemList
                  posts={matchAlert.matches}
                  currentUserId={currentUserId}
                  readOnly={true}
                  emptyLabel="No matching found items."
                />
              </div>
            )}
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab("lost")}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === "lost"
                  ? "border-primary text-primary dark:text-primary-light"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Lost Items
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("found")}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === "found"
                  ? "border-primary text-primary dark:text-primary-light"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Found Items
            </button>
          </nav>
        </div>

        {loading && <p className="text-sm text-secondary dark:text-gray-400">Loading lost and found posts...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && activeTab === "lost" && (
          <LostItemList posts={lostPosts} currentUserId={currentUserId} onResolve={handleResolve} onDelete={handleDelete} />
        )}
        {!loading && !error && activeTab === "found" && (
          <FoundItemList posts={foundPosts} currentUserId={currentUserId} onResolve={handleResolve} onDelete={handleDelete} />
        )}
      </CardContent>

      <ReportItemModal
        isOpen={isModalOpen}
        isSubmitting={submitting}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </Card>
  );
};

export default LostFoundSection;
