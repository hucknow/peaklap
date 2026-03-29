import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Loader as Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditResort() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resort, setResort] = useState(null);
  const [stats, setStats] = useState(null);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [website, setWebsite] = useState('');
  const [elevationBase, setElevationBase] = useState('');
  const [elevationSummit, setElevationSummit] = useState('');
  const [operatingStatus, setOperatingStatus] = useState('open');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isPublished, setIsPublished] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/settings');
      return;
    }

    loadResort();
  }, [id, profile, navigate]);

  const loadResort = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ski_areas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setResort(data);
      setName(data.name || '');
      setCountry(data.country || '');
      setRegion(data.region || '');
      setWebsite(data.website || '');
      setElevationBase(data.elevation_base_m || '');
      setElevationSummit(data.elevation_summit_m || '');
      setOperatingStatus(data.operating_status || 'open');
      setDisplayOrder(data.display_order || '0');
      setIsPublished(data.is_published || false);
      setMapUrl(data.map_url || '');

      await loadStats(id);
    } catch (err) {
      console.error('Error loading resort:', err);
      toast.error('Failed to load resort');
      navigate('/admin/manage-resorts');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (resortId) => {
    try {
      const [runsResponse, liftsResponse] = await Promise.all([
        supabase
          .from('runs')
          .select('piste_difficulty, difficulty')
          .eq('ski_area_id', resortId),
        supabase
          .from('lifts')
          .select('aerialway, lift_type')
          .eq('ski_area_id', resortId)
      ]);

      const runs = runsResponse.data || [];
      const lifts = liftsResponse.data || [];

      const difficultyStats = {
        novice: 0,
        easy: 0,
        intermediate: 0,
        advanced: 0,
        expert: 0,
        freeride: 0
      };

      runs.forEach(run => {
        const diff = run.piste_difficulty || run.difficulty;
        if (diff && difficultyStats.hasOwnProperty(diff)) {
          difficultyStats[diff]++;
        }
      });

      const liftTypeStats = {};
      lifts.forEach(lift => {
        const type = lift.aerialway || lift.lift_type || 'unknown';
        liftTypeStats[type] = (liftTypeStats[type] || 0) + 1;
      });

      setStats({ difficultyStats, liftTypeStats });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const logAdminAction = async (action, targetId, targetType, details) => {
    try {
      await supabase.rpc('log_admin_action', {
        p_action: action,
        p_target_id: targetId,
        p_target_type: targetType,
        p_details: details
      });
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const baseM = elevationBase ? parseInt(elevationBase) : null;
      const summitM = elevationSummit ? parseInt(elevationSummit) : null;
      const verticalM = baseM && summitM ? summitM - baseM : null;

      const updates = {
        name,
        country,
        region,
        website,
        elevation_base_m: baseM,
        elevation_summit_m: summitM,
        vertical_m: verticalM,
        operating_status: operatingStatus,
        display_order: parseInt(displayOrder) || 0,
        is_published: isPublished,
        map_url: mapUrl
      };

      const { error } = await supabase
        .from('ski_areas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await logAdminAction('edit_resort', id, 'ski_area', { name, updates });

      toast.success('Resort updated successfully');
      navigate('/admin/manage-resorts');
    } catch (err) {
      console.error('Error saving resort:', err);
      toast.error('Failed to save resort');
    } finally {
      setSaving(false);
    }
  };

  if (!profile?.is_admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const verticalCalc = elevationBase && elevationSummit
    ? parseInt(elevationSummit) - parseInt(elevationBase)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/manage-resorts')}
          className="mb-4"
        >
          ← Back to Manage Resorts
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Resort: {resort?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resort Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Resort name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="US, CA, FR, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <Input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Colorado, British Columbia, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Base Elevation (m)</label>
                <Input
                  type="number"
                  value={elevationBase}
                  onChange={(e) => setElevationBase(e.target.value)}
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Summit Elevation (m)</label>
                <Input
                  type="number"
                  value={elevationSummit}
                  onChange={(e) => setElevationSummit(e.target.value)}
                  placeholder="2500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Vertical (m)</label>
                <Input
                  type="number"
                  value={verticalCalc}
                  disabled
                  className="bg-slate-100"
                />
                <p className="text-xs text-slate-500 mt-1">Auto-calculated: Summit - Base</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Operating Status</label>
                <select
                  value={operatingStatus}
                  onChange={(e) => setOperatingStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Order</label>
                <Input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">Lower numbers appear first</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Trail Map URL</label>
                <Input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="https://example.com/map.jpg"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Published</p>
                <p className="text-sm text-slate-600">
                  {isPublished ? 'Visible to all users' : 'Hidden from users'}
                </p>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Read-Only Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">OSM ID</label>
                <p className="text-sm text-slate-600">{resort?.osm_id || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <Badge className="mt-1">{resort?.source || 'manual'}</Badge>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Load Status</label>
                <Badge className="mt-1">{resort?.load_status || 'unknown'}</Badge>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Synced</label>
                <p className="text-sm text-slate-600">
                  {resort?.last_synced_at
                    ? new Date(resort.last_synced_at).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Runs by Difficulty</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(stats.difficultyStats).map(([diff, count]) => (
                    <div key={diff} className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="capitalize text-sm">{diff}</span>
                      <span className="font-semibold text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Lifts by Type</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(stats.liftTypeStats).map(([type, count]) => (
                    <div key={type} className="flex justify-between p-2 bg-slate-50 rounded">
                      <span className="capitalize text-sm">{type.replace('_', ' ')}</span>
                      <span className="font-semibold text-sm">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/manage-resorts')}
            className="flex-1"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
