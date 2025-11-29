"use client";

import { memo, useState, useCallback, useRef } from "react";
import { X, Image, Palette, Link2, Upload, Loader2 } from "lucide-react";
import type { PutBlobResult } from "@vercel/blob";
import { API_HEADERS } from "@/lib/constants";
import { logger } from "@/lib/logger";

const GRADIENT_COVERS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
  "linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)",
];

const SOLID_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
];

const UNSPLASH_THUMBNAILS = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=400&h=200&fit=crop&q=80",
  "https://images.unsplash.com/photo-1614851099511-773084f6911d?w=400&h=200&fit=crop&q=80",
];

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200&h=400&fit=crop&q=85",
  "https://images.unsplash.com/photo-1614851099511-773084f6911d?w=1200&h=400&fit=crop&q=85",
];

type TabType = "gallery" | "gradient" | "color" | "link" | "upload";

interface CoverSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cover: string | null) => void;
  currentCover: string | null;
}

const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label,
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon?: React.ElementType; 
  label?: string;
  children?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
      active
        ? "text-blue-600 border-b-2 border-blue-600"
        : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
    }`}
  >
    {Icon && <Icon size={16} />}
    {label || children}
  </button>
);

const GalleryTab = ({ onSelect, currentCover }: { onSelect: (url: string) => void; currentCover: string | null }) => (
  <div className="grid grid-cols-2 gap-3">
    {UNSPLASH_THUMBNAILS.map((thumbnailUrl, i) => {
      const fullSizeUrl = UNSPLASH_IMAGES[i];
      const isSelected = currentCover === fullSizeUrl || currentCover?.includes(thumbnailUrl.split('?')[0].split('/').pop() || '');
      return (
        <button
          key={thumbnailUrl}
          onClick={() => onSelect(fullSizeUrl)}
          className={`relative h-24 rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-blue-500 ${
            isSelected ? "ring-2 ring-blue-500" : ""
          }`}
        >
          <img
            src={thumbnailUrl}
            alt={`Cover option ${i + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            width={400}
            height={200}
          />
        </button>
      );
    })}
  </div>
);

const GradientTab = ({ onSelect, currentCover }: { onSelect: (gradient: string) => void; currentCover: string | null }) => (
  <div className="grid grid-cols-3 gap-3">
    {GRADIENT_COVERS.map((gradient, i) => (
      <button
        key={i}
        onClick={() => onSelect(gradient)}
        className={`h-16 rounded-lg transition-all hover:ring-2 hover:ring-blue-500 ${
          currentCover === gradient ? "ring-2 ring-blue-500" : ""
        }`}
        style={{ background: gradient }}
        aria-label={`Gradient ${i + 1}`}
      />
    ))}
  </div>
);

const ColorTab = ({ onSelect, currentCover }: { onSelect: (color: string) => void; currentCover: string | null }) => (
  <div className="grid grid-cols-8 gap-2">
    {SOLID_COLORS.map((color, i) => (
      <button
        key={i}
        onClick={() => onSelect(color)}
        className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${
          currentCover === color ? "ring-2 ring-blue-500 ring-offset-2" : ""
        }`}
        style={{ backgroundColor: color }}
        aria-label={`Color ${color}`}
      />
    ))}
  </div>
);

const LinkTab = ({ onSelect }: { onSelect: (url: string) => void }) => {
  const [customUrl, setCustomUrl] = useState("");

  const handleSubmit = () => {
    if (customUrl.trim()) {
      onSelect(customUrl.trim());
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="url"
        value={customUrl}
        onChange={(e) => setCustomUrl(e.target.value)}
        placeholder="បញ្ចូលតំណរូបភាព..."
        className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent dark:text-zinc-200"
      />
      <button
        onClick={handleSubmit}
        disabled={!customUrl.trim()}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ប្រើរូបភាព
      </button>
    </div>
  );
};

const UploadTab = ({ onSelect }: { onSelect: (url: string) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);

    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: { [API_HEADERS.CLIENT_KEY]: API_HEADERS.CLIENT_VALUE },
          body: file,
        },
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const newBlob = (await response.json()) as PutBlobResult;
      onSelect(newBlob.url);
    } catch (error) {
      logger.error("Error uploading file", error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
      onClick={() => !isUploading && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm">កំពុងផ្ទុកឡើង...</span>
        </div>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium text-gray-600 dark:text-zinc-300">
            ចុចដើម្បីជ្រើសរើសរូបភាព
          </span>
          <span className="text-xs text-gray-400 mt-1">
            PNG, JPG, GIF up to 4MB
          </span>
        </>
      )}
    </div>
  );
};

export const CoverSelector = memo(function CoverSelector({
  isOpen,
  onClose,
  onSelect,
  currentCover,
}: CoverSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("gallery");

  const handleSelect = useCallback(
    (cover: string) => {
      onSelect(cover);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleRemove = useCallback(() => {
    onSelect(null);
    onClose();
  }, [onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800">
          <h3 className="font-semibold text-gray-900 dark:text-zinc-100">ជ្រើសរើសគម្រប</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} className="text-gray-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="flex border-b dark:border-zinc-800 overflow-x-auto">
          <TabButton 
            active={activeTab === "gallery"} 
            onClick={() => setActiveTab("gallery")} 
            icon={Image} 
            label="រូបភាព" 
          />
          <TabButton 
            active={activeTab === "gradient"} 
            onClick={() => setActiveTab("gradient")} 
            icon={Palette} 
            label="ជម្រាល" 
          />
          <TabButton 
            active={activeTab === "color"} 
            onClick={() => setActiveTab("color")} 
            label="ពណ៌"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-blue-500" />
            ពណ៌
          </TabButton>
          <TabButton 
            active={activeTab === "link"} 
            onClick={() => setActiveTab("link")} 
            icon={Link2} 
            label="តំណ" 
          />
          <TabButton 
            active={activeTab === "upload"} 
            onClick={() => setActiveTab("upload")} 
            icon={Upload} 
            label="ផ្ទុកឡើង" 
          />
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {activeTab === "gallery" && (
            <GalleryTab onSelect={handleSelect} currentCover={currentCover} />
          )}

          {activeTab === "gradient" && (
            <GradientTab onSelect={handleSelect} currentCover={currentCover} />
          )}

          {activeTab === "color" && (
            <ColorTab onSelect={handleSelect} currentCover={currentCover} />
          )}

          {activeTab === "link" && (
            <LinkTab onSelect={handleSelect} />
          )}

          {activeTab === "upload" && (
            <UploadTab onSelect={handleSelect} />
          )}
        </div>

        {currentCover && (
          <div className="p-4 border-t dark:border-zinc-800">
            <button
              onClick={handleRemove}
              className="w-full py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
              លុបគម្រប
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
