// schedule.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterLink, RouterLinkActive, RouterModule],
  templateUrl: './schedule.component.html',
  styleUrl: './schedule.component.css'
})
export class ScheduleComponent implements OnInit {

  private apiUrl = 'http://localhost:8000';

  // ── API State ──
  isLoading: boolean = false;
  apiError: string = '';
  loggedUser: any = null;

  // ── Multi-step flow ──
  currentStep: number = 1;
  scheduleSuccess: boolean = false;
  generatedInterviewId: string = '';

  selectedCourse: string = '';

  // ── View All Interviews ──
  showAllInterviews: boolean = false;
  allInterviews: any[] = [];
  interviewsLoading: boolean = false;
  interviewsError: string = '';
  get maxDOB(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 15);
  return d.toISOString().split('T')[0]; // e.g. "2011-04-18"
}

  // constructor(private http: HttpClient) {}
  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
  this.loggedUser = JSON.parse(localStorage.getItem('user') || 'null');  // add this line
  this.loadUsersFromBackend();
  this.loadPanels();
}
  // ngOnInit(): void {
  //   this.loadUsersFromBackend();
  //   this.loadPanels();
  // }

  // ══════════════════════════════════════════════
  // STEP 1: BASIC SETUP
  // ══════════════════════════════════════════════

  interviewDate: string = '';
  startTime: string = '';
  endTime: string = '';
  appliedRole: string = '';

  panelMode: 'existing' | 'new' = 'new';
  existingPanels: any[] = [];
  selectedPanelId: number | null = null;
  newPanelName: string = '';
  chairmanUserId: number | null = null;
  selectedMembers: any[] = [];
  availableMembers: any[] = [];

  get panelAssigned(): string {
    if (this.panelMode === 'existing') {
      const p = this.existingPanels.find(p => p.id === this.selectedPanelId);
      return p ? p.panel_name : '—';
    }
    return this.newPanelName || '—';
  }

  loadUsersFromBackend(): void {
  this.http.get<any>(`${this.apiUrl}/api/users/interviewers`).subscribe({
    next: (res) => {
      if (res.success) {
        this.availableMembers = res.data.filter(
          (user: any) => user.role === 'member'
        );
      }
    },
    error: (err) => console.error('Failed to load users:', err)
  });
}

  loadPanels(): void {
    this.http.get<any>(`${this.apiUrl}/api/panels`).subscribe({
      next: (res) => { if (res.success) this.existingPanels = res.data; },
      error: (err) => console.error('Failed to load panels:', err)
    });
  }

  addMember(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    if (!id) return;
    const member = this.availableMembers.find(m => m.id === id);
    if (member && !this.isMemberSelected(id)) {
      this.selectedMembers.push(member);
      if (this.selectedMembers.length === 1) this.chairmanUserId = member.id;
    }
    (event.target as HTMLSelectElement).value = '';
  }

  isMemberSelected(id: number): boolean {
    return this.selectedMembers.some(m => m.id === id);
  }

  removeMember(id: number): void {
    this.selectedMembers = this.selectedMembers.filter(m => m.id !== id);
    if (this.chairmanUserId === id) {
      this.chairmanUserId = this.selectedMembers.length > 0 ? this.selectedMembers[0].id : null;
    }
  }

  setChairman(id: number): void { this.chairmanUserId = id; }

  getChairmanName(): string {
    const c = this.selectedMembers.find(m => m.id === this.chairmanUserId);
    return c ? c.name : '— Not assigned —';
  }

  canProceedStep1(): boolean {
    // 🛠️ Updated: Checks for 'selectedCourse' instead of 'appliedRole'
    const basicValid = !!(this.selectedCourse && this.interviewDate && this.startTime && this.endTime);
    
    const panelValid = this.panelMode === 'existing'
      ? !!this.selectedPanelId
      : !!(this.selectedMembers.length > 0 && this.chairmanUserId);
      
    return basicValid && panelValid;
  }
  // Add this helper method in your component
