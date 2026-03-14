import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, X, Upload } from 'lucide-react';

// Default trail map images - using reliable CDN hosted images
const RESORT_MAPS = {
  'whistler': 'https://www.skicentral.com/trailmaps/images/500/bc0002-500.jpg',
  'blackcomb': 'https://www.skicentral.com/trailmaps/images/500/bc0002-500.jpg',
  'default': 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=1200&q=80'
};

export function ResortMapImage({ resort, className = '' }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  // Get map URL based on resort name or map_url field
  const getMapUrl = () => {
    // First check if resort has a custom map_url in the database
    if (resort?.map_url) return resort.map_url;
    
    if (!resort?.name) return RESORT_MAPS.default;
    
    const name = resort.name.toLowerCase();
    if (name.includes('whistler') || name.includes('blackcomb')) {
      return RESORT_MAPS.whistler;
    }
    
    return RESORT_MAPS.default;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const MapContent = ({ fullscreen = false }) => (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl ${fullscreen ? 'w-full h-full' : 'h-48'}`}
      style={{ 
        backgroundColor: '#1A2126',
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {imageError ? (
        // Show placeholder when image fails to load
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <Upload size={32} style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-2" />
          <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Manrope, sans-serif' }}>
            Trail map not available
          </p>
          <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Add a map_url to your ski_areas table
          </p>
        </div>
      ) : (
        <img
          src={getMapUrl()}
          alt={`${resort?.name || 'Resort'} Trail Map`}
          className="w-full h-full object-cover select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          draggable={false}
          onError={handleImageError}
        />
      )}

      {/* Zoom Controls - only show when image loaded */}
      {!imageError && (
        <div 
          className="absolute bottom-3 right-3 flex items-center gap-1 p-1 rounded-lg"
          style={{ backgroundColor: 'rgba(26, 33, 38, 0.9)' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            disabled={zoom <= 1}
            style={{ opacity: zoom <= 1 ? 0.4 : 1 }}
          >
            <ZoomOut size={18} style={{ color: '#00B4D8' }} />
          </button>
          <span 
            className="px-2 text-xs font-medium min-w-[40px] text-center"
            style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            disabled={zoom >= 4}
            style={{ opacity: zoom >= 4 ? 0.4 : 1 }}
          >
            <ZoomIn size={18} style={{ color: '#00B4D8' }} />
          </button>
          {!fullscreen && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
              className="p-2 rounded-lg transition-colors hover:bg-white/10 ml-1"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Maximize2 size={18} style={{ color: '#00B4D8' }} />
            </button>
          )}
        </div>
      )}

      {/* Reset button when zoomed */}
      {zoom > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); resetView(); }}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-white/20"
          style={{ 
            backgroundColor: 'rgba(26, 33, 38, 0.9)',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: 'Manrope, sans-serif'
          }}
        >
          Reset
        </button>
      )}

      {/* Map label */}
      <div 
        className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: 'rgba(26, 33, 38, 0.9)',
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'Manrope, sans-serif'
        }}
      >
        Trail Map
      </div>
    </div>
  );

  return (
    <>
      <div className={className} data-testid="resort-map-image">
        <MapContent />
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
        >
          <button
            onClick={() => { setIsFullscreen(false); resetView(); }}
            className="absolute top-4 right-4 p-3 rounded-full transition-colors hover:bg-white/10"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <X size={24} style={{ color: 'white' }} />
          </button>
          
          <div className="w-full h-full max-w-6xl max-h-[90vh]">
            <MapContent fullscreen />
          </div>
        </div>
      )}
    </>
  );
}
