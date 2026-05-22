import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-candidate-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './candidate-login.component.html',
  styleUrls: ['./candidate-login.component.css']
})
export class CandidateLoginComponent {

  email: string = '';
  phone: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  login() {
  this.errorMessage = '';

  if (!this.email || !this.phone) {
    this.errorMessage = 'Please enter email and phone number';
    return;
  }

  this.loading = true;

  this.http.post<any>('http://127.0.0.1:8000/api/candidate/login', {
    email: this.email,
    phone: this.phone
  }).subscribe({
    next: (res) => {
      this.loading = false;

      if (res.success) {

        // ✅ store candidate
        localStorage.setItem('candidate', JSON.stringify(res.data));

        // 🔥 REDIRECT
        this.router.navigate(['/exam']);

      } else {
        this.errorMessage = res.message || 'Invalid credentials';
      }
    },
    error: () => {
      this.loading = false;
      this.errorMessage = 'Server error';
    }
  });
}
}