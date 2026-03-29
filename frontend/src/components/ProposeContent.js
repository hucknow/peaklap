import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useResort } from '@/contexts/ResortContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Mountain, Plus, Cable } from 'lucide-react';
import { toast } from 'sonner';

export function ProposeContent({ open, onOpenChange }) {
  const { profile } = useAuth();
  const { selectedResort } = useResort();
  const [activeTab, setActiveTab] = useState('run');
  const [submitting, setSubmitting] = useState(false);

  const [runData, setRunData] = useState({
    name: '',
    difficulty: '',
    description: '',
    vertical_ft: '',
  });

  const [liftData, setLiftData] = useState({
    name: '',
    lift_type: '',
    capacity: '',
  });

  const [resortData, setResortData] = useState({
    name: '',
    country: '',
    region: '',
    description: '',
  });

  const handleSubmitProposal = async (type) => {
    if (!profile?.id) {
      toast.error('You must be logged in to submit proposals');
      return;
    }

    let data;
    let parentId = null;

    if (type === 'run') {
      if (!runData.name) {
        toast.error('Run name is required');
        return;
      }
      if (!selectedResort) {
        toast.error('Please select a resort first');
        return;
      }
      data = { ...runData };
      parentId = selectedResort.id;
    } else if (type === 'lift') {
      if (!liftData.name) {
        toast.error('Lift name is required');
        return;
      }
      if (!selectedResort) {
        toast.error('Please select a resort first');
        return;
      }
      data = { ...liftData };
      parentId = selectedResort.id;
    } else if (type === 'resort') {
      if (!resortData.name || !resortData.country) {
        toast.error('Resort name and country are required');
        return;
      }
      data = { ...resortData };
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_proposals')
        .insert({
          user_id: profile.id,
          proposal_type: type,
          parent_id: parentId,
          status: 'pending',
          data: data,
        });

      if (error) throw error;

      toast.success('Proposal submitted! An admin will review it shortly.');

      setRunData({ name: '', difficulty: '', description: '', vertical_ft: '' });
      setLiftData({ name: '', lift_type: '', capacity: '' });
      setResortData({ name: '', country: '', region: '', description: '' });

      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting proposal:', err);
      toast.error('Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Propose New Content</DialogTitle>
          <DialogDescription>
            Can't find what you're looking for? Suggest a new run, lift, or resort and we'll review it.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="run">Run</TabsTrigger>
            <TabsTrigger value="lift">Lift</TabsTrigger>
            <TabsTrigger value="resort">Resort</TabsTrigger>
          </TabsList>

          <TabsContent value="run" className="space-y-4 mt-4">
            {selectedResort ? (
              <div className="text-sm text-slate-600 mb-4">
                Proposing a run at <span className="font-semibold">{selectedResort.name}</span>
              </div>
            ) : (
              <div className="text-sm text-amber-600 mb-4">
                Please select a resort first from the main page
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="run-name">Run Name *</Label>
                <Input
                  id="run-name"
                  value={runData.name}
                  onChange={(e) => setRunData({ ...runData, name: e.target.value })}
                  placeholder="e.g., Dave Murray Downhill"
                />
              </div>

              <div>
                <Label htmlFor="run-difficulty">Difficulty</Label>
                <select
                  id="run-difficulty"
                  value={runData.difficulty}
                  onChange={(e) => setRunData({ ...runData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select difficulty</option>
                  <option value="easy">Easy (Green)</option>
                  <option value="intermediate">Intermediate (Blue)</option>
                  <option value="advanced">Advanced (Black)</option>
                  <option value="expert">Expert (Double Black)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="run-vertical">Vertical Drop (ft)</Label>
                <Input
                  id="run-vertical"
                  type="number"
                  value={runData.vertical_ft}
                  onChange={(e) => setRunData({ ...runData, vertical_ft: e.target.value })}
                  placeholder="e.g., 1200"
                />
              </div>

              <div>
                <Label htmlFor="run-description">Description</Label>
                <Textarea
                  id="run-description"
                  value={runData.description}
                  onChange={(e) => setRunData({ ...runData, description: e.target.value })}
                  placeholder="Any additional details about this run..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => handleSubmitProposal('run')} disabled={submitting || !selectedResort}>
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="lift" className="space-y-4 mt-4">
            {selectedResort ? (
              <div className="text-sm text-slate-600 mb-4">
                Proposing a lift at <span className="font-semibold">{selectedResort.name}</span>
              </div>
            ) : (
              <div className="text-sm text-amber-600 mb-4">
                Please select a resort first from the main page
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="lift-name">Lift Name *</Label>
                <Input
                  id="lift-name"
                  value={liftData.name}
                  onChange={(e) => setLiftData({ ...liftData, name: e.target.value })}
                  placeholder="e.g., Peak Express"
                />
              </div>

              <div>
                <Label htmlFor="lift-type">Lift Type</Label>
                <select
                  id="lift-type"
                  value={liftData.lift_type}
                  onChange={(e) => setLiftData({ ...liftData, lift_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select type</option>
                  <option value="chairlift">Chairlift</option>
                  <option value="gondola">Gondola</option>
                  <option value="t-bar">T-Bar</option>
                  <option value="platter">Platter</option>
                  <option value="rope tow">Rope Tow</option>
                  <option value="magic carpet">Magic Carpet</option>
                </select>
              </div>

              <div>
                <Label htmlFor="lift-capacity">Capacity</Label>
                <Input
                  id="lift-capacity"
                  type="number"
                  value={liftData.capacity}
                  onChange={(e) => setLiftData({ ...liftData, capacity: e.target.value })}
                  placeholder="e.g., 6"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => handleSubmitProposal('lift')} disabled={submitting || !selectedResort}>
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="resort" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="resort-name">Resort Name *</Label>
                <Input
                  id="resort-name"
                  value={resortData.name}
                  onChange={(e) => setResortData({ ...resortData, name: e.target.value })}
                  placeholder="e.g., Whistler Blackcomb"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resort-country">Country *</Label>
                  <Input
                    id="resort-country"
                    value={resortData.country}
                    onChange={(e) => setResortData({ ...resortData, country: e.target.value })}
                    placeholder="e.g., Canada"
                  />
                </div>

                <div>
                  <Label htmlFor="resort-region">Region</Label>
                  <Input
                    id="resort-region"
                    value={resortData.region}
                    onChange={(e) => setResortData({ ...resortData, region: e.target.value })}
                    placeholder="e.g., British Columbia"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="resort-description">Description</Label>
                <Textarea
                  id="resort-description"
                  value={resortData.description}
                  onChange={(e) => setResortData({ ...resortData, description: e.target.value })}
                  placeholder="Any additional details about this resort..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => handleSubmitProposal('resort')} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
