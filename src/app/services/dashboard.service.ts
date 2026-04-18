import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  getDashboard(userId: number) {
    return this.http.get(`${this.baseUrl}/dashboard/${userId}`);
  }

  getCandidate(id: number) {
  return this.http.get(`${this.baseUrl}/candidate/${id}`);
 }

 getPanelMembers(candidateId: number) {
    return this.http.get(`${this.baseUrl}/panel-members/${candidateId}`);
  }

  saveEvaluation(payload: any) {
    return this.http.post(`${this.baseUrl}/final-evaluation`, payload);
  }

  getQA(id: number) {
  return this.http.get(`${this.baseUrl}/qa-evaluation-log/${id}`);
 }
}
