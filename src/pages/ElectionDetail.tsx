import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Vote,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Candidate {
  candidate_id: string;
  name: string;
  party: string;
  photo_url: string;
}

interface ElectionDetailData {
  candidates: Candidate[];
  counts: { [candidateId: string]: number };
}

const ElectionDetail: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const { user } = useAuth();

  const [electionData, setElectionData] = useState<ElectionDetailData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteConfirm, setShowVoteConfirm] = useState(false);
  const [voterStatus, setVoterStatus] = useState<any>(null);

  useEffect(() => {
    if (electionId) {
      fetchElectionDetail();
      fetchVoterStatus(); // ✅ ADDED: Fetch voter status on component mount

      // Check if user has already voted
      const votedKey = `voted_${user?.user_id}_${electionId}`;
      setHasVoted(localStorage.getItem(votedKey) === 'true');
  
      // 🔄 Poll for live results every 5s
      const interval = setInterval(() => {
        fetchElectionDetail();
      }, 5000);
  
      return () => clearInterval(interval);
    }
  }, [electionId, user]);

  const fetchElectionDetail = async () => {
    try {
      const data = await apiService.getElectionDetail(electionId!);
      setElectionData(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch election details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVoterStatus = async () => {
    try {
      const status = await apiService.getMyVoterStatus();
      setVoterStatus(status);
    } catch (error) {
      console.error("Failed to fetch voter status", error);
    }
  };

  const handleVote = async () => {
    if (!selectedCandidate || !user) return;

    // ✅ FIXED: Use the new method to get approved voter ID
    const voterId = await apiService.getMyApprovedVoterId();
    
    if (!voterId) {
      toast({
        title: "Cannot Vote",
        description: "You don't have an approved voter registration",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);
    try {
      await apiService.castVote(electionId!, {
        voter_id: voterId, // ✅ FIXED: Use the approved voter ID
        candidate_id: selectedCandidate.candidate_id,
      });

      const votedKey = `voted_${user.user_id}_${electionId}`;
      localStorage.setItem(votedKey, "true");
      setHasVoted(true);
      setShowVoteConfirm(false);

      toast({
        title: "Vote Cast Successfully",
        description: `Your vote for ${selectedCandidate.name} has been recorded`,
      });

      fetchElectionDetail();
    } catch (error: any) {
      toast({
        title: "Vote Failed",
        description:
          error.response?.data?.error || "Failed to cast vote",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!electionData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-destructive">
          Election Not Found
        </h2>
        <p className="text-muted-foreground mt-2">
          The election you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Elections</Link>
        </Button>
      </div>
    );
  }

  const totalVotes = Object.values(electionData.counts).reduce(
    (sum, count) => sum + count,
    0
  );

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => {
    const voteCount = electionData.counts[candidate.candidate_id] || 0;
    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

    return (
      <Card className="hover:shadow-lg transition-smooth group relative overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={candidate.photo_url} alt={candidate.name} />
              <AvatarFallback className="text-lg font-semibold">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{candidate.name}</CardTitle>
              <CardDescription className="font-medium">
                {candidate.party}
              </CardDescription>
            </div>
            {hasVoted &&
              selectedCandidate?.candidate_id === candidate.candidate_id && (
                <Badge className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Your Vote
                </Badge>
              )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Votes</span>
              <span className="font-semibold">
                {voteCount.toLocaleString()}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-right text-sm text-muted-foreground">
              {percentage.toFixed(1)}%
            </div>
          </div>

          {!hasVoted && (
            <Dialog
              open={
                showVoteConfirm &&
                selectedCandidate?.candidate_id === candidate.candidate_id
              }
              onOpenChange={setShowVoteConfirm}
            >
              <DialogTrigger asChild>
                <Button
                  variant="vote"
                  className="w-full"
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <Vote className="h-4 w-4" />
                  Vote for {candidate.name}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Your Vote</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to vote for{" "}
                    <strong>{candidate.name}</strong> from{" "}
                    <strong>{candidate.party}</strong>? This action cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={candidate.photo_url}
                      alt={candidate.name}
                    />
                    <AvatarFallback>
                      {candidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {candidate.party}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowVoteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="vote"
                    onClick={handleVote}
                    disabled={isVoting}
                  >
                    {isVoting ? "Casting Vote..." : "Confirm Vote"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Elections
          </Link>
        </Button>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Election Candidates</h1>
        <div className="flex items-center justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{electionData.candidates.length} Candidates</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>{totalVotes.toLocaleString()} Total Votes</span>
          </div>
        </div>
      </div>

      {hasVoted && (
        <div className="p-4 bg-success-light rounded-lg border border-success">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Vote Successfully Cast</span>
          </div>
          <p className="text-success-foreground mt-1">
            Thank you for participating in this election. Your vote has been
            securely recorded.
          </p>
        </div>
      )}

      {!hasVoted && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Ready to Vote</span>
          </div>
          <p className="text-primary/80 mt-1">
            Review the candidates below and cast your vote. Remember, you can
            only vote once per election.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {electionData.candidates.map((candidate) => (
          <CandidateCard key={candidate.candidate_id} candidate={candidate} />
        ))}
      </div>
    </div>
  );
};

export default ElectionDetail;