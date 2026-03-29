import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Search, Loader as Loader2, CreditCard as Edit, Trash2, RefreshCw, Mountain, CircleAlert as AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageResorts() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [resorts, setResorts] = useState([]);
  const [filteredResorts, setFilteredResorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [publishDialog, setPublishDialog] = useState(null);

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/settings');
      return;
    }

    loadResorts();
  }, [profile, navigate]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [resorts, searchQuery, sortBy, filterBy]);

  const loadResorts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ski_areas')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setResorts(data || []);
    } catch (err) {
      console.error('Error loading resorts:', err);
      toast.error('Failed to load resorts');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...resorts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(query) ||
        r.country?.toLowerCase().includes(query) ||
        r.region?.toLowerCase().includes(query)
      );
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter(r => {
        if (filterBy === 'published') return r.is_published === true;
        if (filterBy === 'unpublished') return r.is_published === false;
        if (filterBy === 'errors') return r.load_status === 'error';
        return true;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
      if (sortBy === 'published') return (b.is_published ? 1 : 0) - (a.is_published ? 1 : 0);
      if (sortBy === 'recent') return new Date(b.last_synced_at || 0) - new Date(a.last_synced_at || 0);
      return 0;
    });

    setFilteredResorts(filtered);
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

  const handleTogglePublish = async (resort, newValue) => {
    if (newValue === true) {
      setPublishDialog(resort);
      return;
    }

    await updatePublishStatus(resort, newValue);
  };

  const confirmPublish = async () => {
    if (!publishDialog) return;
    await updatePublishStatus(publishDialog, true);
    setPublishDialog(null);
  };

  const updatePublishStatus = async (resort, isPublished) => {
    try {
      const { error } = await supabase
        .from('ski_areas')
        .update({ is_published: isPublished })
        .eq('id', resort.id);

      if (error) throw error;

      await logAdminAction(
        isPublished ? 'publish_resort' : 'unpublish_resort',
        resort.id,
        'ski_area',
        { name: resort.name }
      );

      setResorts(prev =>
        prev.map(r => (r.id === resort.id ? { ...r, is_published: isPublished } : r))
      );

      toast.success(`${resort.name} ${isPublished ? 'published' : 'unpublished'}`);
    } catch (err) {
      console.error('Error updating publish status:', err);
      toast.error('Failed to update publish status');
    }
  };

  const handleDelete = (resort) => {
    setDeleteDialog(resort);
  };

  const confirmDelete = async () => {
    if (!deleteDialog) return;

    try {
      const { error } = await supabase
        .from('ski_areas')
        .update({ is_active: false })
        .eq('id', deleteDialog.id);

      if (error) throw error;

      await logAdminAction('delete_resort', deleteDialog.id, 'ski_area', {
        name: deleteDialog.name
      });

      setResorts(prev => prev.filter(r => r.id !== deleteDialog.id));
      toast.success(`${deleteDialog.name} deleted`);
    } catch (err) {
      console.error('Error deleting resort:', err);
      toast.error('Failed to delete resort');
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleReload = async (resort) => {
    toast.info(`Reload feature coming soon for ${resort.name}`);
  };

  const getSourceBadge = (source) => {
    const colors = {
      openskidata: 'bg-blue-100 text-blue-800',
      manual: 'bg-gray-100 text-gray-800',
      skimap: 'bg-purple-100 text-purple-800'
    };
    return colors[source] || colors.manual;
  };

  const getStatusBadge = (status) => {
    const config = {
      loaded: { color: 'bg-green-100 text-green-800', label: 'Loaded' },
      loading: { color: 'bg-blue-100 text-blue-800', label: 'Loading' },
      error: { color: 'bg-red-100 text-red-800', label: 'Error' },
      empty: { color: 'bg-gray-100 text-gray-800', label: 'Empty' }
    };
    return config[status] || config.empty;
  };

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
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
              Manage Resorts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search resorts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="name">Sort: Name A-Z</option>
                <option value="country">Sort: Country</option>
                <option value="published">Sort: Published First</option>
                <option value="recent">Sort: Recently Loaded</option>
              </select>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Resorts</option>
                <option value="published">Published Only</option>
                <option value="unpublished">Unpublished Only</option>
                <option value="errors">Errors Only</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredResorts.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                No resorts found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResorts.map((resort) => (
                  <div
                    key={resort.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{resort.name}</h3>
                        <Badge className={getSourceBadge(resort.source)}>
                          {resort.source || 'manual'}
                        </Badge>
                        <Badge className={getStatusBadge(resort.load_status).color}>
                          {getStatusBadge(resort.load_status).label}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        {resort.country} • {resort.region} • {resort.run_count || 0} runs • {resort.lift_count || 0} lifts
                      </div>
                      {resort.load_status === 'error' && resort.load_error && (
                        <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {resort.load_error}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          {resort.is_published ? 'Published' : 'Hidden'}
                        </span>
                        <Switch
                          checked={resort.is_published || false}
                          onCheckedChange={(checked) => handleTogglePublish(resort, checked)}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/edit-resort/${resort.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {resort.source === 'openskidata' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReload(resort)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(resort)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!publishDialog} onOpenChange={() => setPublishDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Resort?</AlertDialogTitle>
            <AlertDialogDescription>
              Make <strong>{publishDialog?.name}</strong> visible to all users? This will appear in the resort picker immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resort?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete <strong>{deleteDialog?.name}</strong> and all its runs, lifts, and POIs. User logs will be preserved but unlinked.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
