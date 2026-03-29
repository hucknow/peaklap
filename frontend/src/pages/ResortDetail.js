import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Search, Loader as Loader2, Mountain, Cable, CreditCard as Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { Switch } from '../components/ui/switch';

export default function ResortDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const [resort, setResort] = useState(null);
  const [runs, setRuns] = useState([]);
  const [lifts, setLifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('runs');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/settings');
      return;
    }

    loadResortData();
  }, [profile, navigate, id]);

  const loadResortData = async () => {
    setLoading(true);
    try {
      const { data: resortData, error: resortError } = await supabase
        .from('ski_areas')
        .select('*')
        .eq('id', id)
        .single();

      if (resortError) throw resortError;
      setResort(resortData);

      const { data: runsData, error: runsError } = await supabase
        .from('runs')
        .select('*')
        .eq('ski_area_id', id)
        .order('name');

      if (runsError) throw runsError;
      setRuns(runsData || []);

      const { data: liftsData, error: liftsError } = await supabase
        .from('lifts')
        .select('*')
        .eq('ski_area_id', id)
        .order('name');

      if (liftsError) throw liftsError;
      setLifts(liftsData || []);
    } catch (err) {
      console.error('Error loading resort data:', err);
      toast.error('Failed to load resort data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRun = async (runId, runName) => {
    if (!confirm(`Delete run "${runName}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('runs')
        .delete()
        .eq('id', runId);

      if (error) throw error;

      setRuns(prev => prev.filter(r => r.id !== runId));
      toast.success(`Run "${runName}" deleted`);
    } catch (err) {
      console.error('Error deleting run:', err);
      toast.error('Failed to delete run');
    }
  };

  const handleDeleteLift = async (liftId, liftName) => {
    if (!confirm(`Delete lift "${liftName}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('lifts')
        .delete()
        .eq('id', liftId);

      if (error) throw error;

      setLifts(prev => prev.filter(l => l.id !== liftId));
      toast.success(`Lift "${liftName}" deleted`);
    } catch (err) {
      console.error('Error deleting lift:', err);
      toast.error('Failed to delete lift');
    }
  };

  const handleTogglePublish = async (checked) => {
    try {
      const { error } = await supabase
        .from('ski_areas')
        .update({ is_published: checked })
        .eq('id', id);

      if (error) throw error;

      setResort(prev => ({ ...prev, is_published: checked }));
      toast.success(`Resort ${checked ? 'published' : 'unpublished'}`);
    } catch (err) {
      console.error('Error updating publish status:', err);
      toast.error('Failed to update publish status');
    }
  };

  const filteredRuns = runs.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.difficulty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLifts = lifts.filter(l =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.lift_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!profile?.is_admin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!resort) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="max-w-6xl mx-auto pt-8">
          <p className="text-center text-slate-600">Resort not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/manage-resorts')}
          className="mb-4"
        >
          ← Back to Manage Resorts
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mountain className="h-6 w-6 text-slate-900" />
                <span className="text-slate-900">{resort.name}</span>
                {resort.is_published ? (
                  <Badge className="bg-green-100 text-green-800">Published</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Unpublished</Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    {resort.is_published ? 'Published' : 'Hidden'}
                  </span>
                  <Switch
                    checked={resort.is_published || false}
                    onCheckedChange={handleTogglePublish}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/edit-resort/${resort.id}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Resort
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-600">Location</div>
                <div className="font-medium text-slate-900">{resort.country} • {resort.region}</div>
              </div>
              <div>
                <div className="text-slate-600">Runs</div>
                <div className="font-medium text-slate-900">{runs.length}</div>
              </div>
              <div>
                <div className="text-slate-600">Lifts</div>
                <div className="font-medium text-slate-900">{lifts.length}</div>
              </div>
              <div>
                <div className="text-slate-600">Source</div>
                <div className="font-medium text-slate-900">{resort.source || 'manual'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900">Runs & Lifts</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                <TabsTrigger
                  value="runs"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-700"
                >
                  Runs ({runs.length})
                </TabsTrigger>
                <TabsTrigger
                  value="lifts"
                  className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-700"
                >
                  Lifts ({lifts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="runs" className="space-y-3 mt-4">
                {filteredRuns.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    No runs found
                  </div>
                ) : (
                  filteredRuns.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{run.name}</h4>
                          {run.difficulty && <DifficultyBadge difficulty={run.difficulty} />}
                          {run.ref && (
                            <Badge variant="outline" className="text-slate-600">
                              #{run.ref}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-600">
                          {run.vertical_ft && `${run.vertical_ft.toLocaleString()} ft vertical`}
                          {run.length_m && ` • ${Math.round(run.length_m)} m length`}
                          {run.zone && ` • ${run.zone}`}
                        </div>
                        {run.description && (
                          <div className="text-sm text-slate-500 mt-1">{run.description}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRun(run.id, run.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="lifts" className="space-y-3 mt-4">
                {filteredLifts.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    No lifts found
                  </div>
                ) : (
                  filteredLifts.map((lift) => (
                    <div
                      key={lift.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Cable className="h-4 w-4 text-slate-600" />
                          <h4 className="font-semibold text-slate-900">{lift.name}</h4>
                          {lift.lift_type && (
                            <Badge variant="outline" className="text-slate-600">
                              {lift.lift_type}
                            </Badge>
                          )}
                          {lift.ref && (
                            <Badge variant="outline" className="text-slate-600">
                              #{lift.ref}
                            </Badge>
                          )}
                        </div>
                        {lift.capacity && (
                          <div className="text-sm text-slate-600">
                            Capacity: {lift.capacity} people
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLift(lift.id, lift.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
