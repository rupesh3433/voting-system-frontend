import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '@/services/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

// Define proper types for candidates and results
interface Candidate {
  candidate_id: string;
  name: string;
  party: string;
  photo_url: string;
}

interface ElectionResultsType {
  title: string;
  candidates: Candidate[];
  counts: Record<string, number>;
}

const ElectionResults: React.FC = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const [results, setResults] = useState<ElectionResultsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = async () => {
    try {
      const data: ElectionResultsType = await apiService.getLiveResults(electionId!);
      setResults(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch live results",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (electionId) fetchResults();
  }, [electionId]);

  if (isLoading) return <div>Loading...</div>;
  if (!results) return <div>No results found.</div>;

  // Safely calculate total votes
  const totalVotes = Object.values(results.counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>

      <h1 className="text-2xl font-bold">{results.title} - Live Results</h1>

      {results.candidates.map((c) => {
        const voteCount = results.counts[c.candidate_id] || 0;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

        return (
          <div key={c.candidate_id} className="p-4 border rounded">
            <h2 className="font-semibold">
              {c.name} ({c.party})
            </h2>
            <Progress value={percentage} className="h-2" />
            <p>
              {voteCount} votes ({percentage.toFixed(1)}%)
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default ElectionResults;
