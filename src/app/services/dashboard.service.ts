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

//    getQA(id: number) {
//   return this.http.get(`${this.baseUrl}/qa-evaluation-log/${id}`);
//  }

 getQA(candidateId: number, memberId: number) {
  return this.http.get(`${this.baseUrl}/qa-evaluation-log/${candidateId}/${memberId}`);
}

getPanelMembers(candidateId: number) {
  return this.http.get(`${this.baseUrl}/panel-members/${candidateId}`);
}

saveEvaluation(payload: any) {
  return this.http.post(`${this.baseUrl}/final-evaluation`, payload);
}

saveFinalVerdict(data: any) {
  return this.http.post(`${this.baseUrl}/save-final-verdict`, data);
}

getFinalMark(candidateId: number, memberId: number) {
  return this.http.get(`${this.baseUrl}/final-mark/${candidateId}/${memberId}`);
}

getPanelQuestionScores(panelId: number) {
  return this.http.get(`${this.baseUrl}/panel-question-scores/${panelId}`);
}


getPanelEvaluationFinalMark(panelId: number) {
  return this.http.get(`${this.baseUrl}/panel-evaluation-final-mark/${panelId}`);
}

getFinalVerdict(candidateId: number, memberId: number) {
  return this.http.get<any>(
    `${this.baseUrl}/final-remark/${candidateId}/${memberId}`
  );
}
}
