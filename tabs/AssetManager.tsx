



import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { AssetFile, GeneratedImage, AssetAnalysisResult, MarketingAnalysis, BusinessData } from '../types';
import { analyzeAdCreative, generateCreativeImprovementSuggestions, generateImageTags, generateImage, generateAdCopyForAsset } from '../services/geminiService';
import { fileToBase64, base64ToFile } from '../utils/fileUtils';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import Card from '../components/Card';
import { AssetsIcon } from '../components/icons/TabIcons';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import Spinner from '../components/Spinner';
import Input from '../components/Input';
import { MarkdownContent } from '../components/Chat/MarkdownContent';


const GenerateImageModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddToAssets: (image: GeneratedImage) => void;
}> = ({ isOpen, onClose, onAddToAssets }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setGeneratedImage(null);
        try {
            const results = await generateImage(prompt, aspectRatio);
            if (results.length > 0) {
                setGeneratedImage(results[0]);
            }
        } catch (error) {
            // Error toast is handled by the caller context
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddToLibrary = () => {
        if (generatedImage) {
            onAddToAssets(generatedImage);
            onClose(); // Close modal after adding
        }
    };

    useEffect(() => {
        // Reset state when modal is closed/opened
        setPrompt('');
        setAspectRatio('1:1');
        setIsGenerating(false);
        setGeneratedImage(null);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-image-title"
        >
            <div 
                ref={modalRef}
                className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-lg p-6 sm:p-8 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start">
                    <h2 id="generate-image-title" className="text-2xl font-bold font-heading flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-primary"/>
                        Generate Image with Yugn AI
                    </h2>
                    <button onClick={onClose} className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary-text-light dark:hover:text-primary-text-dark text-2xl" aria-label="Close modal">&times;</button>
                </div>

                <div className="mt-6 space-y-4">
                    <Input
                        id="prompt"
                        label="Prompt"
                        type="textarea"
                        placeholder="e.g., A photorealistic image of a luxury watch on a marble tabletop..."
                        value={prompt}
                        onChange={(_, val) => setPrompt(val)}
                    />
                     <Input label="Aspect Ratio" id="aspectRatio" type="select" value={aspectRatio} onChange={(_, val) => setAspectRatio(val)}>
                        <option value="1:1">Square (1:1)</option>
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="9:16">Portrait (9:16)</option>
                        <option value="4:3">Standard (4:3)</option>
                        <option value="3:4">Vertical (3:4)</option>
                    </Input>
                </div>

                <div className="mt-6">
                     <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full text-white font-bold py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                        {isGenerating ? <><Spinner size="small" /> <span className="ml-3">Generating...</span></> : '✨ Generate'}
                    </button>
                </div>

                {(isGenerating || generatedImage) && (
                    <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                        <h3 className="font-semibold mb-3 text-center">Result</h3>
                        <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                            {isGenerating && <Spinner />}
                            {generatedImage?.image?.imageBytes && generatedImage.image.mimeType && (
                                <img
                                    src={`data:${generatedImage.image.mimeType};base64,${generatedImage.image.imageBytes}`}
                                    alt={generatedImage.altText || "AI generated image"}
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                            )}
                        </div>
                        {generatedImage && (
                            <button onClick={handleAddToLibrary} className="w-full mt-4 px-5 py-2.5 text-sm text-white font-semibold rounded-lg bg-success hover:bg-emerald-600 transition-all shadow-md shadow-success/30">
                                Add to Asset Library
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const CampaignStudioModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    asset: AssetFile | null;
    strategy: MarketingAnalysis | null;
    businessData: BusinessData | null;
}> = ({ isOpen, onClose, asset, strategy, businessData }) => {
    const [analysisResult, setAnalysisResult] = useState<AssetAnalysisResult | null>(null);
    const [adCopy, setAdCopy] = useState<Record<string, { persona: string, copy: string }[]> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        const runCreativeToCampaign = async () => {
            if (isOpen && asset && strategy && businessData) {
                setIsLoading(true);
                setError(null);
                setAnalysisResult(null);
                setAdCopy(null);

                try {
                    const base64Image = await fileToBase64(asset.file);
                    const imagePayload = { mimeType: asset.file.type, data: base64Image };

                    // 1. Analyze creative
                    const analysis = await analyzeAdCreative(imagePayload);
                    setAnalysisResult(analysis);

                    // 2. Generate ad copy
                    const copyResult = await generateAdCopyForAsset(imagePayload, strategy, businessData);
                    setAdCopy(copyResult);

                } catch (err) {
                    const message = err instanceof Error ? err.message : "An unknown error occurred in the campaign studio.";
                    setError(message);
                    addToast(message, 'error');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        runCreativeToCampaign();
    }, [isOpen, asset, strategy, businessData, addToast]);
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast("Ad copy copied!", "success");
    }

    if (!isOpen) return null;
    
    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-4xl p-6 sm:p-8 transform transition-all flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start flex-shrink-0">
                    <h2 className="text-2xl font-bold font-heading flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-primary"/>
                        AI Campaign Studio
                    </h2>
                    <button onClick={onClose} className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary-text-light dark:hover:text-primary-text-dark text-2xl" aria-label="Close modal">&times;</button>
                </div>

                <div className="mt-6 flex-grow overflow-y-auto pr-2 -mr-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center text-center h-full">
                            <Spinner />
                            <p className="mt-3 font-semibold">Yugn AI is analyzing and creating...</p>
                            <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">This may take a moment.</p>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
                           <h3 className="font-bold text-red-700 dark:text-red-200">Studio Failed</h3>
                           <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                       </div>
                    )}
                    {!isLoading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Image & Analysis */}
                            <div className="space-y-4">
                                <img src={asset?.preview} alt={asset?.file.name} className="rounded-lg w-full object-contain" />
                                {analysisResult && (
                                     <div className="p-4 bg-slate-50 dark:bg-surface-dark/60 rounded-lg border border-border-light dark:border-border-dark">
                                        <h3 className="font-bold mb-2">Creative Analysis</h3>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${ratingClasses[analysisResult.rating]}`}>
                                            {analysisResult.rating}
                                        </span>
                                        <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark mt-2">{analysisResult.feedback}</p>
                                    </div>
                                )}
                            </div>
                            {/* Right Column: Ad Copy */}
                            <div className="space-y-4">
                                <h3 className="font-bold">Generated Ad Copy</h3>
                                {adCopy && Object.entries(adCopy).length > 0 ? (
                                    Object.entries(adCopy).map(([platform, copies]) => (
                                        <div key={platform} className="p-4 bg-slate-50 dark:bg-surface-dark/60 rounded-lg border border-border-light dark:border-border-dark">
                                            <h4 className="font-bold text-primary">{platform}</h4>
                                            <div className="mt-3 space-y-3">
                                                {/* FIX: Add type assertion to resolve 'map does not exist on type unknown' error. */}
                                                {(copies as { persona: string, copy: string }[]).map((c, i) => (
                                                    <div key={i} className="bg-surface-light dark:bg-surface-dark p-3 rounded-md">
                                                         <p className="text-xs font-semibold text-secondary-text-light dark:text-secondary-text-dark mb-1">For: {c.persona}</p>
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="text-sm flex-1 prose prose-sm dark:prose-invert max-w-full"><MarkdownContent content={c.copy} /></div>
                                                            <button onClick={() => handleCopy(c.copy)} className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-secondary-text-light dark:text-secondary-text-dark font-semibold py-1 px-2 rounded-md transition flex-shrink-0">Copy</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">No ad copy could be generated. This may happen if your strategy has no high-priority platforms.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const ratingClasses: { [key: string]: string } = {
    'Excellent': 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300 border-green-500/30',
    'Good': 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300 border-blue-500/30',
    'Needs Improvement': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300 border-yellow-500/30',
};

const FilterButton: React.FC<{
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, count, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
      isActive
        ? 'bg-primary text-white shadow-md shadow-primary/20'
        : 'bg-slate-100 dark:bg-surface-dark text-secondary-text-light dark:text-secondary-text-dark hover:bg-slate-200 dark:hover:bg-slate-800'
    }`}
  >
    {label}
    <span className={`text-xs rounded-full px-2 py-0.5 ${isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
      {count}
    </span>
  </button>
);


const AssetManager: React.FC = () => {
    const { getActiveProject, updateActiveProjectData } = useAppContext();
    const { addToast } = useToast();
    const [isDragging, setIsDragging] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTagging, setIsTagging] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    // State for Creative-to-Campaign Pipeline
    const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
    const [selectedAssetForStudio, setSelectedAssetForStudio] = useState<AssetFile | null>(null);

    const activeProject = getActiveProject();
    const assets = activeProject?.assets || [];
    
    // Effect for cleaning up Object URLs to prevent memory leaks
    useEffect(() => {
        // This function will run when the component unmounts.
        return () => {
            assets.forEach(asset => {
                // We only need to revoke URLs created by createObjectURL
                if (asset.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(asset.preview);
                }
            });
        };
    }, [assets]); // This dependency ensures the cleanup function captures the latest asset list.


    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || !activeProject) return;
        const newAssets: AssetFile[] = Array.from(files).map(file => {
            let type: 'image' | 'video' | 'document' = 'document';
            if (file.type.startsWith('image/')) type = 'image';
            if (file.type.startsWith('video/')) type = 'video';
            
            return {
                id: `${file.name}-${Date.now()}`,
                file,
                preview: URL.createObjectURL(file),
                type,
            }
        });
        updateActiveProjectData({ assets: [...assets, ...newAssets] });
    }, [activeProject, assets, updateActiveProjectData]);

    const deleteAsset = (id: string) => {
        const assetToDelete = assets.find(a => a.id === id);
        // Revoke the object URL before removing the asset from state to prevent memory leaks.
        if (assetToDelete && assetToDelete.preview.startsWith('blob:')) {
            URL.revokeObjectURL(assetToDelete.preview);
        }
        updateActiveProjectData({ assets: assets.filter(asset => asset.id !== id) });
    };
    
    const dragOverHandler = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        setIsDragging(true);
    };
    
    const dragLeaveHandler = () => setIsDragging(false);
    
    const dropHandler = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        setIsDragging(false);
        if (ev.dataTransfer.files) {
            handleFiles(ev.dataTransfer.files);
        }
    };
    
    const setProjectAssets = (newAssets: AssetFile[]) => {
        updateActiveProjectData({ assets: newAssets });
    }

    const handleAnalyzeAssets = async () => {
        const unanalyzedImages = assets.filter(a => a.type === 'image' && !a.analysis && !a.isAnalyzing);
        if (unanalyzedImages.length === 0) {
            addToast("No new images to analyze.", 'info');
            return;
        }

        setIsAnalyzing(true);
        setProjectAssets(assets.map(a => unanalyzedImages.find(u => u.id === a.id) ? { ...a, isAnalyzing: true } : a));

        const analysisPromises = unanalyzedImages.map(async (asset) => {
            try {
                const base64Image = await fileToBase64(asset.file);
                const result = await analyzeAdCreative({ mimeType: asset.file.type, data: base64Image });
                return { id: asset.id, result };
            } catch (error) {
                console.error(`Failed to analyze asset ${asset.file.name}:`, error);
                return { id: asset.id, result: { rating: 'Needs Improvement', feedback: 'Yugn AI analysis failed for this asset.' } as const };
            }
        });

        const results = await Promise.all(analysisPromises);
        
        const currentAssets = getActiveProject()?.assets || [];
        setProjectAssets(currentAssets.map(a => {
            const analysisResult = results.find(r => r.id === a.id);
            if (analysisResult) {
                return { ...a, isAnalyzing: false, analysis: analysisResult.result };
            }
            return a;
        }));
        addToast(`Analyzed ${results.length} new image(s).`, 'success');
        setIsAnalyzing(false);
    };

    const handleOpenStudio = (asset: AssetFile) => {
        if (!activeProject?.strategy) {
            addToast("Please generate a strategy first to use the AI Campaign Studio.", 'error');
            return;
        }
        setSelectedAssetForStudio(asset);
        setIsStudioModalOpen(true);
    };

    const handleGetSuggestions = async (assetId: string) => {
        const asset = assets.find(a => a.id === assetId);
        if (!asset || asset.type !== 'image') return;
        
        setProjectAssets(assets.map(a => a.id === assetId ? { ...a, isSuggesting: true } : a));
        try {
            const base64Image = await fileToBase64(asset.file);
            const suggestions = await generateCreativeImprovementSuggestions({ mimeType: asset.file.type, data: base64Image });
            const currentAssets = getActiveProject()?.assets || [];
            setProjectAssets(currentAssets.map(a => a.id === assetId ? { ...a, analysis: { ...a.analysis!, suggestions }, isSuggesting: false } : a));
        } catch (error) {
            addToast("Failed to get improvement ideas.", 'error');
            const currentAssets = getActiveProject()?.assets || [];
            setProjectAssets(currentAssets.map(a => a.id === assetId ? { ...a, isSuggesting: false } : a));
        }
    };

    const handleGenerateTags = async () => {
        const untaggedImages = assets.filter(a => a.type === 'image' && !a.tags && !a.isGeneratingTags);
        if (untaggedImages.length === 0) {
            addToast("No new images to tag.", 'info');
            return;
        }

        setIsTagging(true);
        setProjectAssets(assets.map(a => untaggedImages.find(u => u.id === a.id) ? { ...a, isGeneratingTags: true } : a));

        const taggingPromises = untaggedImages.map(async (asset) => {
            try {
                const base64Image = await fileToBase64(asset.file);
                const tags = await generateImageTags({ mimeType: asset.file.type, data: base64Image });
                return { id: asset.id, tags };
            } catch (error) {
                console.error(`Failed to generate tags for asset ${asset.file.name}:`, error);
                return { id: asset.id, tags: ['tagging_failed'] };
            }
        });

        const results = await Promise.all(taggingPromises);
        
        const currentAssets = getActiveProject()?.assets || [];
        setProjectAssets(currentAssets.map(a => {
            const tagResult = results.find(r => r.id === a.id);
            if (tagResult) {
                return { ...a, isGeneratingTags: false, tags: tagResult.tags };
            }
            return a;
        }));
        addToast(`Generated tags for ${results.length} new image(s).`, 'success');
        setIsTagging(false);
    };

    const handleAddGeneratedAsset = (generatedImage: GeneratedImage) => {
        if (!activeProject) return;

        const imageBytes = generatedImage.image?.imageBytes;
        const mimeType = generatedImage.image?.mimeType;
        
        if (!imageBytes || !mimeType) {
            addToast("Generated image is missing data and cannot be added.", "error");
            return;
        }

        const filename = `yugn-ai-generated-${Date.now()}.jpeg`;
        const file = base64ToFile(imageBytes, filename, mimeType);

        const newAsset: AssetFile = {
            id: `${file.name}-${Date.now()}`,
            file,
            preview: URL.createObjectURL(file),
            type: 'image',
        };

        updateActiveProjectData({ assets: [...assets, newAsset] });
        addToast("Image added to asset library!", "success");
    };
    
    const filteredAssets = useMemo(() => {
        if (activeFilter === 'all') {
            return assets;
        }
        return assets.filter(asset => asset.type === activeFilter);
    }, [assets, activeFilter]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                 <GenerateImageModal 
                    isOpen={isGenerateModalOpen}
                    onClose={() => setIsGenerateModalOpen(false)}
                    onAddToAssets={handleAddGeneratedAsset}
                 />
                 <CampaignStudioModal 
                    isOpen={isStudioModalOpen}
                    onClose={() => setIsStudioModalOpen(false)}
                    asset={selectedAssetForStudio}
                    strategy={activeProject?.strategy || null}
                    businessData={activeProject?.businessData || null}
                 />
                 <Card>
                    <div 
                        className={`p-10 text-center border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isDragging ? 'border-accent bg-accent/10' : 'border-primary/50 bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20'}`}
                        onDragOver={dragOverHandler}
                        onDragLeave={dragLeaveHandler}
                        onDrop={dropHandler}
                        onClick={() => document.getElementById('fileInput')?.click()}
                    >
                        <h3 className="text-xl font-semibold font-heading text-primary-text-light dark:text-primary-text-dark">📁 Drop files here or click to upload</h3>
                        <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark mt-1">Supports images, videos, and documents</p>
                        <input 
                            type="file" 
                            id="fileInput" 
                            multiple 
                            accept="image/*,video/*,.pdf,.doc,.docx" 
                            className="hidden" 
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                    </div>

                    <div className="flex gap-4 mt-6 flex-wrap">
                        <button onClick={handleAnalyzeAssets} disabled={isAnalyzing} className="px-5 py-2.5 text-sm text-white font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-primary/30 disabled:opacity-50 disabled:cursor-wait">
                            {isAnalyzing ? 'Analyzing...' : '🤖 Yugn AI Analysis'}
                        </button>
                        <button onClick={handleGenerateTags} disabled={isTagging} className="px-5 py-2.5 text-sm text-white font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-primary/30 disabled:opacity-50 disabled:cursor-wait">
                            {isTagging ? 'Tagging...' : '🏷️ Generate Tags'}
                        </button>
                        <button onClick={() => setIsGenerateModalOpen(true)} className="px-5 py-2.5 text-sm text-white font-semibold rounded-lg bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md shadow-primary/30 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4"/>
                            Generate Image
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-8 border-t border-border-light dark:border-border-dark pt-6">
                        <FilterButton
                            label="All"
                            count={assets.length}
                            isActive={activeFilter === 'all'}
                            onClick={() => setActiveFilter('all')}
                        />
                        <FilterButton
                            label="Images"
                            count={assets.filter(a => a.type === 'image').length}
                            isActive={activeFilter === 'image'}
                            onClick={() => setActiveFilter('image')}
                        />
                        <FilterButton
                            label="Videos"
                            count={assets.filter(a => a.type === 'video').length}
                            isActive={activeFilter === 'video'}
                            onClick={() => setActiveFilter('video')}
                        />
                        <FilterButton
                            label="Documents"
                            count={assets.filter(a => a.type === 'document').length}
                            isActive={activeFilter === 'document'}
                            onClick={() => setActiveFilter('document')}
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className="relative group bg-slate-50 dark:bg-surface-dark/60 rounded-xl p-4 text-center transition-all flex flex-col border border-border-light/50 dark:border-border-dark/50 hover:shadow-md hover:-translate-y-1">
                                <div className="relative w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {asset.type === 'image' && <img src={asset.preview} alt={asset.file.name} className="w-full h-full object-cover"/>}
                                    {asset.type === 'video' && <video src={asset.preview} className="w-full h-full object-cover" />}
                                    {asset.type === 'document' && <span className="text-4xl">📄</span>}
                                    {(asset.isAnalyzing || asset.isGeneratingTags) && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-md">
                                            <div className="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark truncate font-medium mb-2">{asset.file.name}</p>
                                
                                {asset.tags && (
                                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                                        {asset.tags.map(tag => <span key={tag} className="text-xs bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5">{tag}</span>)}
                                    </div>
                                )}
                                
                                <div className="mt-auto space-y-2">
                                    {asset.type === 'image' && (
                                        <button 
                                            onClick={() => handleOpenStudio(asset)}
                                            disabled={!activeProject?.strategy}
                                            className="text-xs w-full text-white font-semibold bg-primary hover:bg-primary-hover rounded px-2 py-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                           <SparklesIcon className="w-3 h-3 inline-block mr-1"/> AI Campaign Studio
                                        </button>
                                    )}

                                    {asset.analysis && (
                                        <div className="text-left">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${ratingClasses[asset.analysis.rating]}`}>
                                                {asset.analysis.rating}
                                            </span>
                                            <p className="text-xs text-secondary-text-light dark:text-secondary-text-dark mt-2">{asset.analysis.feedback}</p>
                                            {asset.analysis.suggestions && (
                                                <ul className="text-xs mt-2 list-disc pl-4 space-y-1 text-secondary-text-light dark:text-secondary-text-dark">
                                                    {asset.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            )}
                                            {asset.analysis.rating !== 'Excellent' && !asset.analysis.suggestions && (
                                                <button 
                                                    onClick={() => handleGetSuggestions(asset.id)} 
                                                    disabled={asset.isSuggesting}
                                                    className="text-xs text-white font-semibold bg-secondary hover:bg-primary rounded px-2 py-1.5 mt-2 w-full transition disabled:opacity-50"
                                                >
                                                    {asset.isSuggesting ? 'Thinking...' : 'Get Improvement Ideas'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => deleteAsset(asset.id)} className="absolute top-2 right-2 bg-danger/80 hover:bg-danger text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all z-10">
                                    &times;
                                </button>
                            </div>
                        ))}
                         {filteredAssets.length === 0 && assets.length > 0 && (
                            <div className="col-span-full text-center py-10">
                                <p className="text-secondary-text-light dark:text-secondary-text-dark">No assets match the current filter.</p>
                            </div>
                        )}
                         {assets.length === 0 && (
                             <div className="col-span-full text-center py-16 bg-slate-50 dark:bg-surface-dark/50 rounded-xl">
                                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse-slow">
                                    <AssetsIcon className="w-12 h-12 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold font-heading mt-4">Your asset library is empty</h4>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark mt-1">Upload your first creative to get started.</p>
                            </div>
                        )}
                    </div>
                 </Card>
            </div>
        </div>
    );
};

export default AssetManager;