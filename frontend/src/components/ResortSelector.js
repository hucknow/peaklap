import { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Search, X, MapPin, Mountain, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export function ResortSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  allResorts, 
  recentResorts, 
  myResorts,
  selectedResort,
  detectedResort 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyResorts, setShowMyResorts] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredResorts = (showMyResorts ? myResorts : allResorts).filter(resort =>
    resort.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resort.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resort.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (resort) => {
    onSelect(resort);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Bottom Sheet */}
      <div 
        className="relative w-full max-w-lg max-h-[85vh] rounded-t-3xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: '#1A2126' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Select Resort
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resorts..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: '#12181B',
                color: 'white',
                fontFamily: 'Manrope, sans-serif'
              }}
              data-testid="resort-search"
            />
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setShowMyResorts(false)}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: !showMyResorts ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                color: !showMyResorts ? '#000' : 'rgba(255,255,255,0.7)',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              All Resorts
            </button>
            <button
              onClick={() => setShowMyResorts(true)}
              className="flex-1 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: showMyResorts ? '#00B4D8' : 'rgba(255,255,255,0.05)',
                color: showMyResorts ? '#000' : 'rgba(255,255,255,0.7)',
                fontFamily: 'Manrope, sans-serif'
              }}
            >
              My Resorts ({myResorts.length})
            </button>
          </div>
        </div>

        {/* Recent Resorts */}
        {recentResorts.length > 0 && !searchQuery && (
          <div className="px-6 pb-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              RECENTLY VISITED
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
              {recentResorts.map(resort => (
                <button
                  key={resort.id}
                  onClick={() => handleSelect(resort)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all hover:bg-white/10"
                  style={{
                    backgroundColor: selectedResort?.id === resort.id ? 'rgba(0, 180, 216, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: selectedResort?.id === resort.id ? '#00B4D8' : 'rgba(255,255,255,0.8)',
                    border: selectedResort?.id === resort.id ? '1px solid #00B4D8' : '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'Manrope, sans-serif'
                  }}
                >
                  {resort.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Detected Resort Banner */}
        {detectedResort && detectedResort.id !== selectedResort?.id && (
          <div 
            className="mx-6 mb-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/10"
            style={{ 
              backgroundColor: 'rgba(0, 180, 216, 0.1)',
              border: '1px solid rgba(0, 180, 216, 0.3)'
            }}
            onClick={() => handleSelect(detectedResort)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 180, 216, 0.2)' }}
              >
                <MapPin size={20} style={{ color: '#00B4D8' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  GPS Detected: {detectedResort.name}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Tap to select
                </p>
              </div>
              <ChevronRight size={20} style={{ color: '#00B4D8' }} />
            </div>
          </div>
        )}

        {/* Resort List */}
        <div className="overflow-y-auto px-6 pb-8" style={{ maxHeight: '50vh' }}>
          {filteredResorts.length === 0 ? (
            <div className="text-center py-8">
              <Mountain size={40} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {searchQuery ? 'No resorts found' : 'No resorts yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResorts.map(resort => (
                <GlassCard
                  key={resort.id}
                  className="p-4 cursor-pointer transition-all hover:bg-white/10"
                  style={{
                    border: selectedResort?.id === resort.id ? '2px solid #00B4D8' : '1px solid rgba(255,255,255,0.08)'
                  }}
                  onClick={() => handleSelect(resort)}
                  data-testid={`resort-option-${resort.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'rgba(0, 180, 216, 0.1)' }}
                    >
                      <Mountain size={20} style={{ color: '#00B4D8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        {resort.name}
                      </h3>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {[resort.region, resort.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    {resort.visit_count > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium" style={{ color: '#00B4D8', fontFamily: 'JetBrains Mono, monospace' }}>
                          {resort.visit_count} runs
                        </p>
                        {resort.last_visit && (
                          <p className="text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <Clock size={10} />
                            {format(new Date(resort.last_visit), 'MMM d')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Animation styles */}
        <style>{`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
