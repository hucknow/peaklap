import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Loader as Loader2, CircleCheck as CheckCircle2, Circle as XCircle, Mountain } from 'lucide-react';

const OPENSKIDATA_API = 'https://api.openskidata.org';

export default function AdminResortLoader() {
  const navigate = useNavigate();
  const [osmId, setOsmId] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const convertMetersToFeet = (meters) => {
    if (!meters) return null;
    return Math.round(meters * 3.28084);
  };

  const fetchSkiArea = async (osmId) => {
    const response = await fetch(`${OPENSKIDATA_API}/skiAreas?osm_id=${osmId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ski area: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error('No ski area found with that OSM ID');
    }
    return data.features[0];
  };

  const fetchRuns = async (skiAreaId) => {
    const response = await fetch(`${OPENSKIDATA_API}/runs?skiAreaID=${skiAreaId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch runs: ${response.statusText}`);
    }
    const data = await response.json();
    return data.features || [];
  };

  const fetchLifts = async (skiAreaId) => {
    const response = await fetch(`${OPENSKIDATA_API}/lifts?skiAreaID=${skiAreaId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch lifts: ${response.statusText}`);
    }
    const data = await response.json();
    return data.features || [];
  };

  const insertSkiArea = async (feature) => {
    const props = feature.properties;
    const skiAreaData = {
      name: props.name,
      area_type: props.type,
      country: props.location?.iso3166_1Alpha2,
      region: props.location?.localized?.en?.region,
      website: props.websites?.[0],
      skimap_id: props.skimap_id,
      boundary: feature.geometry,
      osm_id: osmId
    };

    const { data, error } = await supabase
      .from('ski_areas')
      .insert([skiAreaData])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const insertRuns = async (skiAreaId, runFeatures) => {
    if (runFeatures.length === 0) return [];

    const runsData = runFeatures.map(feature => {
      const props = feature.properties;
      return {
        ski_area_id: skiAreaId,
        name: props.name,
        piste_type: props['piste:type'],
        difficulty: props['piste:difficulty'],
        piste_difficulty: props['piste:difficulty'],
        grooming: props['piste:grooming'],
        ref: props.ref,
        description: props.description,
        vertical_ft: convertMetersToFeet(props.vertical),
        length_m: props.length,
        geom: feature.geometry
      };
    });

    const { data, error } = await supabase
      .from('runs')
      .insert(runsData)
      .select();

    if (error) throw error;
    return data || [];
  };

  const insertLifts = async (skiAreaId, liftFeatures) => {
    if (liftFeatures.length === 0) return [];

    const liftsData = liftFeatures.map(feature => {
      const props = feature.properties;
      return {
        ski_area_id: skiAreaId,
        name: props.name,
        lift_type: props.aerialway,
        aerialway: props.aerialway,
        capacity: props.capacity?.total,
        ref: props.ref,
        geom: feature.geometry
      };
    });

    const { data, error } = await supabase
      .from('lifts')
      .insert(liftsData)
      .select();

    if (error) throw error;
    return data || [];
  };

  const rollbackSkiArea = async (skiAreaId) => {
    if (!skiAreaId) return;
    await supabase
      .from('ski_areas')
      .delete()
      .eq('id', skiAreaId);
  };

  const handleLoadResort = async () => {
    if (!osmId || !osmId.trim()) {
      setError('Please enter a valid OSM ID');
      return;
    }

    setLoading(true);
    setProgress(0);
    setCurrentStep('');
    setResult(null);
    setError(null);

    let insertedSkiAreaId = null;

    try {
      setCurrentStep('Fetching ski area data...');
      setProgress(10);
      const skiAreaFeature = await fetchSkiArea(osmId.trim());
      const openSkiMapId = skiAreaFeature.id;

      setProgress(25);
      setCurrentStep('Inserting ski area...');
      const skiArea = await insertSkiArea(skiAreaFeature);
      insertedSkiAreaId = skiArea.id;

      setProgress(40);
      setCurrentStep('Fetching runs...');
      const runFeatures = await fetchRuns(openSkiMapId);

      setProgress(60);
      setCurrentStep('Inserting runs...');
      const runs = await insertRuns(skiArea.id, runFeatures);

      setProgress(75);
      setCurrentStep('Fetching lifts...');
      const liftFeatures = await fetchLifts(openSkiMapId);

      setProgress(90);
      setCurrentStep('Inserting lifts...');
      const lifts = await insertLifts(skiArea.id, liftFeatures);

      setProgress(100);
      setCurrentStep('Complete!');
      setResult({
        name: skiArea.name,
        runsCount: runs.length,
        liftsCount: lifts.length,
        skiAreaId: skiArea.id
      });

    } catch (err) {
      console.error('Error loading resort:', err);
      setError(err.message || 'Failed to load resort data');

      if (insertedSkiAreaId) {
        setCurrentStep('Rolling back changes...');
        try {
          await rollbackSkiArea(insertedSkiAreaId);
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr);
        }
      }

      setProgress(0);
      setCurrentStep('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          ← Back to Settings
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-blue-600" />
              <CardTitle>Admin: Load Ski Resort</CardTitle>
            </div>
            <CardDescription>
              Load ski area data from OpenSkiMap using an OSM ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OSM ID</label>
              <Input
                type="number"
                placeholder="e.g., 123456"
                value={osmId}
                onChange={(e) => setOsmId(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-slate-500">
                Find OSM IDs at <a
                  href="https://openskidata.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  openskidata.org
                </a>
              </p>
            </div>

            <Button
              onClick={handleLoadResort}
              disabled={loading || !osmId.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load Resort Data'
              )}
            </Button>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-slate-600 text-center">{currentStep}</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Loaded {result.name}:
                  <ul className="mt-2 ml-4 list-disc">
                    <li>{result.runsCount} runs</li>
                    <li>{result.liftsCount} lifts</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4 border-t text-xs text-slate-500">
              <p><strong>How to use:</strong></p>
              <ol className="mt-2 ml-4 list-decimal space-y-1">
                <li>Find a ski area on openskidata.org</li>
                <li>Note the OSM ID from the URL or details</li>
                <li>Enter the OSM ID above and click "Load Resort Data"</li>
                <li>Wait for the import to complete</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
