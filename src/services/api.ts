import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: { name: string; email: string; password: string }) {
    const response = await this.api.post("/auth/register", data);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.api.post("/auth/login", data);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get("/auth/me");
    return response.data;
  }

  // Voter endpoints
  async registerVoter(formData: FormData) {
    const response = await this.api.post("/voters/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async getPendingVoters() {
    const response = await this.api.get("/admin/pending-voters");
    return response.data;
  }

  async approveVoter(voterId: string) {
    const response = await this.api.post(`/voters/${voterId}/approve`);
    return response.data;
  }

  async rejectVoter(voterId: string) {
    const response = await this.api.post(`/voters/${voterId}/reject`);
    return response.data;
  }

  // Election endpoints
  async getElections() {
    const response = await this.api.get("/elections");
    return response.data;
  }

  async getElectionDetail(electionId: string) {
    const response = await this.api.get(`/elections/${electionId}`);
    return response.data;
  }

  async createElection(data: {
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
  }) {
    const response = await this.api.post("/elections", data);
    return response.data;
  }

  async publishElection(electionId: string) {
    const response = await this.api.post(`/elections/${electionId}/publish`);
    return response.data;
  }

  async unpublishElection(electionId: string) {
    const response = await this.api.post(`/elections/${electionId}/unpublish`);
    return response.data;
  }

  // Candidate endpoints
  async getCandidates() {
    const response = await this.api.get("/candidates");
    return response.data;
  }

  async addCandidate(electionId: string, formData: FormData) {
    const response = await this.api.post(
      `/elections/${electionId}/candidates`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  // Voting endpoints
  async castVote(
    electionId: string,
    data: { voter_id: string; candidate_id: string }
  ) {
    const response = await this.api.post(`/elections/${electionId}/vote`, data);
    return response.data;
  }

  async getLatestVotes(electionId: string) {
    const response = await this.api.get(
      `/elections/${electionId}/votes/latest`
    );
    return response.data;
  }

  // Voter status methods
  async getMyVoterStatus() {
    const response = await this.api.get("/voters/my-status");
    return response.data;
  }

  async getApprovedVoters() {
    const response = await this.api.get("/voters/approved");
    return response.data;
  }

  // ✅ ADDED: Get approved voter ID method
  async getMyApprovedVoterId(): Promise<string | null> {
    try {
      const status = await this.getMyVoterStatus();
      if (status.approved && status.voter_id) {
        return status.voter_id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Live Results
  async getLiveResults(electionId: string) {
    const response = await this.api.get(
      `/elections/${electionId}/live-results`
    );
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;