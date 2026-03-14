import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function RunDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [run, setRun] = useState(null);
  const [isInBucketList, setIsInBucketList] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // Refs to prevent duplicate fetches
  const runLoadedRef = useRef(null);
  const bucketCheckedRef = useRef(null);
  const logsLoadedRef = useRef(null);

  const loadRun = useCallback(async () => {
    if (!id || runLoadedRef.current === id) return;
    
    const { data } = await supabase
      .from('runs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setRun(data);
      runLoadedRef.current = id;
    }
  }, [id]);

  const checkBucketList = useCallback(async () => {
    if (!profile?.id || !id) return;
    const cacheKey = `${profile.id}-${id}`;
    if (bucketCheckedRef.current === cacheKey) return;
    
    const { data } = await supabase
      .from('bucket_list')
      .select('id')
      .eq('user_id', profile.id)
      .eq('run_id', id)
      .single();
    
    setIsInBucketList(!!data);
    bucketCheckedRef.current = cacheKey;
  }, [profile?.id, id]);

  const loadRecentLogs = useCallback(async () => {
    if (!id || logsLoadedRef.current === id) return;
    
    const { data } = await supabase
      .from('user_logs')
      .select('snow_condition, logged_at')
      .eq('run_id', id)
      .order('logged_at', { ascending: false })
      .limit(3);
    
    if (data) {
      setRecentLogs(data);
      logsLoadedRef.current = id;
    }
  }, [id]);

  // Load run data when id changes
  useEffect(() => {
    if (id) {
      // Reset refs if id changed
      if (runLoadedRef.current !== id) {
        runLoadedRef.current = null;
        logsLoadedRef.current = null;
      }
      loadRun();
      loadRecentLogs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id primitive

  // Check bucket list when profile becomes available
  useEffect(() => {
    if (profile?.id && id) {
      checkBucketList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, id]); // Only depend on primitive ids

  const toggleBucketList = async () => {
    if (!profile) return;

    try {
      if (isInBucketList) {
        // Use proper { data, error } destructuring
        // NEVER call .json() or .text() on Supabase responses
        const { error } = await supabase
          .from('bucket_list')
          .delete()
          .eq('user_id', profile.id)
          .eq('run_id', id);
        
        if (error) {
          console.error('Error removing from bucket list:', error);
          toast.error('Failed to remove from bucket list');
          return;
        }
        setIsInBucketList(false);
        toast.success('Removed from bucket list');
      } else {
        // Use proper { data, error } destructuring
        const { error } = await supabase
          .from('bucket_list')
          .insert({ user_id: profile.id, run_id: id });
        
        if (error) {
          console.error('Error adding to bucket list:', error);
          toast.error('Failed to add to bucket list');
          return;
        }
        setIsInBucketList(true);
        toast.success('Added to bucket list!');
      }
    } catch (err) {
      console.error('Error toggling bucket list:', err);
      toast.error('Failed to update bucket list');
    }
  };

  if (!run) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#12181B' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#12181B' }} data-testid="run-detail-page">
      {/* Header */}
      <div className="p-6">
        <button
          onClick={() => navigate('/runs')}
          className="mb-4 flex items-center gap-2"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          <span style={{ fontFamily: 'Manrope, sans-serif' }}>Back</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {run.name}
        </h1>

        {run.difficulty && (
          <div className="mb-4">
            <DifficultyBadge difficulty={run.difficulty} region={profile?.difficulty_region} className="text-base px-4 py-2" />
          </div>
        )}

        {/* Info Grid */}
        <GlassCard className="p-6 mb-4">
          <div className="grid grid-cols-2 gap-4">
            {run.vertical_ft && (
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
                  Vertical
                </div>
                <div className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {run.vertical_ft.toLocaleString()} ft
                </div>
              </div>
            )}
            {run.length_m && (
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
                  Length
                </div>
                <div className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {run.length_m.toLocaleString()} m
                </div>
              </div>
            )}
            {run.zone && (
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
                  Zone
                </div>
                <div className="text-lg font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {run.zone}
                </div>
              </div>
            )}
            {run.grooming && (
              <div>
                <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope, sans-serif' }}>
                  Grooming
                </div>
                <div className="text-lg font-semibold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {run.grooming}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Description */}
        {run.description && (
          <GlassCard className="p-6 mb-4">
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              About This Run
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {run.description}
            </p>
          </GlassCard>
        )}

        {/* Recent Conditions */}
        {recentLogs.length > 0 && (
          <GlassCard className="p-6 mb-4">
            <h2 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Recent Conditions
            </h2>
            <div className="space-y-2">
              {recentLogs.map((log, index) => (
                <div key={index} className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {log.snow_condition}
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            data-testid="log-this-run-button"
            onClick={() => navigate('/log', { state: { selectedRun: run } })}
            className="flex-1 py-3 rounded-full font-semibold"
            style={{
              backgroundColor: '#00B4D8',
              color: '#000000',
              fontFamily: 'Manrope, sans-serif'
            }}
          >
            Log This Run
          </button>
          <button
            data-testid="bucket-list-button"
            onClick={toggleBucketList}
            className="px-6 py-3 rounded-full"
            style={{
              backgroundColor: isInBucketList ? '#FF1744' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <Heart 
              size={20} 
              style={{ color: isInBucketList ? 'white' : 'rgba(255,255,255,0.7)' }}
              fill={isInBucketList ? 'white' : 'none'}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
