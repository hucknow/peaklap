import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
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
import { Loader as Loader2, Check, X, Mountain, Cable, CircleAlert as AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProposals() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (profile && !profile.is_admin) {
      navigate('/settings');
      return;
    }

    loadProposals();
  }, [profile, navigate]);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_proposals')
        .select(`
          *,
          profiles:user_id(username),
          ski_areas:parent_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (err) {
      console.error('Error loading proposals:', err);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (proposal, action) => {
    setSelectedProposal(proposal);
    setAdminNotes(proposal.admin_notes || '');
    setReviewDialog(action);
  };

  const confirmReview = async () => {
    if (!selectedProposal || !reviewDialog) return;

    try {
      const { error } = await supabase
        .from('user_proposals')
        .update({
          status: reviewDialog,
          admin_notes: adminNotes,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedProposal.id);

      if (error) throw error;

      setProposals(prev =>
        prev.map(p =>
          p.id === selectedProposal.id
            ? { ...p, status: reviewDialog, admin_notes: adminNotes, reviewed_by: profile.id, reviewed_at: new Date().toISOString() }
            : p
        )
      );

      toast.success(`Proposal ${reviewDialog === 'approved' ? 'approved' : 'rejected'}`);
      setReviewDialog(null);
      setSelectedProposal(null);
      setAdminNotes('');
    } catch (err) {
      console.error('Error reviewing proposal:', err);
      toast.error('Failed to update proposal');
    }
  };

  const filteredProposals = proposals.filter(p => p.status === statusFilter);

  const getProposalIcon = (type) => {
    switch (type) {
      case 'resort':
        return <Mountain className="h-5 w-5 text-blue-600" />;
      case 'run':
        return <Mountain className="h-5 w-5 text-green-600" />;
      case 'lift':
        return <Cable className="h-5 w-5 text-purple-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    return config[status] || config.pending;
  };

  const renderProposalData = (proposal) => {
    const data = proposal.data;

    if (proposal.proposal_type === 'resort') {
      return (
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Name:</span> {data.name}</div>
          <div><span className="font-medium">Country:</span> {data.country}</div>
          {data.region && <div><span className="font-medium">Region:</span> {data.region}</div>}
          {data.description && <div><span className="font-medium">Description:</span> {data.description}</div>}
        </div>
      );
    }

    if (proposal.proposal_type === 'run') {
      return (
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Resort:</span> {proposal.ski_areas?.name || 'Unknown'}</div>
          <div><span className="font-medium">Name:</span> {data.name}</div>
          {data.difficulty && <div><span className="font-medium">Difficulty:</span> {data.difficulty}</div>}
          {data.vertical_ft && <div><span className="font-medium">Vertical:</span> {data.vertical_ft} ft</div>}
          {data.description && <div><span className="font-medium">Description:</span> {data.description}</div>}
        </div>
      );
    }

    if (proposal.proposal_type === 'lift') {
      return (
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Resort:</span> {proposal.ski_areas?.name || 'Unknown'}</div>
          <div><span className="font-medium">Name:</span> {data.name}</div>
          {data.lift_type && <div><span className="font-medium">Type:</span> {data.lift_type}</div>}
          {data.capacity && <div><span className="font-medium">Capacity:</span> {data.capacity}</div>}
        </div>
      );
    }

    return null;
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
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <AlertCircle className="h-6 w-6 text-slate-900" />
              User Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="pending">
                  Pending ({proposals.filter(p => p.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({proposals.filter(p => p.status === 'approved').length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({proposals.filter(p => p.status === 'rejected').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={statusFilter}>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                ) : filteredProposals.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    No {statusFilter} proposals
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProposals.map((proposal) => (
                      <div
                        key={proposal.id}
                        className="border rounded-lg p-4 hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1">{getProposalIcon(proposal.proposal_type)}</div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-slate-900 capitalize">
                                {proposal.proposal_type} Proposal
                              </h3>
                              <Badge className={getStatusBadge(proposal.status).color}>
                                {getStatusBadge(proposal.status).label}
                              </Badge>
                            </div>

                            {renderProposalData(proposal)}

                            <div className="mt-3 text-xs text-slate-500">
                              Submitted by {proposal.profiles?.username || 'Unknown'} •{' '}
                              {new Date(proposal.created_at).toLocaleDateString()}
                            </div>

                            {proposal.admin_notes && (
                              <div className="mt-3 p-3 bg-slate-100 rounded-lg text-sm">
                                <div className="font-medium text-slate-700 mb-1">Admin Notes:</div>
                                <div className="text-slate-600">{proposal.admin_notes}</div>
                              </div>
                            )}
                          </div>

                          {proposal.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReview(proposal, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReview(proposal, 'rejected')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewDialog === 'approved' ? 'Approve Proposal' : 'Reject Proposal'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewDialog === 'approved'
                ? 'This will mark the proposal as approved. You can then manually add the data to the database.'
                : 'This will mark the proposal as rejected and notify the user.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium mb-2 block">Admin Notes (optional)</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this decision..."
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setReviewDialog(null); setAdminNotes(''); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReview}
              className={reviewDialog === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {reviewDialog === 'approved' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
