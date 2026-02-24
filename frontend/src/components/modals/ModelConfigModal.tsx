'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  type ModelConfig,
  type SafeModelConfig,
  type TestConnectionResult,
  getAllConfigs,
  saveConfig,
  deleteConfig,
  activateConfig,
  testConnection,
  MODEL_PRESETS,
} from '@/lib/api/modelApi';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: SafeModelConfig) => void;
}

export function ModelConfigModal({
  isOpen,
  onClose,
  onConfigSaved,
}: ModelConfigModalProps) {
  const [savedConfigs, setSavedConfigs] = useState<SafeModelConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ModelConfig>>({
    name: '',
    provider: 'openai-compatible',
    baseUrl: '',
    model: '',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.7,
  });

  // Test connection state
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved configs on mount
  useEffect(() => {
    if (isOpen) {
      loadConfigs();
    }
  }, [isOpen]);

  async function loadConfigs() {
    try {
      const configs = await getAllConfigs();
      setSavedConfigs(configs);
    } catch (error) {
      console.error('Failed to load model configs:', error);
    }
  }

  function handleSelectConfig(config: SafeModelConfig) {
    setSelectedConfigId(config.id);
    setIsEditing(false);
    setTestResult(null);
  }

  function handleAddNew() {
    setIsEditing(true);
    setSelectedConfigId(null);
    setFormData({
      name: '',
      provider: 'openai-compatible',
      baseUrl: '',
      model: '',
      apiKey: '',
      maxTokens: 4096,
      temperature: 0.7,
    });
    setTestResult(null);
  }

  async function handleDeleteConfig(id: string) {
    if (!confirm('Are you sure you want to delete this model configuration?')) {
      return;
    }

    try {
      await deleteConfig(id);
      setSavedConfigs((prev) => prev.filter((c) => c.id !== id));
      if (selectedConfigId === id) {
        setSelectedConfigId(null);
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
      alert('Failed to delete configuration');
    }
  }

  async function handleActivateConfig(id: string) {
    try {
      const activated = await activateConfig(id);
      onConfigSaved?.(activated);
      alert(`Activated: ${activated.name}`);
    } catch (error) {
      console.error('Failed to activate config:', error);
      alert('Failed to activate configuration');
    }
  }

  async function handleTestConnection() {
    if (!formData.provider || !formData.baseUrl || !formData.apiKey) {
      alert('Please fill in provider, base URL, and API key');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const config: ModelConfig = {
        id: formData.id || '',
        name: formData.name || 'Test',
        provider: formData.provider,
        baseUrl: formData.baseUrl,
        apiKey: formData.apiKey,
        model: formData.model || '',
        maxTokens: formData.maxTokens || 4096,
        temperature: formData.temperature || 0.7,
      };

      const result = await testConnection(config);
      setTestResult(result);
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        ok: false,
        error: 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSaveConfig() {
    if (!formData.name || !formData.provider || !formData.baseUrl || !formData.apiKey) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);

    try {
      const config: ModelConfig = {
        id: formData.id || `model-${Date.now()}`,
        name: formData.name,
        provider: formData.provider,
        baseUrl: formData.baseUrl,
        apiKey: formData.apiKey,
        model: formData.model || '',
        maxTokens: formData.maxTokens || 4096,
        temperature: formData.temperature || 0.7,
      };

      const saved = await saveConfig(config);
      setSavedConfigs((prev) => {
        const existing = prev.find((c) => c.id === saved.id);
        if (existing) {
          return prev.map((c) => (c.id === saved.id ? saved : c));
        }
        return [...prev, saved];
      });

      setIsEditing(false);
      setSelectedConfigId(saved.id);
      onConfigSaved?.(saved);
      alert(`Saved and activated: ${saved.name}`);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  }

  function handleUsePreset(presetKey: keyof typeof MODEL_PRESETS) {
    const preset = MODEL_PRESETS[presetKey];
    setFormData({
      ...formData,
      ...preset,
      id: undefined,
      apiKey: '', // User must provide API key
    });
    setTestResult(null);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-[90vw] h-[85vh] bg-[var(--background)] border border-[var(--border)] rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Model Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--panel-bg)] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Saved Models */}
          <div className="w-1/3 border-r border-[var(--border)] flex flex-col">
            <div className="p-4 border-b border-[var(--border)]">
              <button
                onClick={handleAddNew}
                className="w-full py-2 px-4 bg-[#7b68ee] text-white rounded hover:bg-[#6952cc] transition-colors"
              >
                + Add New Model
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">
                Saved Models
              </h3>

              {savedConfigs.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)] text-center mt-8">
                  No saved models yet
                </p>
              ) : (
                <div className="space-y-2">
                  {savedConfigs.map((config) => (
                    <div
                      key={config.id}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedConfigId === config.id
                          ? 'border-[#7b68ee] bg-[var(--panel-bg)]'
                          : 'border-[var(--border)] hover:bg-[var(--panel-bg)]'
                      }`}
                      onClick={() => handleSelectConfig(config)}
                    >
                      <div className="font-medium text-[var(--foreground)]">
                        {config.name}
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        {config.provider} • {config.model || 'No model specified'}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateConfig(config.id);
                          }}
                          className="text-xs px-2 py-1 bg-[#7b68ee] text-white rounded hover:bg-[#6952cc]"
                        >
                          Activate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(config.id);
                          }}
                          className="text-xs px-2 py-1 bg-[#ff5555] text-white rounded hover:bg-[#cc4444]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Config Form */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isEditing && !selectedConfigId ? (
              <div className="flex items-center justify-center h-full text-[var(--foreground-muted)]">
                <p>Select a model or add a new one</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl">
                {/* Presets */}
                <div>
                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">
                    Quick Presets
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleUsePreset('openai-gpt4')}
                      className="p-3 border border-[var(--border)] rounded hover:bg-[var(--panel-bg)] transition-colors text-left"
                    >
                      <div className="font-medium text-[var(--foreground)]">
                        OpenAI GPT-4o
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        Official OpenAI API
                      </div>
                    </button>
                    <button
                      onClick={() => handleUsePreset('anthropic-claude')}
                      className="p-3 border border-[var(--border)] rounded hover:bg-[var(--panel-bg)] transition-colors text-left"
                    >
                      <div className="font-medium text-[var(--foreground)]">
                        Claude Sonnet
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        Anthropic Claude API
                      </div>
                    </button>
                    <button
                      onClick={() => handleUsePreset('ollama-local')}
                      className="p-3 border border-[var(--border)] rounded hover:bg-[var(--panel-bg)] transition-colors text-left"
                    >
                      <div className="font-medium text-[var(--foreground)]">
                        Local Ollama
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        localhost:11434
                      </div>
                    </button>
                    <button
                      onClick={() => handleUsePreset('vllm-custom')}
                      className="p-3 border border-[var(--border)] rounded hover:bg-[var(--panel-bg)] transition-colors text-left"
                    >
                      <div className="font-medium text-[var(--foreground)]">
                        Custom vLLM
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)] mt-1">
                        localhost:8000
                      </div>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                {isEditing && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Configuration Name
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., My GPT-4 Config"
                        className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Provider
                      </label>
                      <select
                        value={formData.provider || 'openai-compatible'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            provider: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                      >
                        <option value="openai-compatible">OpenAI Compatible</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Base URL
                      </label>
                      <input
                        type="text"
                        value={formData.baseUrl || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, baseUrl: e.target.value })
                        }
                        placeholder="e.g., http://localhost:11434 or https://api.openai.com"
                        className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Model Name
                      </label>
                      <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        placeholder="e.g., gpt-4o, claude-3-5-sonnet-20241022"
                        className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={formData.apiKey || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, apiKey: e.target.value })
                        }
                        placeholder="sk-..."
                        className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                      />
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        Stored securely on backend, never exposed to browser
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          value={formData.maxTokens || 4096}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              maxTokens: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                          Temperature
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={formData.temperature || 0.7}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              temperature: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded focus:outline-none focus:border-[#7b68ee]"
                        />
                      </div>
                    </div>

                    {/* Test Connection */}
                    <div>
                      <button
                        onClick={handleTestConnection}
                        disabled={isTesting}
                        className="px-4 py-2 bg-[var(--panel-bg)] border border-[var(--border)] rounded hover:bg-[var(--border)] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>Test Connection</>
                        )}
                      </button>

                      {testResult && (
                        <div
                          className={`mt-3 p-3 rounded border ${
                            testResult.ok
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-[#ff5555] bg-[#ff5555]/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {testResult.ok ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-[#ff5555]" />
                            )}
                            <span className="text-sm font-medium">
                              {testResult.ok
                                ? `Connected — ${testResult.latency}ms`
                                : `Connection failed: ${testResult.error}`}
                            </span>
                          </div>
                          {testResult.ok && testResult.modelList && (
                            <div className="text-xs text-[var(--foreground-muted)] mt-2">
                              Available models: {testResult.modelList.slice(0, 3).join(', ')}
                              {testResult.modelList.length > 3 && ` (+${testResult.modelList.length - 3} more)`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#7b68ee] text-white rounded hover:bg-[#6952cc] transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save & Activate'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-[var(--panel-bg)] text-[var(--foreground)] rounded hover:bg-[var(--border)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
