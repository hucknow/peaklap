import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Mountain, Upload, Settings, TrendingUp, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/settings');
      return;
    }

    loadStats();
  }, [profile, navigate]);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

      if (error) throw error;

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-4"
        >
          ← Back to Settings
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Manage ski resorts and view system statistics</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Ski Areas</CardDescription>
                  <CardTitle className="text-3xl">{stats.total_ski_areas}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Published:</span>
                      <span className="font-semibold text-green-600">{stats.published_ski_areas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unpublished:</span>
                      <span className="font-semibold text-amber-600">{stats.unpublished_ski_areas}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Runs</CardDescription>
                  <CardTitle className="text-3xl">{stats.total_runs.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Across all ski areas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Lifts</CardDescription>
                  <CardTitle className="text-3xl">{stats.total_lifts.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Across all ski areas
                  </p>
                </CardContent>
              </Card>

              {stats.loading_ski_areas > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-blue-700">Loading in Progress</CardDescription>
                    <CardTitle className="text-3xl text-blue-900">{stats.loading_ski_areas}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-700">
                      Resorts currently being loaded
                    </p>
                  </CardContent>
                </Card>
              )}

              {stats.error_ski_areas > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-red-700">Load Errors</CardDescription>
                    <CardTitle className="text-3xl text-red-900">{stats.error_ski_areas}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-700">
                      Resorts with failed loads
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/bulk-load')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Bulk Load from OpenSkiData</CardTitle>
                      <CardDescription>Load multiple resorts at once</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Search and select multiple ski resorts to import from OpenSkiData API
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/manage-resorts')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Settings className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Manage Resorts</CardTitle>
                      <CardDescription>Publish, edit, or delete resorts</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Control visibility, edit details, and manage all ski areas in the system
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Alert>
            <AlertDescription>No stats available</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
