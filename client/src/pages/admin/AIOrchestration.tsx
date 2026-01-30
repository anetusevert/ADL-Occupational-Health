/**
 * Arthur D. Little - Global Health Platform
 * AI Configuration - Admin Settings
 * Viewport-fit design
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Cpu,
  Key,
  Loader2,
  Check,
  Zap,
  Settings,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Globe,
  Server,
  Sparkles,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getAIConfig,
  updateAIConfig,
  getAIProviders,
  testAIConnection,
  type AIConfigUpdate,
} from "../../services/auth";
import { cn } from "../../lib/utils";

// Provider icons and colors
const providerMeta: Record<string, { color: string; description: string }> = {
  openai: { color: "text-emerald-400", description: "GPT-5, GPT-4o, GPT-4 Turbo" },
  anthropic: { color: "text-orange-400", description: "Claude 3 Opus, Sonnet" },
  google: { color: "text-blue-400", description: "Gemini Pro, Flash" },
  azure_openai: { color: "text-cyan-400", description: "Enterprise GPT-4" },
  mistral: { color: "text-purple-400", description: "Mistral Large, Medium" },
  cohere: { color: "text-pink-400", description: "Command R+" },
  ollama: { color: "text-amber-400", description: "Local LLMs" },
  local: { color: "text-slate-400", description: "Custom deployment" },
};

export function AIOrchestration() {
  const queryClient = useQueryClient();
  
  // State
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiEndpoint, setApiEndpoint] = useState<string>("");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Queries
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["ai-config"],
    queryFn: getAIConfig,
  });

  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: getAIProviders,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateAIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-config"] });
      setApiKey("");  // Clear API key field after save
    },
  });

  // Initialize form from config
  useEffect(() => {
    if (config) {
      setSelectedProvider(config.provider);
      setSelectedModel(config.model_name);
      setApiEndpoint(config.api_endpoint || "");
      setTemperature(config.temperature);
    }
  }, [config]);

  // Get current provider info
  const currentProvider = providersData?.providers.find(
    (p) => p.id === selectedProvider
  );

  // Handle save
  const handleSave = () => {
    const update: AIConfigUpdate = {
      provider: selectedProvider,
      model_name: selectedModel,
      temperature,
    };
    
    if (apiKey) {
      update.api_key = apiKey;
    }
    
    if (apiEndpoint) {
      update.api_endpoint = apiEndpoint;
    }
    
    updateMutation.mutate(update);
  };

  // Handle test connection
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testAIConnection({
        provider: selectedProvider,
        model_name: selectedModel,
        api_key: apiKey || undefined,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (configLoading || providersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-adl-accent/20 rounded-xl flex items-center justify-center border border-adl-accent/30">
            <Cpu className="w-5 h-5 text-adl-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              AI Configuration
            </h1>
            <p className="text-white/40 text-sm">
              Configure AI providers for the analysis engine
            </p>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto scrollbar-thin space-y-4">

      {/* Status Banner */}
      <div
        className={cn(
          "p-4 rounded-xl border flex items-center gap-4",
          config?.is_configured
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        )}
      >
        {config?.is_configured ? (
          <>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-medium">AI Configured</p>
              <p className="text-sm text-emerald-400/70">
                Using {config.provider} ({config.model_name})
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-amber-400 font-medium">AI Not Configured</p>
              <p className="text-sm text-amber-400/70">
                Please configure an AI provider to enable Deep Dive analysis
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Provider Cards */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Select AI Provider
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {providersData?.providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    setSelectedProvider(provider.id);
                    setSelectedModel(provider.models[0]?.id || "");
                  }}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all duration-200",
                    selectedProvider === provider.id
                      ? "bg-cyan-500/20 border-cyan-500/50 ring-2 ring-cyan-500/20"
                      : "bg-slate-900/50 border-slate-700/50 hover:border-slate-600"
                  )}
                >
                  <p className={cn(
                    "font-semibold",
                    providerMeta[provider.id]?.color || "text-white"
                  )}>
                    {provider.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {providerMeta[provider.id]?.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Select Model
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentProvider?.models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all duration-200",
                    selectedModel === model.id
                      ? "bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/20"
                      : "bg-slate-900/50 border-slate-700/50 hover:border-slate-600"
                  )}
                >
                  <p className="font-semibold text-white">{model.name}</p>
                  <p className="text-sm text-slate-400 mt-1">{model.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              API Configuration
            </h2>
            
            <div className="space-y-4">
              {/* API Key */}
              {currentProvider?.requires_api_key && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Key
                    {config?.api_key_configured && (
                      <span className="ml-2 text-xs text-emerald-400">
                        (configured: {config.api_key_preview})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={config?.api_key_configured ? "Enter new key to update" : "Enter API key"}
                      className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* API Endpoint (for Azure, Ollama, Local) */}
              {currentProvider?.requires_endpoint && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Endpoint
                  </label>
                  <div className="relative">
                    <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder={
                        selectedProvider === "ollama"
                          ? "http://localhost:11434"
                          : "https://your-endpoint.openai.azure.com"
                      }
                      className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Temperature: {temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(temperature / 2) * 100}%, #334155 ${(temperature / 2) * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Precise (0)</span>
                  <span>Creative (2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="space-y-6">
          {/* Test Connection */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Test Connection
            </h2>
            
            <button
              onClick={handleTest}
              disabled={isTesting || (!apiKey && !config?.api_key_configured)}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                "hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Test Connection
                </>
              )}
            </button>

            {/* Test Result */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-4 p-4 rounded-lg border",
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span className={testResult.success ? "text-emerald-400" : "text-red-400"}>
                    {testResult.success ? "Success!" : "Failed"}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{testResult.message}</p>
              </motion.div>
            )}
          </div>

          {/* Save Configuration */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Save Configuration
            </h2>
            
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className={cn(
                "w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-cyan-500 to-blue-600 text-white",
                "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg shadow-cyan-500/25"
              )}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Configuration
                </>
              )}
            </button>

            {updateMutation.isSuccess && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-emerald-400 text-center"
              >
                Configuration saved successfully!
              </motion.p>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              About AI Providers
            </h3>
            <ul className="text-xs text-slate-500 space-y-1">
              <li>• OpenAI: Industry standard, excellent for analysis</li>
              <li>• Anthropic: Great reasoning, Claude 3.5 recommended</li>
              <li>• Google: Fast Gemini models, good for scale</li>
              <li>• Ollama: Run LLMs locally, no API costs</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default AIOrchestration;
