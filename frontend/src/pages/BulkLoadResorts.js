import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Search, Loader as Loader2, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle, Mountain } from 'lucide-react';
import { toast } from 'sonner';

const OPENSKIDATA_API = 'https://api.openskidata.org';
const MAX_BULK_LOAD = 50;
const DELAY_BETWEEN_LOADS = 500;

export default function BulkLoadResorts() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResorts, setSelectedResorts] = useState(new Set());
  const [existingOsmIds, setExistingOsmIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState([]);
  const [currentStep, setCurrentStep] = useState('search');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/settings');
      return;
    }

    loadExistingResorts();
  }, [profile, navigate]);

  const loadExistingResorts = async () => {
    const { data } = await supabase
      .from('ski_areas')
      .select('osm_id')
      .not('osm_id', 'is', null);

    if (data) {
      setExistingOsmIds(new Set(data.map(r => r.osm_id)));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(`${OPENSKIDATA_API}/skiAreas?q=${encodeURIComponent(searchQuery)}&limit=50`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.features || []);
      setCurrentStep('select');
    } catch (err) {
      toast.error('Failed to search resorts');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const toggleResort = (osmId) => {
    const newSelected = new Set(selectedResorts);
    if (newSelected.has(osmId)) {
      newSelected.delete(osmId);
    } else {
      newSelected.add(osmId);
    }
    setSelectedResorts(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set();
    searchResults.forEach(resort => {
      const osmId = resort.properties?.osm_id || resort.properties?.id;
      if (osmId && !existingOsmIds.has(String(osmId))) {
        newSelected.add(osmId);
      }
    });
    setSelectedResorts(newSelected);
  };

  const deselectAll = () => {
    setSelectedResorts(new Set());
  };

  const convertMetersToFeet = (meters) => {
    if (!meters) return null;
    return Math.round(meters * 3.28084);
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

  const loadSingleResort = async (feature) => {
    const props = feature.properties;
    const osmId = props.osm_id || props.id;
    const openSkiMapId = feature.id;
    const name = props.name || 'Unknown Resort';

    try {
      if (existingOsmIds.has(String(osmId))) {
        return { success: false, name, error: 'Already exists' };
      }

      const skiAreaData = {
        name,
        area_type: props.type,
        country: props.location?.iso3166_1Alpha2,
        region: props.location?.localized?.en?.region,
        website: props.websites?.[0],
        skimap_id: props.skimap_id,
        boundary: feature.geometry,
        osm_id: String(osmId),
        is_published: false,
        is_active: true,
        load_status: 'loading',
        source: 'openskidata',
        last_synced_at: new Date().toISOString()
      };

      const { data: skiArea, error: skiAreaError } = await supabase
        .from('ski_areas')
        .insert([skiAreaData])
        .select()
        .single();

      if (skiAreaError) throw skiAreaError;

      const runsResponse = await fetch(`${OPENSKIDATA_API}/runs?skiAreaID=${openSkiMapId}`);
      if (!runsResponse.ok) throw new Error('Failed to fetch runs');
      const runsData = await runsResponse.json();
      const runFeatures = runsData.features || [];

      const liftsResponse = await fetch(`${OPENSKIDATA_API}/lifts?skiAreaID=${openSkiMapId}`);
      if (!liftsResponse.ok) throw new Error('Failed to fetch lifts');
      const liftsData = await liftsResponse.json();
      const liftFeatures = liftsData.features || [];

      if (runFeatures.length > 0) {
        const runsToInsert = runFeatures.map(f => ({
          ski_area_id: skiArea.id,
          name: f.properties.name,
          piste_type: f.properties['piste:type'],
          difficulty: f.properties['piste:difficulty'],
          piste_difficulty: f.properties['piste:difficulty'],
          grooming: f.properties['piste:grooming'],
          ref: f.properties.ref,
          description: f.properties.description,
          vertical_ft: convertMetersToFeet(f.properties.vertical),
          length_m: f.properties.length,
          geom: f.geometry
        }));

        const { error: runsError } = await supabase
          .from('runs')
          .insert(runsToInsert);

        if (runsError) throw runsError;
      }

      if (liftFeatures.length > 0) {
        const liftsToInsert = liftFeatures.map(f => ({
          ski_area_id: skiArea.id,
          name: f.properties.name,
          lift_type: f.properties.aerialway,
          aerialway: f.properties.aerialway,
          capacity: f.properties.capacity?.total,
          ref: f.properties.ref,
          geom: f.geometry
        }));

        const { error: liftsError } = await supabase
          .from('lifts')
          .insert(liftsToInsert);

        if (liftsError) throw liftsError;
      }

      const { error: updateError } = await supabase
        .from('ski_areas')
        .update({
          load_status: 'loaded',
          run_count: runFeatures.length,
          lift_count: liftFeatures.length
        })
        .eq('id', skiArea.id);

      if (updateError) throw updateError;

      await logAdminAction('bulk_load_resort', skiArea.id, 'ski_area', {
        name,
        osm_id: osmId,
        runs: runFeatures.length,
        lifts: liftFeatures.length
      });

      return {
        success: true,
        name,
        runs: runFeatures.length,
        lifts: liftFeatures.length,
        skiAreaId: skiArea.id
      };

    } catch (err) {
      console.error(`Error loading ${name}:`, err);

      try {
        await supabase
          .from('ski_areas')
          .delete()
          .eq('osm_id', String(osmId));
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }

      return {
        success: false,
        name,
        error: err.message || 'Unknown error'
      };
    }
  };

  const handleBulkLoad = async () => {
    const resortsToLoad = Array.from(selectedResorts)
      .slice(0, MAX_BULK_LOAD)
      .map(osmId => searchResults.find(r => (r.properties?.osm_id || r.properties?.id) === osmId))
      .filter(Boolean);

    if (resortsToLoad.length === 0) {
      toast.error('No resorts selected');
      return;
    }

    setLoading(true);
    setCurrentStep('loading');
    setLoadProgress([]);

    const results = [];

    for (let i = 0; i < resortsToLoad.length; i++) {
      const resort = resortsToLoad[i];
      const name = resort.properties.name || 'Unknown';

      setLoadProgress(prev => [...prev, { name, status: 'loading' }]);

      const result = await loadSingleResort(resort);

      setLoadProgress(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          name,
          status: result.success ? 'success' : 'error',
          ...result
        };
        return updated;
      });

      results.push(result);

      if (i < resortsToLoad.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LOADS));
      }
    }

    setLoading(false);
    setCurrentStep('complete');

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    toast.success(`Loaded ${successCount} of ${results.length} resorts`);

    if (failCount > 0) {
      toast.error(`${failCount} resorts failed to load`);
    }

    await loadExistingResorts();
  };

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="h-6 w-6" />
              Bulk Load from OpenSkiData
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 'search' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search for ski resorts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>
                <p className="text-sm text-slate-600">
                  Search by resort name, location, or region
                </p>
              </div>
            )}

            {currentStep === 'select' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Found {searchResults.length} resorts</h3>
                    <p className="text-sm text-slate-600">{selectedResorts.size} selected</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Deselect All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep('search')}>
                      New Search
                    </Button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {searchResults.map((resort, idx) => {
                    const props = resort.properties;
                    const osmId = props.osm_id || props.id;
                    const alreadyLoaded = existingOsmIds.has(String(osmId));
                    const isSelected = selectedResorts.has(osmId);

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${alreadyLoaded ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleResort(osmId)}
                          disabled={alreadyLoaded}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{props.name || 'Unknown Resort'}</div>
                          <div className="text-sm text-slate-600">
                            {props.location?.iso3166_1Alpha2} • {props.location?.localized?.en?.region}
                          </div>
                          {alreadyLoaded && (
                            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                              Already loaded
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedResorts.size > MAX_BULK_LOAD && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Maximum {MAX_BULK_LOAD} resorts per batch. First {MAX_BULK_LOAD} will be loaded.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleBulkLoad}
                  disabled={selectedResorts.size === 0 || loading}
                  className="w-full"
                  size="lg"
                >
                  Load {Math.min(selectedResorts.size, MAX_BULK_LOAD)} Selected Resorts
                </Button>
              </div>
            )}

            {currentStep === 'loading' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Loading resorts...</h3>
                  <Progress value={(loadProgress.length / Math.min(selectedResorts.size, MAX_BULK_LOAD)) * 100} />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {loadProgress.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                      {item.status === 'loading' && (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      )}
                      {item.status === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {item.status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.status === 'success' && (
                          <div className="text-sm text-slate-600">
                            {item.runs} runs • {item.lifts} lifts
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="text-sm text-red-600">{item.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Bulk load complete! Resorts are unpublished by default.
                  </AlertDescription>
                </Alert>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {loadProgress.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border">
                      {item.status === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {item.status === 'error' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.status === 'success' && (
                          <div className="text-sm text-slate-600">
                            {item.runs} runs • {item.lifts} lifts
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="text-sm text-red-600">{item.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => navigate('/admin/manage-resorts')} className="flex-1">
                    Manage Resorts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep('search');
                      setSearchQuery('');
                      setSearchResults([]);
                      setSelectedResorts(new Set());
                      setLoadProgress([]);
                    }}
                    className="flex-1"
                  >
                    Load More
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
