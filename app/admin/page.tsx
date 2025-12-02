"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { BackgroundGlow } from "@/components/ui/background-components";
import { Plus, Trash2, Save, Loader2, ArrowLeft, Power, GripVertical } from "lucide-react";
import type { AXModelConfig } from "@/types";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [models, setModels] = useState<AXModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModel, setNewModel] = useState({
    model_id: "",
    display_name: "",
    provider: "",
    openrouter_model_id: "",
    is_enabled: true,
    sort_order: 0
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/admin/check");
      const data = await response.json();

      if (!data.isAdmin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      fetchModels();
    } catch (err) {
      router.push("/");
    }
  };

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/ax-models");
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (model: AXModelConfig) => {
    if (!model.id) return;

    try {
      setSaving(model.id);
      const response = await fetch("/api/admin/ax-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: model.id,
          is_enabled: !model.is_enabled
        })
      });

      const data = await response.json();
      if (data.success) {
        setModels(models.map(m =>
          m.id === model.id ? { ...m, is_enabled: !m.is_enabled } : m
        ));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateModel = async (model: AXModelConfig, updates: Partial<AXModelConfig>) => {
    if (!model.id) return;

    try {
      setSaving(model.id);
      const response = await fetch("/api/admin/ax-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: model.id, ...updates })
      });

      const data = await response.json();
      if (data.success) {
        setModels(models.map(m =>
          m.id === model.id ? { ...m, ...updates } : m
        ));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteModel = async (model: AXModelConfig) => {
    if (!model.id) return;
    if (!confirm(`Are you sure you want to delete ${model.display_name}?`)) return;

    try {
      setSaving(model.id);
      const response = await fetch(`/api/admin/ax-models?id=${model.id}`, {
        method: "DELETE"
      });

      const data = await response.json();
      if (data.success) {
        setModels(models.filter(m => m.id !== model.id));
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleAddModel = async () => {
    if (!newModel.model_id || !newModel.display_name || !newModel.provider || !newModel.openrouter_model_id) {
      setError("All fields are required");
      return;
    }

    try {
      setSaving(-1);
      const response = await fetch("/api/admin/ax-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newModel,
          sort_order: models.length + 1
        })
      });

      const data = await response.json();
      if (data.success) {
        setModels([...models, data.model]);
        setShowAddForm(false);
        setNewModel({
          model_id: "",
          display_name: "",
          provider: "",
          openrouter_model_id: "",
          is_enabled: true,
          sort_order: 0
        });
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (isAdmin === null) {
    return (
      <BackgroundGlow>
        <Navbar />
        <main className="container mx-auto px-6 pt-32 pb-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </main>
      </BackgroundGlow>
    );
  }

  return (
    <BackgroundGlow>
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-white">AX Model Configuration</h1>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Model
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add Model Form */}
          {showAddForm && (
            <div className="p-6 rounded-2xl border border-white/10 bg-black">
              <h2 className="text-lg font-semibold text-white mb-4">Add New Model</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Model ID</label>
                  <input
                    type="text"
                    value={newModel.model_id}
                    onChange={(e) => setNewModel({ ...newModel, model_id: e.target.value })}
                    placeholder="e.g., gpt-4o"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newModel.display_name}
                    onChange={(e) => setNewModel({ ...newModel, display_name: e.target.value })}
                    placeholder="e.g., GPT-4o"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">Provider</label>
                  <input
                    type="text"
                    value={newModel.provider}
                    onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })}
                    placeholder="e.g., OpenAI"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">OpenRouter Model ID</label>
                  <input
                    type="text"
                    value={newModel.openrouter_model_id}
                    onChange={(e) => setNewModel({ ...newModel, openrouter_model_id: e.target.value })}
                    placeholder="e.g., openai/gpt-4o"
                    className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white placeholder-neutral-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                  <input
                    type="checkbox"
                    checked={newModel.is_enabled}
                    onChange={(e) => setNewModel({ ...newModel, is_enabled: e.target.checked })}
                    className="rounded"
                  />
                  Enabled
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddModel}
                  disabled={saving === -1}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving === -1 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Model
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Models List */}
          <div className="p-6 rounded-2xl border border-white/10 bg-black">
            <h2 className="text-lg font-semibold text-white mb-4">Configured Models</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : models.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">No models configured yet.</p>
            ) : (
              <div className="space-y-3">
                {models.map((model, index) => (
                  <div
                    key={model.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                      model.is_enabled
                        ? "border-white/10 bg-neutral-900"
                        : "border-white/5 bg-neutral-900/50 opacity-60"
                    )}
                  >
                    <GripVertical className="w-5 h-5 text-neutral-600 cursor-grab" />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-neutral-500">Display Name</p>
                        <input
                          type="text"
                          value={model.display_name}
                          onChange={(e) => handleUpdateModel(model, { display_name: e.target.value })}
                          className="w-full bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Model ID</p>
                        <p className="text-sm text-neutral-300 font-mono">{model.model_id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Provider</p>
                        <p className="text-sm text-neutral-300 capitalize">{model.provider}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">OpenRouter ID</p>
                        <input
                          type="text"
                          value={model.openrouter_model_id}
                          onChange={(e) => handleUpdateModel(model, { openrouter_model_id: e.target.value })}
                          className="w-full bg-transparent text-sm text-neutral-300 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(model)}
                        disabled={saving === model.id}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          model.is_enabled
                            ? "text-green-400 hover:bg-green-500/20"
                            : "text-neutral-500 hover:bg-neutral-800"
                        )}
                        title={model.is_enabled ? "Disable" : "Enable"}
                      >
                        {saving === model.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteModel(model)}
                        disabled={saving === model.id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/10">
            <h3 className="font-semibold text-purple-300 mb-2">About AX Model Configuration</h3>
            <p className="text-sm text-purple-200/70">
              Configure which AI models are available for Agent Experience (AX) evaluations.
              Each model will evaluate websites independently, and the AX Council will aggregate
              their scores into a final assessment. Models are called via OpenRouter API.
            </p>
            <p className="text-sm text-purple-200/70 mt-2">
              Find available model IDs at{" "}
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                openrouter.ai/models
              </a>
              . Use the format <code className="bg-purple-900/50 px-1 rounded">provider/model-name</code> (e.g., openai/gpt-4o, anthropic/claude-3.5-sonnet).
            </p>
            <p className="text-sm text-purple-200/70 mt-2">
              Make sure you have set the <code className="bg-purple-900/50 px-1 rounded">OPENROUTER_API_KEY</code> environment variable.
            </p>
          </div>
        </div>
      </main>
    </BackgroundGlow>
  );
}
