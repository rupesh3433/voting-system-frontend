import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiService from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Vote,
  Calendar,
  UserCheck,
  Eye,
  EyeOff,
  FileImage,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Election {
  election_id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  published: boolean;
  created_at: string;
}

interface Candidate {
  candidate_id: string;
  election_id: string;
  name: string;
  party: string;
  photo_url: string;
  created_at: string;
}

interface PendingVoter {
  voter_id: string;
  user_id: string;
  epic_id: string;
  dob: string;
  address: string;
  photo_url: string;
  approved: boolean;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pendingVoters, setPendingVoters] = useState<PendingVoter[]>([]);
  const [approvedVoters, setApprovedVoters] = useState<PendingVoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [selectedElectionId, setSelectedElectionId] = useState<string>("");

  // Election form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState<Date | null>(null);
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Candidate form
  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidatePhoto, setCandidatePhoto] = useState<File | null>(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [electionData, candidateData, pendingData, approvedData] =
        await Promise.all([
          apiService.getElections(),
          apiService.getCandidates(),
          apiService.getPendingVoters(),
          apiService.getApprovedVoters(),
        ]);
      setElections(electionData);
      setCandidates(candidateData);
      setPendingVoters(pendingData);
      setApprovedVoters(approvedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Election handlers ---
  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startAt || !endAt) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    if (startAt >= endAt) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await apiService.createElection({
        title,
        description,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
      });
      toast({ title: "Success", description: "Election created successfully" });
      setShowCreateElection(false);
      setTitle("");
      setDescription("");
      setStartAt(null);
      setEndAt(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create election",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublishElection = async (
    electionId: string,
    published: boolean
  ) => {
    try {
      if (published) await apiService.unpublishElection(electionId);
      else await apiService.publishElection(electionId);
      toast({
        title: "Success",
        description: published ? "Election unpublished" : "Election published",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update election",
        variant: "destructive",
      });
    }
  };

  // --- Candidate handlers ---
  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !candidateName ||
      !candidateParty ||
      !candidatePhoto ||
      !selectedElectionId
    ) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a photo",
        variant: "destructive",
      });
      return;
    }

    setIsAddingCandidate(true);
    try {
      const formData = new FormData();
      formData.append("name", candidateName);
      formData.append("party", candidateParty);
      formData.append("photo", candidatePhoto);

      await apiService.addCandidate(selectedElectionId, formData);
      toast({ title: "Success", description: "Candidate added successfully" });
      setShowAddCandidate(false);
      setCandidateName("");
      setCandidateParty("");
      setCandidatePhoto(null);
      setSelectedElectionId("");
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add candidate",
        variant: "destructive",
      });
    } finally {
      setIsAddingCandidate(false);
    }
  };

  // --- Voter handlers ---
  const handleApproveVoter = async (voterId: string) => {
    try {
      await apiService.approveVoter(voterId);
      toast({ title: "Success", description: "Voter approved successfully" });
      fetchData(); // refresh both pending + approved lists
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to approve voter",
        variant: "destructive",
      });
    }
  };

  const handleRejectVoter = async (voterId: string) => {
    try {
      await apiService.rejectVoter(voterId);
      toast({ title: "Success", description: "Voter rejected successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reject voter",
        variant: "destructive",
      });
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-success bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage elections, candidates, and voter approvals
        </p>
      </div>

      <Tabs defaultValue="elections" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="elections" className="gap-2">
            <Vote className="h-4 w-4" />
            Elections
          </TabsTrigger>
          <TabsTrigger value="candidates" className="gap-2">
            <Users className="h-4 w-4" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="voters" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Voter Approvals
          </TabsTrigger>
        </TabsList>

        {/* --- Elections Tab --- */}
        <TabsContent value="elections" className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Election Management</h2>
            <Dialog
              open={showCreateElection}
              onOpenChange={setShowCreateElection}
            >
              <DialogTrigger asChild>
                <Button variant="admin" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Election
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Election</DialogTitle>
                  <DialogDescription>
                    Set up a new election with candidates and voting period
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateElection} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Election Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="2024 Presidential Election"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <DatePicker
                        selected={startAt}
                        onChange={(date: Date | null) => setStartAt(date)}
                        showTimeSelect
                        timeIntervals={15}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        placeholderText="Select start date"
                        className="w-full p-2 border rounded-md"
                        selectsStart
                        startDate={startAt}
                        endDate={endAt}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <DatePicker
                        selected={endAt}
                        onChange={(date: Date | null) => setEndAt(date)}
                        showTimeSelect
                        timeIntervals={15}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        placeholderText="Select end date"
                        className="w-full p-2 border rounded-md"
                        selectsEnd
                        startDate={startAt}
                        endDate={endAt}
                        minDate={startAt}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateElection(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="admin" disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Election"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {elections.map((election) => (
              <Card key={election.election_id}>
                <CardHeader className="flex justify-between items-start">
                  <div>
                    <CardTitle>{election.title}</CardTitle>
                    <CardDescription>{election.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={election.published ? "default" : "secondary"}
                    >
                      {election.published ? "Published" : "Draft"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePublishElection(
                          election.election_id,
                          election.published
                        )
                      }
                      className="gap-2"
                    >
                      {election.published ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Publish
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(election.start_at).toLocaleString()}
                      </span>
                    </div>
                    <span>to</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(election.end_at).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* --- Candidates Tab --- */}
        <TabsContent value="candidates" className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Candidate Management</h2>
            <Dialog open={showAddCandidate} onOpenChange={setShowAddCandidate}>
              <DialogTrigger asChild>
                <Button variant="admin" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Candidate</DialogTitle>
                  <DialogDescription>
                    Add a candidate to an existing election
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddCandidate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Election *</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedElectionId}
                      onChange={(e) => setSelectedElectionId(e.target.value)}
                      required
                    >
                      <option value="">Choose an election</option>
                      {elections.map((e) => (
                        <option key={e.election_id} value={e.election_id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Candidate Name *</Label>
                    <Input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Party/Affiliation *</Label>
                    <Input
                      value={candidateParty}
                      onChange={(e) => setCandidateParty(e.target.value)}
                      placeholder="Political party"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Candidate Photo *
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setCandidatePhoto(e.target.files?.[0] || null)
                      }
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddCandidate(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="admin"
                      disabled={isAddingCandidate}
                    >
                      {isAddingCandidate ? "Adding..." : "Add Candidate"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Candidates</CardTitle>
              <CardDescription>
                Manage candidates across all elections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidates.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Election</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c) => (
                      <TableRow key={c.candidate_id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.party}</TableCell>
                        <TableCell>
                          {elections.find(
                            (e) => e.election_id === c.election_id
                          )?.title || "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">
                  No candidates added yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Voters Tab --- */}
        <TabsContent value="voters" className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Voter Approvals</h2>
            <p className="text-muted-foreground">
              Review and approve/reject pending voter registrations
            </p>
          </div>

          {pendingVoters.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Pending Approvals ({pendingVoters.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>EPIC ID</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingVoters.map((v) => (
                      <TableRow key={v.voter_id}>
                        <TableCell className="font-mono">{v.epic_id}</TableCell>
                        <TableCell>{v.dob}</TableCell>
                        <TableCell>{v.address || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(v.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApproveVoter(v.voter_id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectVoter(v.voter_id)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No pending voters.</p>
          )}

          {approvedVoters.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Approved Voters ({approvedVoters.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>EPIC ID</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Approved On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedVoters.map((v) => (
                      <TableRow key={v.voter_id}>
                        <TableCell className="font-mono">{v.epic_id}</TableCell>
                        <TableCell>{v.dob}</TableCell>
                        <TableCell>{v.address || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(v.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
