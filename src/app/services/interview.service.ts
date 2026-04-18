import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {


   private baseUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  getByUser(userId: number) {
    return this.http.get(`${this.baseUrl}/interviews/user/${userId}`);
  }

  getMemberInterviews(userId: number) {
    return this.http.get(`${this.baseUrl}/member/interviews/${userId}`);
  }
}
