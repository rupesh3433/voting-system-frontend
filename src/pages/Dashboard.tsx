import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiService from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, Users, TrendingUp, Eye } from 'lucide-react';

interface Election {
  election_id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  published: boolean;
  status: 'upcoming' | 'ongoing' | 'past';
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const data = await apiService.getElections();
      setElections(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch elections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-success text-success-foreground';
      case 'upcoming':
        return 'bg-warning text-warning-foreground';
      case 'past':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ElectionCard = ({ election }: { election: Election }) => (
    <Card className="hover:shadow-lg transition-smooth group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-smooth">
              {election.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {election.description}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(election.status)}>
            {election.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Start: {formatDate(election.start_at)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>End: {formatDate(election.end_at)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant={election.status === 'ongoing' ? 'vote' : 'default'} 
            size="sm" 
            asChild
            className="flex-1"
          >
            <Link to={`/elections/${election.election_id}`}>
              <Eye className="h-4 w-4" />
              {election.status === 'ongoing' ? 'Vote Now' : 'View Details'}
            </Link>
          </Button>
          
          {election.status === 'ongoing' && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/elections/${election.election_id}/results`}>
                <TrendingUp className="h-4 w-4" />
                Live Results
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ status }: { status: string }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <Users className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No {status} elections</h3>
      <p className="text-muted-foreground">
        {status === 'ongoing' 
          ? 'There are no active elections at the moment.' 
          : `No ${status} elections found.`}
      </p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcomingElections = elections.filter(e => e.status === 'upcoming' && e.published);
  const ongoingElections = elections.filter(e => e.status === 'ongoing' && e.published);
  const pastElections = elections.filter(e => e.status === 'past' && e.published);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Democracy in Action
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Participate in secure, transparent elections. Your voice matters in shaping our democratic future.
        </p>
      </div>

      <Tabs defaultValue="ongoing" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="ongoing" className="gap-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            Ongoing ({ongoingElections.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <div className="w-2 h-2 bg-warning rounded-full"></div>
            Upcoming ({upcomingElections.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            Past ({pastElections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing" className="mt-8">
          {ongoingElections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {ongoingElections.map((election) => (
                <ElectionCard key={election.election_id} election={election} />
              ))}
            </div>
          ) : (
            <EmptyState status="ongoing" />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-8">
          {upcomingElections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingElections.map((election) => (
                <ElectionCard key={election.election_id} election={election} />
              ))}
            </div>
          ) : (
            <EmptyState status="upcoming" />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-8">
          {pastElections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastElections.map((election) => (
                <ElectionCard key={election.election_id} election={election} />
              ))}
            </div>
          ) : (
            <EmptyState status="past" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;