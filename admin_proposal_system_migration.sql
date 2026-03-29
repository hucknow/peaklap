/*
  # Add User Proposals System

  1. New Tables
    - `user_proposals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - User who submitted the proposal
      - `proposal_type` (text) - Type: 'resort', 'run', 'lift'
      - `parent_id` (uuid, nullable) - For runs/lifts, the resort they belong to
      - `status` (text) - Status: 'pending', 'approved', 'rejected'
      - `data` (jsonb) - The proposal data (name, location, etc.)
      - `admin_notes` (text, nullable) - Notes from admin reviewing the proposal
      - `reviewed_by` (uuid, nullable) - Admin who reviewed it
      - `reviewed_at` (timestamptz, nullable) - When it was reviewed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_proposals` table
    - Users can create their own proposals
    - Users can view their own proposals
    - Admins can view all proposals
    - Admins can update proposals (approve/reject)

  3. Notes
    - This allows users to suggest resorts, runs, and lifts that aren't in the system
    - Admins can review and approve/reject these proposals
    - Upon approval, data can be manually added to the appropriate tables
*/

-- Create user_proposals table
CREATE TABLE IF NOT EXISTS user_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  proposal_type text NOT NULL CHECK (proposal_type IN ('resort', 'run', 'lift')),
  parent_id uuid REFERENCES ski_areas(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  data jsonb NOT NULL,
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_proposals ENABLE ROW LEVEL SECURITY;

-- Users can create their own proposals
CREATE POLICY "Users can create proposals"
  ON user_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own proposals
CREATE POLICY "Users can view own proposals"
  ON user_proposals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all proposals
CREATE POLICY "Admins can view all proposals"
  ON user_proposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update proposals
CREATE POLICY "Admins can update proposals"
  ON user_proposals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_proposals_status ON user_proposals(status);
CREATE INDEX IF NOT EXISTS idx_user_proposals_user_id ON user_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_proposals_type ON user_proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_user_proposals_parent_id ON user_proposals(parent_id);