formatScheduledAt(scheduledAt: string): { date: string; time: string } {
  if (!scheduledAt) return { date: '—', time: '' };
  const d = new Date(scheduledAt.includes('T') ? scheduledAt : scheduledAt.replace(' ', 'T') + 'Z');
  return {
    date: d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    time: d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
  };
}
//Monika
get completedCount(): number {
  return this.allInterviews.filter(iv => 
    iv.status?.toLowerCase() === 'completed'
  ).length;
}

get scheduledCount(): number {
  return this.allInterviews.filter(iv => 
    iv.status?.toLowerCase() === 'scheduled'
  ).length;
}
logout(): void {
  localStorage.clear();
  sessionStorage.clear();
  this.router.navigate(['/']);  // redirects to landing page
}

  // ══════════════════════════════════════════════
  // STEP 2: STUDENT DETAILS
  // ══════════════════════════════════════════════

  studentFullName: string = '';
  studentFatherMotherName: string = '';
  studentDOB: string = '';
  studentGender: string = '';
  studentCategory: string = '';
  studentPhoto: File | null = null;
  studentPhotoPreview: string = '';
  studentMobile: string = '';
  studentAltMobile: string = '';
  studentEmail: string = '';
  studentCurrentAddress: string = '';
  studentPermanentAddress: string = '';
  studentCourseProg: string = '';
  studentDeptBranch: string = '';
  studentUniversity: string = '';
  studentEnrollNo: string = '';
  studentAcademicYear: string = '';
  studentCGPA: string = '';
  studentSkills: string = '';
  studentCertifications: string = '';
  studentProjects: string = '';
  studentExperience: string = '';
  studentStrengths: string = '';
  studentWeaknesses: string = '';
  studentCareerObjective: string = '';
  studentDeclaration: boolean = false;

  onPhotoUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.studentPhoto = file;
      const reader = new FileReader();
      reader.onload = (e) => { this.studentPhotoPreview = e.target?.result as string; };
      reader.readAsDataURL(file);
      this.detectFace(file);
    }
  }

  generateInterviewId(): void {
    if (!this.generatedInterviewId) {
      this.generatedInterviewId = 'IVW-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    }
  }

  canProceedStep2(): boolean {
    return !!(this.studentFullName && this.studentDeclaration);
  }

  // ══════════════════════════════════════════════
  // STEP 3: DOCUMENTS & SUBMIT
  // ══════════════════════════════════════════════

  resumeFile: File | null = null;
  idProofFile: File | null = null;
  certificatesFile: File | null = null;
  resumeFileName: string = '';
  idProofFileName: string = '';
  certificatesFileName: string = '';

  onFileUpload(event: Event, type: 'resume' | 'idproof' | 'certificates'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (type === 'resume')       { this.resumeFile = file;       this.resumeFileName = file.name; }
    if (type === 'idproof')      { this.idProofFile = file;      this.idProofFileName = file.name; }
    if (type === 'certificates') { this.certificatesFile = file; this.certificatesFileName = file.name; }
  }

  canSchedule(): boolean {
    return !!(this.resumeFile && this.idProofFile);
  }

  // ══════════════════════════════════════════════
  // NAVIGATION
  // ══════════════════════════════════════════════

  goToStep(step: number): void {
    if (step === this.currentStep) return;
    if (step < this.currentStep) { this.currentStep = step; return; }
    if (step === 2 && this.canProceedStep1()) { this.generateInterviewId(); this.currentStep = 2; }
    else if (step === 3 && this.currentStep === 2 && this.canProceedStep2()) { this.currentStep = 3; }
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.canProceedStep1()) { this.generateInterviewId(); this.currentStep = 2; }
    else if (this.currentStep === 2 && this.canProceedStep2()) { this.currentStep = 3; }
  }

  // ══════════════════════════════════════════════
  // VIEW ALL INTERVIEWS
  // ══════════════════════════════════════════════

  openAllInterviews(): void {
    this.showAllInterviews = true;
    this.loadAllInterviews();
  }

  closeAllInterviews(): void {
    this.showAllInterviews = false;
  }

  loadAllInterviews(): void {
    this.interviewsLoading = true;
    this.interviewsError = '';
    this.http.get<any>(`${this.apiUrl}/api/interviews`).subscribe({
      next: (res) => {
        if (res.success) this.allInterviews = res.data;
        else this.interviewsError = 'Failed to load interviews.';
        this.interviewsLoading = false;
      },
      error: (err) => {
        this.interviewsError = 'Could not connect to server.';
        this.interviewsLoading = false;
      }
    });
  }

  confirmDeleteInterview(interviewId: string): void {
    if (!confirm(`Delete interview ${interviewId}? This cannot be undone.`)) return;
    this.http.delete<any>(`${this.apiUrl}/api/interviews/${interviewId}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.allInterviews = this.allInterviews.filter(i => i.interview_id !== interviewId);
        }
      },
      error: (err) => console.error('Delete error:', err)
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'scheduled':  return 'status-scheduled';
      case 'completed':  return 'status-completed';
      case 'cancelled':  return 'status-cancelled';
      default:           return 'status-scheduled';
    }
  }

  // ══════════════════════════════════════════════
  // API CALLS
  // ══════════════════════════════════════════════

  scheduleInterview(): void {
    if (!this.canSchedule()) return;
    this.isLoading = true;
    this.apiError = '';

    // 🛠️ Updated: Generate fallback panel name using your Course selection rather than appliedRole
    const panelName = this.newPanelName || `${this.selectedCourse} Panel`;

    const payload: any = {
      // Keep applied_role as an empty or fallback string if your backend requires the key present
      applied_role:               this.selectedCourse, 
      interview_date:             this.interviewDate,
      start_time:                 this.startTime,
      end_time:                   this.endTime,
      ...(this.panelMode === 'existing'
        ? { panel_id: this.selectedPanelId }
        : { panel_name: panelName, chairman_user_id: this.chairmanUserId, member_user_ids: this.selectedMembers.map(m => m.id) }
      ),
      student_full_name:          this.studentFullName,
      student_father_mother_name: this.studentFatherMotherName,
      student_dob:                this.studentDOB,
      student_gender:             this.studentGender,
      student_category:           this.studentCategory,
      student_mobile:             this.studentMobile,
      student_alt_mobile:         this.studentAltMobile,
      student_email:              this.studentEmail,
      student_current_address:    this.studentCurrentAddress,
      student_permanent_address:  this.studentPermanentAddress,
      
      // 🔥 CRITICAL UPDATE: Maps the clean standardized course option directly to your Candidate table matching key
      student_course_program:     this.selectedCourse,
      
      student_department_branch:  this.studentDeptBranch,
      student_university:         this.studentUniversity,
      student_enrollment_no:      this.studentEnrollNo,
      student_academic_year:      this.studentAcademicYear,
      student_cgpa:               this.studentCGPA,
      student_skills:             this.studentSkills,
      student_certifications:     this.studentCertifications,
      student_projects:           this.studentProjects,
      student_experience:         this.studentExperience,
      student_strengths:          this.studentStrengths,
      student_weaknesses:         this.studentWeaknesses,
      student_career_objective:   this.studentCareerObjective,
      student_declaration:        this.studentDeclaration,
    };

    this.http.post<any>(`${this.apiUrl}/api/schedule-interview`, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.generatedInterviewId = res.interview_id;
          this.uploadCandidateFiles(res.data.candidate_id);
          this.scheduleSuccess = true;
          this.currentStep = 4;
        } else {
          this.apiError = res.message || 'Failed to schedule interview.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.apiError = err?.error?.detail || 'Server error. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private uploadCandidateFiles(candidateId: number): void {
    const uploads: { file: File; type: string }[] = [];
    if (this.studentPhoto)     uploads.push({ file: this.studentPhoto,     type: 'photo' });
    if (this.resumeFile)       uploads.push({ file: this.resumeFile,       type: 'resume' });
    if (this.idProofFile)      uploads.push({ file: this.idProofFile,      type: 'idproof' });
    if (this.certificatesFile) uploads.push({ file: this.certificatesFile, type: 'certificates' });
    uploads.forEach(({ file, type }) => {
      const fd = new FormData();
      fd.append('file', file);
      this.http.post(`${this.apiUrl}/api/candidates/${candidateId}/upload?file_type=${type}`, fd)
        .subscribe({ error: e => console.error(`Upload ${type} error:`, e) });
    });
  }

  detectFace(imageFile: File): void {
    const formData = new FormData();
    formData.append('file', imageFile);
    this.http.post<any>(`${this.apiUrl}/detect-face`, formData).subscribe({
      next: (res) => {
        if (res.faces === 0)     alert('No face detected. Please upload a clear photo.');
        else if (res.faces > 1) alert('Multiple faces detected. Please upload a solo photo.');
      },
      error: (err) => console.error('Face detect error:', err)
    });
  }

  // ══════════════════════════════════════════════
  // RESET
  // ══════════════════════════════════════════════

  resetForm(): void {
    this.currentStep = 1; this.scheduleSuccess = false; this.generatedInterviewId = '';
    this.apiError = ''; this.isLoading = false; this.interviewDate = ''; this.startTime = '';
    this.endTime = ''; this.appliedRole = ''; this.panelMode = 'new'; this.selectedPanelId = null;
    this.newPanelName = ''; this.chairmanUserId = null; this.selectedMembers = [];
    this.studentFullName = ''; this.studentFatherMotherName = ''; this.studentDOB = '';
    this.studentGender = ''; this.studentCategory = ''; this.studentPhoto = null;
    this.studentPhotoPreview = ''; this.studentMobile = ''; this.studentAltMobile = '';
    this.studentEmail = ''; this.studentCurrentAddress = ''; this.studentPermanentAddress = '';
    this.studentCourseProg = ''; this.studentDeptBranch = ''; this.studentUniversity = '';
    this.studentEnrollNo = ''; this.studentAcademicYear = ''; this.studentCGPA = '';
    this.studentSkills = ''; this.studentCertifications = ''; this.studentProjects = '';
    this.studentExperience = ''; this.studentStrengths = ''; this.studentWeaknesses = '';
    this.studentCareerObjective = ''; this.studentDeclaration = false; this.resumeFile = null;
    this.idProofFile = null; this.certificatesFile = null; this.resumeFileName = '';
    this.idProofFileName = ''; this.certificatesFileName = '';
  }
}
// // schedule.component.ts
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { HttpClient, HttpClientModule } from '@angular/common/http';

// @Component({
//   selector: 'app-schedule',
//   standalone: true,
//   imports: [CommonModule, FormsModule, HttpClientModule],
//   templateUrl: './schedule.component.html',
//   styleUrl: './schedule.component.css'
// })
// export class ScheduleComponent implements OnInit {

//   private apiUrl = 'http://localhost:8000';

//   // ── API State ──
//   isLoading: boolean = false;
//   apiError: string = '';

//   // ── Multi-step flow ──
//   currentStep: number = 1;
//   scheduleSuccess: boolean = false;
//   generatedInterviewId: string = '';

//   constructor(private http: HttpClient) {}

//   ngOnInit(): void {
//     this.loadUsersFromBackend();
//     this.loadPanels();
//   }

//   // ══════════════════════════════════════════════
//   // STEP 1: BASIC SETUP
//   // ══════════════════════════════════════════════

//   interviewDate: string = '';
//   startTime: string = '';
//   endTime: string = '';
//   appliedRole: string = '';

//   // Panel mode: 'existing' | 'new'
//   panelMode: 'existing' | 'new' = 'new';

//   // Existing panel selection
//   existingPanels: any[] = [];
//   selectedPanelId: number | null = null;

//   // New panel on-the-fly
//   newPanelName: string = '';
//   chairmanUserId: number | null = null;
//   selectedMembers: any[] = [];

//   // Pool of users fetched from backend
//   availableMembers: any[] = [];

//   // ── getter for panelAssigned used in Step 2 template ──
//   get panelAssigned(): string {
//     if (this.panelMode === 'existing') {
//       const p = this.existingPanels.find(p => p.id === this.selectedPanelId);
//       return p ? p.panel_name : '—';
//     }
//     return this.newPanelName || '—';
//   }

//   loadUsersFromBackend(): void {
//     this.http.get<any>(`${this.apiUrl}/api/users/interviewers`).subscribe({
//       next: (res) => {
//         if (res.success) this.availableMembers = res.data;
//       },
//       error: (err) => console.error('Failed to load users:', err)
//     });
//   }

//   loadPanels(): void {
//     this.http.get<any>(`${this.apiUrl}/api/panels`).subscribe({
//       next: (res) => {
//         if (res.success) this.existingPanels = res.data;
//       },
//       error: (err) => console.error('Failed to load panels:', err)
//     });
//   }

//   addMember(event: Event): void {
//     const id = Number((event.target as HTMLSelectElement).value);
//     if (!id) return;
//     const member = this.availableMembers.find(m => m.id === id);
//     if (member && !this.isMemberSelected(id)) {
//       this.selectedMembers.push(member);
//       // Auto-assign first member as chairman
//       if (this.selectedMembers.length === 1) {
//         this.chairmanUserId = member.id;
//       }
//     }
//     (event.target as HTMLSelectElement).value = '';
//   }

//   isMemberSelected(id: number): boolean {
//     return this.selectedMembers.some(m => m.id === id);
//   }

//   removeMember(id: number): void {
//     this.selectedMembers = this.selectedMembers.filter(m => m.id !== id);
//     if (this.chairmanUserId === id) {
//       // Auto-assign next available member as chairman
//       this.chairmanUserId = this.selectedMembers.length > 0 ? this.selectedMembers[0].id : null;
//     }
//   }

//   setChairman(id: number): void {
//     this.chairmanUserId = id;
//   }

//   getChairmanName(): string {
//     const c = this.selectedMembers.find(m => m.id === this.chairmanUserId);
//     return c ? c.name : '— Not assigned —';
//   }

//   // ── FIXED: newPanelName is no longer required; chairman auto-assigned ──
//   canProceedStep1(): boolean {
//     const basicValid = !!(
//       this.appliedRole &&
//       this.interviewDate &&
//       this.startTime &&
//       this.endTime
//     );

//     const panelValid = this.panelMode === 'existing'
//       ? !!this.selectedPanelId
//       : !!(this.selectedMembers.length > 0 && this.chairmanUserId);

//     return basicValid && panelValid;
//   }

//   // ══════════════════════════════════════════════
//   // STEP 2: STUDENT DETAILS
//   // ══════════════════════════════════════════════

//   studentFullName: string = '';
//   studentFatherMotherName: string = '';
//   studentDOB: string = '';
//   studentGender: string = '';
//   studentCategory: string = '';
//   studentPhoto: File | null = null;
//   studentPhotoPreview: string = '';

//   studentMobile: string = '';
//   studentAltMobile: string = '';
//   studentEmail: string = '';
//   studentCurrentAddress: string = '';
//   studentPermanentAddress: string = '';

//   studentCourseProg: string = '';
//   studentDeptBranch: string = '';
//   studentUniversity: string = '';
//   studentEnrollNo: string = '';
//   studentAcademicYear: string = '';
//   studentCGPA: string = '';

//   studentSkills: string = '';
//   studentCertifications: string = '';
//   studentProjects: string = '';
//   studentExperience: string = '';

//   studentStrengths: string = '';
//   studentWeaknesses: string = '';
//   studentCareerObjective: string = '';
//   studentDeclaration: boolean = false;

//   onPhotoUpload(event: Event): void {
//     const file = (event.target as HTMLInputElement).files?.[0];
//     if (file) {
//       this.studentPhoto = file;
//       const reader = new FileReader();
//       reader.onload = (e) => { this.studentPhotoPreview = e.target?.result as string; };
//       reader.readAsDataURL(file);
//       this.detectFace(file);
//     }
//   }

//   generateInterviewId(): void {
//     if (!this.generatedInterviewId) {
//       this.generatedInterviewId = 'IVW-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
//     }
//   }

//   canProceedStep2(): boolean {
//     return !!(this.studentFullName && this.studentDeclaration);
//   }

//   // ══════════════════════════════════════════════
//   // STEP 3: DOCUMENTS & SUBMIT
//   // ══════════════════════════════════════════════

//   resumeFile: File | null = null;
//   idProofFile: File | null = null;
//   certificatesFile: File | null = null;

//   resumeFileName: string = '';
//   idProofFileName: string = '';
//   certificatesFileName: string = '';

//   onFileUpload(event: Event, type: 'resume' | 'idproof' | 'certificates'): void {
//     const file = (event.target as HTMLInputElement).files?.[0];
//     if (!file) return;
//     if (type === 'resume')       { this.resumeFile = file;       this.resumeFileName = file.name; }
//     if (type === 'idproof')      { this.idProofFile = file;      this.idProofFileName = file.name; }
//     if (type === 'certificates') { this.certificatesFile = file; this.certificatesFileName = file.name; }
//   }

//   canSchedule(): boolean {
//     return !!(this.resumeFile && this.idProofFile);
//   }

//   // ══════════════════════════════════════════════
//   // NAVIGATION
//   // ══════════════════════════════════════════════

//   goToStep(step: number): void {
//     if (step === this.currentStep) return;

//     if (step < this.currentStep) {
//       this.currentStep = step;
//       return;
//     }

//     if (step === 2 && this.canProceedStep1()) {
//       this.generateInterviewId();
//       this.currentStep = 2;
//     } else if (step === 3 && this.currentStep === 2 && this.canProceedStep2()) {
//       this.currentStep = 3;
//     }
//   }

//   nextStep(): void {
//     if (this.currentStep === 1 && this.canProceedStep1()) {
//       this.generateInterviewId();
//       this.currentStep = 2;
//     } else if (this.currentStep === 2 && this.canProceedStep2()) {
//       this.currentStep = 3;
//     }
//   }

//   // ══════════════════════════════════════════════
//   // API CALLS
//   // ══════════════════════════════════════════════

//   scheduleInterview(): void {
//     if (!this.canSchedule()) return;

//     this.isLoading = true;
//     this.apiError = '';

//     // Auto-generate panel name if empty
//     const panelName = this.newPanelName || `${this.appliedRole} Panel`;

//     const payload: any = {
//       applied_role:   this.appliedRole,
//       interview_date: this.interviewDate,
//       start_time:     this.startTime,
//       end_time:       this.endTime,

//       ...(this.panelMode === 'existing'
//         ? { panel_id: this.selectedPanelId }
//         : {
//             panel_name:       panelName,
//             chairman_user_id: this.chairmanUserId,
//             member_user_ids:  this.selectedMembers.map(m => m.id),
//           }
//       ),

//       student_full_name:          this.studentFullName,
//       student_father_mother_name: this.studentFatherMotherName,
//       student_dob:                this.studentDOB,
//       student_gender:             this.studentGender,
//       student_category:           this.studentCategory,
//       student_mobile:             this.studentMobile,
//       student_alt_mobile:         this.studentAltMobile,
//       student_email:              this.studentEmail,
//       student_current_address:    this.studentCurrentAddress,
//       student_permanent_address:  this.studentPermanentAddress,
//       student_course_program:     this.studentCourseProg,
//       student_department_branch:  this.studentDeptBranch,
//       student_university:         this.studentUniversity,
//       student_enrollment_no:      this.studentEnrollNo,
//       student_academic_year:      this.studentAcademicYear,
//       student_cgpa:               this.studentCGPA,
//       student_skills:             this.studentSkills,
//       student_certifications:     this.studentCertifications,
//       student_projects:           this.studentProjects,
//       student_experience:         this.studentExperience,
//       student_strengths:          this.studentStrengths,
//       student_weaknesses:         this.studentWeaknesses,
//       student_career_objective:   this.studentCareerObjective,
//       student_declaration:        this.studentDeclaration,
//     };

//     this.http.post<any>(`${this.apiUrl}/api/schedule-interview`, payload).subscribe({
//       next: (res) => {
//         if (res.success) {
//           this.generatedInterviewId = res.interview_id;
//           this.uploadCandidateFiles(res.data.candidate_id);
//           this.scheduleSuccess = true;
//           this.currentStep = 4;
//         } else {
//           this.apiError = res.message || 'Failed to schedule interview.';
//         }
//         this.isLoading = false;
//       },
//       error: (err) => {
//         console.error('Schedule error:', err);
//         this.apiError = err?.error?.detail || 'Server error. Please try again.';
//         this.isLoading = false;
//       }
//     });
//   }

//   private uploadCandidateFiles(candidateId: number): void {
//     const uploads: { file: File; type: string }[] = [];

//     if (this.studentPhoto)     uploads.push({ file: this.studentPhoto,     type: 'photo' });
//     if (this.resumeFile)       uploads.push({ file: this.resumeFile,       type: 'resume' });
//     if (this.idProofFile)      uploads.push({ file: this.idProofFile,      type: 'idproof' });
//     if (this.certificatesFile) uploads.push({ file: this.certificatesFile, type: 'certificates' });

//     uploads.forEach(({ file, type }) => {
//       const fd = new FormData();
//       fd.append('file', file);
//       this.http.post(
//         `${this.apiUrl}/api/candidates/${candidateId}/upload?file_type=${type}`, fd
//       ).subscribe({ error: e => console.error(`Upload ${type} error:`, e) });
//     });
//   }

//   getAllInterviews(): void {
//     this.http.get<any>(`${this.apiUrl}/api/interviews`).subscribe({
//       next: (res) => { if (res.success) console.log('All interviews:', res.data); },
//       error: (err) => console.error('Fetch all error:', err)
//     });
//   }

//   getInterviewById(interviewId: string): void {
//     this.http.get<any>(`${this.apiUrl}/api/interviews/${interviewId}`).subscribe({
//       next: (res) => { if (res.success) console.log('Interview detail:', res.data); },
//       error: (err) => console.error('Fetch single error:', err)
//     });
//   }

//   deleteInterview(interviewId: string): void {
//     this.http.delete<any>(`${this.apiUrl}/api/interviews/${interviewId}`).subscribe({
//       next: (res) => { if (res.success) console.log('Deleted:', interviewId); },
//       error: (err) => console.error('Delete error:', err)
//     });
//   }

//   speechToText(audioFile: File): void {
//     const formData = new FormData();
//     formData.append('file', audioFile);
//     this.http.post<any>(`${this.apiUrl}/speech-to-text`, formData).subscribe({
//       next: (res) => { console.log('Transcription:', res.text); },
//       error: (err) => console.error('Speech-to-text error:', err)
//     });
//   }

//   detectFace(imageFile: File): void {
//     const formData = new FormData();
//     formData.append('file', imageFile);
//     this.http.post<any>(`${this.apiUrl}/detect-face`, formData).subscribe({
//       next: (res) => {
//         if (res.faces === 0)     alert('No face detected. Please upload a clear photo.');
//         else if (res.faces > 1) alert('Multiple faces detected. Please upload a solo photo.');
//       },
//       error: (err) => console.error('Face detect error:', err)
//     });
//   }

//   // ══════════════════════════════════════════════
//   // RESET
//   // ══════════════════════════════════════════════

//   resetForm(): void {
//     this.currentStep = 1;
//     this.scheduleSuccess = false;
//     this.generatedInterviewId = '';
//     this.apiError = '';
//     this.isLoading = false;
//     this.interviewDate = '';
//     this.startTime = '';
//     this.endTime = '';
//     this.appliedRole = '';
//     this.panelMode = 'new';
//     this.selectedPanelId = null;
//     this.newPanelName = '';
//     this.chairmanUserId = null;
//     this.selectedMembers = [];
//     this.studentFullName = '';
//     this.studentFatherMotherName = '';
//     this.studentDOB = '';
//     this.studentGender = '';
//     this.studentCategory = '';
//     this.studentPhoto = null;
//     this.studentPhotoPreview = '';
//     this.studentMobile = '';
//     this.studentAltMobile = '';
//     this.studentEmail = '';
//     this.studentCurrentAddress = '';
//     this.studentPermanentAddress = '';
//     this.studentCourseProg = '';
//     this.studentDeptBranch = '';
//     this.studentUniversity = '';
//     this.studentEnrollNo = '';
//     this.studentAcademicYear = '';
//     this.studentCGPA = '';
//     this.studentSkills = '';
//     this.studentCertifications = '';
//     this.studentProjects = '';
//     this.studentExperience = '';
//     this.studentStrengths = '';
//     this.studentWeaknesses = '';
//     this.studentCareerObjective = '';
//     this.studentDeclaration = false;
//     this.resumeFile = null;
//     this.idProofFile = null;
//     this.certificatesFile = null;
//     this.resumeFileName = '';
//     this.idProofFileName = '';
//     this.certificatesFileName = '';
//   }
// }
