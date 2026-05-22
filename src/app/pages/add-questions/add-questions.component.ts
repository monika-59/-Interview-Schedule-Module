import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-questions',
  standalone: true, // Ensured standalone flag matches your direct import strategy
  imports: [FormsModule, CommonModule],
  templateUrl: './add-questions.component.html',
  styleUrl: './add-questions.component.css'
})
export class AddQuestionsComponent {
  // ✅ Form Bindings 
  selectedCourse: string = '';
  numQuestions: number = 3;
  selectedFile: File | null = null;
  
  // ✅ Interface Operational App States
  isLoading: boolean = false;
  statusMessage: string = '';
  errorMessage: string = '';

  // ✅ Centralized API Base target path variable
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Catches user file updates and ensures it meets PDF validation constraints
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      this.errorMessage = '';
    } else {
      this.selectedFile = null;
      this.errorMessage = 'Invalid format. Please attach a structural reference PDF.';
    }
  }

  /**
   * Submits the binary document data along with selected course labels via FormData boundaries
   */
  onGenerate(form: any): void {
    if (!form.valid || !this.selectedFile) {
      this.errorMessage = 'Please select a course and upload a reference syllabus document.';
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.errorMessage = '';

    // 🛠️ Construct Multipart parameters block matching backend expectations
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('num_questions', this.numQuestions.toString());
    formData.append('course', this.selectedCourse); // Enforces validation alignment against CourseProgram enum keys

    this.http.post<any>(`${this.apiUrl}/api/upload-and-generate-questions`, formData)
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.statusMessage = `🚀 Successfully generated ${res.count} questions for ${res.course} under Category partition: ${res.category}!`;
            
            // Clean view attachments
            this.selectedFile = null;
            form.resetForm({
              course: '',
              numQuestions: 3
            });
            this.selectedCourse = '';
            this.numQuestions = 3;
          } else {
            this.errorMessage = res.error || 'The model encountered an anomaly while evaluating text segments.';
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.detail || 'An exception occurred while processing parameters with the question engine.';
          console.error("Upload failure dump log profile tracking context:", err);
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/schedule']);
  }
}