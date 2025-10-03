import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { User, FileText, Camera, Fingerprint, CheckCircle, Clock, UserCheck } from 'lucide-react';

interface VoterStatus {
  voter_id?: string;
  epic_id?: string;
  dob?: string;
  address?: string;
  photo_url?: string;
  approved?: boolean;
  created_at?: string;
  status?: 'not_registered' | 'pending' | 'approved'; // ✅ added
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [voterStatus, setVoterStatus] = useState<VoterStatus | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Form state
  const [epicId, setEpicId] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [fingerprint, setFingerprint] = useState<File | null>(null);

  // Fetch latest voter status
  const fetchVoterStatus = async () => {
    if (!user) return;
    try {
      const status = await apiService.getMyVoterStatus();
      setVoterStatus(status);
    } catch (error) {
      console.error('Failed to fetch voter status', error);
    }
  };

  useEffect(() => {
    fetchVoterStatus();
  }, [user]);

  const handleVoterRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!epicId || !dob || !photo || !fingerprint) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields and upload both photo and fingerprint',
        variant: 'destructive',
      });
      return;
    }

    setIsRegistering(true);
    try {
      const formData = new FormData();
      formData.append('epic_id', epicId);
      formData.append('dob', dob);
      formData.append('address', address);
      formData.append('photo', photo);
      formData.append('fingerprint', fingerprint);

      await apiService.registerVoter(formData);

      toast({
        title: 'Success',
        description: 'Voter registration submitted successfully. Awaiting approval.',
      });

      await fetchVoterStatus();
      setShowRegistrationForm(false);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.error || 'Failed to register as voter',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const getStatusBadge = () => {
    if (!voterStatus) return null;

    if (voterStatus.status === 'not_registered') {
      return (
        <Badge className="bg-muted text-muted-foreground gap-1">
          Not Registered
        </Badge>
      );
    }

    if (voterStatus.status === 'approved') {
      return (
        <Badge className="bg-success text-success-foreground gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved Voter
        </Badge>
      );
    }

    return (
      <Badge className="bg-warning text-warning-foreground gap-1">
        <Clock className="h-3 w-3" />
        Pending Approval
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and voter registration status
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="p-3 bg-muted rounded-md">{user?.name}</div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="p-3 bg-muted rounded-md">{user?.email}</div>
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                {user?.is_admin ? (
                  <>
                    <UserCheck className="h-4 w-4 text-success" />
                    Administrator
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    Standard User
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voter Registration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Voter Registration
            </CardTitle>
            <CardDescription>Your voting eligibility status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voterStatus?.status === 'not_registered' ? (
              <div className="space-y-4">
                {!showRegistrationForm ? (
                  <div className="text-center py-6">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Not Registered to Vote</h3>
                    <p className="text-muted-foreground mb-4">
                      Register as a voter to participate in elections
                    </p>
                    <Button onClick={() => setShowRegistrationForm(true)} variant="hero">
                      Register as Voter
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVoterRegistration} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="epicId">EPIC ID *</Label>
                      <Input
                        id="epicId"
                        value={epicId}
                        onChange={(e) => setEpicId(e.target.value)}
                        placeholder="Enter your EPIC ID"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address (Optional)</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photo" className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photo *
                      </Label>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fingerprint" className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4" />
                        Fingerprint *
                      </Label>
                      <Input
                        id="fingerprint"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFingerprint(e.target.files?.[0] || null)}
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" variant="hero" disabled={isRegistering} className="flex-1">
                        {isRegistering ? 'Registering...' : 'Submit Registration'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowRegistrationForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              voterStatus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status</span>
                    {getStatusBadge()}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">EPIC ID</Label>
                      <p className="font-mono">{voterStatus.epic_id}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                      <p>{voterStatus.dob}</p>
                    </div>
                    {voterStatus.address && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Address</Label>
                        <p>{voterStatus.address}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-muted-foreground">Registered On</Label>
                      <p>{voterStatus.created_at ? new Date(voterStatus.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>

                  {voterStatus.status === 'approved' ? (
                    <div className="p-4 bg-success-light rounded-lg">
                      <p className="text-success font-medium">
                        ✓ You are eligible to vote in all published elections
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-warning-light rounded-lg">
                      <p className="text-warning-foreground">
                        Your voter registration is pending admin approval. You will be notified once approved.
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
