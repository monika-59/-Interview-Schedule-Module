import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InterviewService } from '../../services/interview.service';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface InterviewSchedule {
  interviewId: string;
  date: string;
  time: string;
  role: string;
  chairman: string;
  panel: string;
  status: 'Live' | 'Done' | 'Pending';
}

interface EvaluationQA {
  question: string;
  answer: string;
  score?: number;
}

interface Candidate {
  name: string;
  init: string;
  initBg: string;
  initColor: string;
  meta: string;
  listMeta: string;
  dob: string;
  gen: string;
  mob: string;
  email: string;
  cgpa: string;
  sem: string;
  skills: string[];
  ai: string;
  aiTags: [string, string][];
  sub: string;
  schedule: InterviewSchedule;
  recordedVideo?: string;
  evaluations: EvaluationQA[];
}



interface Criterion {
  label: string;
  key: string;
}

interface Criteria {
  name: string;
  score: number;
}

@Component({
  selector: 'app-chairman-dashboard',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, FormsModule,CommonModule],
  templateUrl: './chairman-dashboard.component.html',
  styleUrl: './chairman-dashboard.component.css'
})
export class ChairmanDashboardComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  isVideoModalOpen = false;
  interviewCandidates: any[] = [];
  assignCandidates: any[] = [];

  dashboard: any = {};
  user: any = {};
  userId!: number;

  selectedIndex: number = 0;   // 👉 first item selected
  isOpen = true;              // 👉 dropdown open
  selectedCandidate: any = null; // 👉 no fake empty object
panelMembers: any[] | null = null;

  // candidates: Candidate[] = [
  //   {
  //     name: 'Rahul Sharma',
  //     init: 'R',
  //     initBg: '#eef2ff',
  //     initColor: '#4f46e5',
  //     meta: 'B.Tech Computer Science · BHU · Roll: CS2101',
  //     listMeta: 'B.Tech · CSE · CS2101 · BHU',
  //     dob: '12 Mar 2002',
  //     gen: 'Male · OBC',
  //     mob: '9812345678',
  //     email: 'rahul@bhu.ac.in',
  //     cgpa: '8.7 CGPA',
  //     sem: '3rd Year / Sem 6',
  //     skills: ['Python', 'Machine Learning', 'SQL', 'React', 'Java'],
  //     ai: 'Rahul demonstrates strong analytical reasoning and ML fundamentals. His CGPA of 8.7 and project portfolio suggest above-average technical aptitude.',
  //     aiTags: [
  //       ['strength', 'Strong ML background'],
  //       ['strength', 'High academic score'],
  //       ['watch', 'Verify project depth'],
  //       ['info', 'Relocation: Yes']
  //     ],
  //     sub: 'Rahul Sharma · B.Tech CSE',
  //     schedule: {
  //       interviewId: 'IVW-2026-4821',
  //       date: '15 Apr 2026',
  //       time: '10:00 AM – 1:00 PM',
  //       role: 'Software Engineer',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Live'
  //     },
  //     recordedVideo: 'https://www.w3schools.com/html/mov_bbb.mp4',
  //     evaluations: [
  //       { question: 'Explain OOP concepts', answer: 'Inheritance, Polymorphism, Encapsulation, Abstraction...', score: 9 },
  //       { question: 'What is REST API?', answer: 'Representational State Transfer...', score: 8 },
  //       { question: 'Reverse a linked list', answer: 'Using three pointers method...', score: 10 }
  //     ]
  //   },
  //   {
  //     name: 'Priya Mehta',
  //     init: 'P',
  //     initBg: '#f0fdf4',
  //     initColor: '#16a34a',
  //     meta: 'B.Tech IT · IIT Delhi · Roll: IT2089',
  //     listMeta: 'B.Tech · IT · IT2089 · IIT Delhi',
  //     dob: '5 Jun 2001',
  //     gen: 'Female · General',
  //     mob: '9876543210',
  //     email: 'priya@iitd.ac.in',
  //     cgpa: '9.1 CGPA',
  //     sem: '4th Year / Sem 8',
  //     skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker'],
  //     ai: 'Priya shows exceptional academic performance and a solid full-stack portfolio. Cloud certifications add strong practical value.',
  //     aiTags: [
  //       ['strength', 'Excellent CGPA'],
  //       ['strength', 'Cloud certified'],
  //       ['info', 'Full-stack ready'],
  //       ['info', 'Relocation: Yes']
  //     ],
  //     sub: 'Priya Mehta · B.Tech IT',
  //     schedule: {
  //       interviewId: 'IVW-2026-4822',
  //       date: '16 Apr 2026',
  //       time: '2:00 PM – 5:00 PM',
  //       role: 'Full Stack Developer',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Done'
  //     },
  //     evaluations: []
  //   },
  //   {
  //     name: 'Ankit Verma',
  //     init: 'A',
  //     initBg: '#fffbeb',
  //     initColor: '#d97706',
  //     meta: 'B.Tech ECE · NIT Allahabad · Roll: EC1992',
  //     listMeta: 'B.Tech · ECE · EC1992 · NIT',
  //     dob: '20 Nov 2002',
  //     gen: 'Male · SC',
  //     mob: '9001122334',
  //     email: 'ankit@nit.ac.in',
  //     cgpa: '7.4 CGPA',
  //     sem: '3rd Year / Sem 6',
  //     skills: ['Embedded C', 'MATLAB', 'Arduino'],
  //     ai: 'Strong embedded systems background with DRDO internship.',
  //     aiTags: [['strength', 'DRDO intern'], ['watch', 'Moderate CGPA']],
  //     sub: 'Ankit Verma · B.Tech ECE',
  //     schedule: {
  //       interviewId: 'IVW-2026-4823',
  //       date: '17 Apr 2026',
  //       time: '9:00 AM – 12:00 PM',
  //       role: 'Embedded Engineer',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Pending'
  //     },
  //     evaluations: []
  //   },
  //   {
  //     name: 'Sneha Patel',
  //     init: 'S',
  //     initBg: '#fef2f2',
  //     initColor: '#dc2626',
  //     meta: 'B.Tech CSE · BITS Pilani · Roll: CS1874',
  //     listMeta: 'B.Tech · CSE · CS1874 · BITS',
  //     dob: '8 Feb 2003',
  //     gen: 'Female · General',
  //     mob: '9654321098',
  //     email: 'sneha@bits.ac.in',
  //     cgpa: '8.2 CGPA',
  //     sem: '3rd Year / Sem 6',
  //     skills: ['C++', 'Competitive Programming', 'Django'],
  //     ai: 'Excellent in competitive programming (CodeChef 3-star). Strong algorithmic skills.',
  //     aiTags: [['strength', 'CP 3-star'], ['watch', 'Team collaboration?']],
  //     sub: 'Sneha Patel · B.Tech CSE',
  //     schedule: {
  //       interviewId: 'IVW-2026-4824',
  //       date: '18 Apr 2026',
  //       time: '3:00 PM – 6:00 PM',
  //       role: 'SDE Intern',
  //       chairman: 'Dr. Anil Kumar',
  //       panel: 'Technical A',
  //       status: 'Pending'
  //     },
  //     evaluations: []
  //   }
  // ];

  defaultTags = [
  'Strong ML background',
  'High academic score',
  'Verify project depth',
  'Relocation: Yes'
];

staticQA  = [
  {
    question: 'Explain OOP concepts',
    answer: 'Inheritance, Polymorphism, Encapsulation...',
    score: 9
  },
  {
    question: 'What is REST API?',
    answer: 'Representational State Transfer...',
    score: 8
  },
  {
    question: 'Reverse a linked list',
    answer: 'Using three pointers method...',
    score: 10
  }
];
  // criteria: Criterion[] = [
  //   { label: 'Technical Knowledge', key: 'tech' },
  //   { label: 'Problem Solving', key: 'prob' },
  //   { label: 'Communication', key: 'comm' },
  //   { label: 'Domain Aptitude', key: 'domain' },
  //   { label: 'Overall Impression', key: 'overall' }
  // ];

    criteria: Criteria[] = [
    { name: 'Technical Knowledge', score: 0 },
    { name: 'Problem Solving', score: 0 },
    { name: 'Communication', score: 0 },
    { name: 'Domain Aptitude', score: 0 },
    { name: 'Overall Impression', score: 0 }
  ];

  scores: { [key: string]: number } = {};
  verdict = '';
  remarks = '';
  currentCandidateIndex = 0;
  showSuccessOverlay = false;
  evaluatedCount = 1;

  constructor(private sanitizer: DomSanitizer, private interviewService: InterviewService
    , private dashboardService: DashboardService
    , private authService: AuthService,
    private router: Router
  ) { }


  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user')!);
    this.userId = user.id;
    console.log('User ID:', this.userId);
    this.getLoginUserData();
    this.getDashBoardData();
    // this.initializeScores();
    // this.getInterviewCandidatesData();


    // this.loadMemberOfInterviews();
  }

  goToMemberPage() {
  this.router.navigate(['/CommitteeDashboard', this.userId]);
}
 
  // Get Login User Data
  getLoginUserData() {
    this.authService.getUser(this.userId).subscribe({
      next: (res: any) => {
        this.user = res;
      },
      error: (err) => {
        console.error('Error fetching user', err);
      }
    });
  }

  // Get Dashboard  User Data
  getDashBoardData() {
    this.dashboardService.getDashboard(this.userId).subscribe({
      next: (res: any) => {
        this.dashboard = res;
      },
      error: (err) => {
        console.error('Error loading dashboard', err);
      }
    });
  }

  //get Interview Dropdwon
  // loadMemberOfInterviews() {
  //   this.interviewService.getMemberInterviews(this.userId).subscribe({
  //     next: (res: any) => {
  //       console.log('API Response:', res);   // full response
  //       //this.assignCandidates = res;
  //       console.log('Candidates:', this.assignCandidates); // after assign
  //        this.assignCandidates = res.filter(
  //       (c: any) => c.role?.toLowerCase() === 'chairman'
  //     );

  //       // ✅ Auto select first candidate
  //       if (this.assignCandidates && this.assignCandidates.length > 0) {
  //         this.selectCandidate(this.assignCandidates[0], 0);
  //       }
  //     },
  //     error: (err) => console.error(err)
  //   });
  // }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

// selectCandidate(candidate: any, index: number) {
//   this.selectedIndex = index;

//   const candidateId = candidate.candidate_id;

//   // ✅ Loading state
//   this.panelMembers = null;

//   forkJoin({
//     candidate: this.dashboardService.getCandidate(candidateId),
//     qa: this.dashboardService.getQA(candidateId),
//     panel: this.dashboardService.getPanelMembers(candidateId)
//   }).subscribe({
//     next: (res: any) => {

//       // Candidate
//       this.selectedCandidate = res.candidate;

//       // QA
//       this.selectedCandidate.qaList = res.qa?.qaList || [];

//       // Clean skills
//       if (this.selectedCandidate.skills) {
//         this.selectedCandidate.skills =
//           this.selectedCandidate.skills.map((s: string) => s.trim());
//       }

//        console.log('PANEL API RESPONSE 👉', res.panel);
//         console.log('PANEL 👉', this.panelMembers);
   
//        this.panelMembers = res.panel;
//       console.log('FINAL DATA 👉', this.selectedCandidate);
    
//     },
//     error: (err) => {
//       console.error(err);
//       this.panelMembers = []; // fallback
//     }
//   });
// }


get completedCount(): number {
  return this.panelMembers?.filter((m: any) => m.status === 'Done')?.length || 0;
}


  selectVerdict(value: string) {
    this.verdict = value;
  }

  // submit() {
  //   const payload = {
  //     scores: this.criteria,
  //     total: this.totalScore,
  //     remarks: this.remarks,
  //     verdict: this.verdict
  //   };

  //   console.log('Final Evaluation:', payload);
  //   alert('Submitted!');
  // }

 submit() {

  const payload = {
    candidateId: this.selectedCandidate.id,
    memberId: this.userId,
    remark: this.remarks,
    verdict: this.verdict,

    qaList: this.selectedCandidate.qaList.map((q: any) => ({
      question_id: q.question_id,   // ✅ ADD THIS
      score: q.score || 0
    }))
  };

  console.log('Sending Payload 👉', payload);

  this.dashboardService.saveEvaluation(payload).subscribe({
    next: (res: any) => {
      console.log('Saved ✅', res);
      alert('Evaluation submitted successfully!');
    },
    error: (err) => {
      console.error('Error ❌', err);
      alert('Failed to submit');
    }
  });
}


getTagClass(tag: string) {
  tag = tag.toLowerCase();

  if (tag.includes('strong') || tag.includes('high')) return 'tag green';
  if (tag.includes('verify')) return 'tag red';
  if (tag.includes('relocation')) return 'tag blue';

  return 'tag';
}
  get totalScore(): number {
    return this.criteria.reduce((sum, c) => sum + c.score, 0);
  }

  // get totalScore(): number {
  //   return Object.values(this.scores).reduce((a, b) => a + b, 0);
  // }

  get safeVideoUrl(): SafeUrl | null {
    if (!this.selectedCandidate.recordedVideo) return null;
    return this.sanitizer.bypassSecurityTrustUrl(this.selectedCandidate.recordedVideo);
  }











  // 🔥 Dynamic avatar color
  getColor(name: string): string {
    const colors = ['#6C5CE7', '#00B894', '#0984E3', '#E17055', '#FD79A8'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }








  updateScore(key: string, event: any): void {
    let value = parseInt(event.target.value) || 0;
    value = Math.min(10, Math.max(0, value));
    this.scores[key] = value;
    event.target.value = value;
  }

  setVerdict(val: string): void {
    this.verdict = val;
  }

  // submitEvaluation(): void {
  //   if (this.totalScore === 0 || !this.verdict) {
  //     alert('Please complete all scores and select a verdict');
  //     return;
  //   }

  //   this.showSuccessOverlay = true;
  //   setTimeout(() => {
  //     this.showSuccessOverlay = false;
  //     this.evaluatedCount++;
  //     this.selectedCandidate[this.currentCandidateIndex].schedule.status = 'Done';
  //   }, 2200);
  // }

  openVideoModal(): void {
    this.isVideoModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal(): void {
    this.isVideoModalOpen = false;
    document.body.style.overflow = '';

    // Pause video when closing modal
    if (this.videoPlayer?.nativeElement) {
      this.videoPlayer.nativeElement.pause();
    }
  }

  getStatusClass(candidate: Candidate): string {
    switch (candidate.schedule.status) {
      case 'Live': return 'status-live';
      case 'Done': return 'status-done';
      default: return 'status-pending';
    }
  }

  getScoreClass(score?: number): string {
    if (score === undefined) return 'mid';
    if (score >= 8) return 'high';
    if (score >= 6) return 'mid';
    return 'low';
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      this.router.navigate(['/']);
    }
  }


  // selectCandidate(index: number) {
  //   this.currentCandidateIndex = index;
  // }

  // selectCandidate(candidateId: number, index: number): void {
  //   this.currentCandidateIndex = index;

  //   this.dashboardService.getCandidate(candidateId).subscribe({
  //     next: (res: any) => {

  //       this.selectedCandidate = {
  //         name: res.name,
  //         init: res.name?.charAt(0).toUpperCase() || '',

  //         initBg: '#007bff',
  //         initColor: '#fff',

  //         meta: [
  //           res.student_course_program,
  //           res.student_department_branch,
  //           res.student_university,
  //           res.student_enrollment_no
  //         ].filter(Boolean).join(' · '),

  //         dob: res.dob,
  //         gen: [res.gen, res.category].filter(Boolean).join(' · '),
  //         mob: res.mob,
  //         email: res.email,

  //         cgpa: res.cgpa,
  //         sem: res.sem,

  //         skills: Array.isArray(res.skills)
  //           ? res.skills.map((s: string) => s.trim())
  //           : [],

  //         ai: 'Auto generated summary not available',
  //         aiTags: [],

  //         schedule: {
  //           interviewId: res.interview_id || 'N/A',
  //           date: '',
  //           time: '',
  //           role: '',
  //           status: 'Pending'
  //         },

  //         recordedVideo: res.recordedVideo || null,

  //         evaluations: []
  //       };

  //     },
  //     error: (err) => console.error('Error loading candidate', err)
  //   });
  // }

  // loadMemberOfInterviews() {
  //   this.interviewService.getMemberInterviews(this.userId).subscribe({
  //     next: (res: any) => {
  //       this.assignCandidates = res.map((c: any) => ({
  //         ...c,
  //         initBg: '#007bff',     // default color
  //         initColor: '#cc4040'
  //       }));
  //     },
  //     error: (err) => {
  //       console.error('Error loading interviews', err);
  //     }
  //   });
  // }

  // initializeScores(): void {
  //   this.scores = {};
  //   this.criteria.forEach(c => this.scores[c.key] = 0);
  // }

  // selectCandidate(index: number): void {
  //   this.currentCandidateIndex = index;
  //   this.initializeScores();
  //   this.verdict = '';
  //   this.remarks = '';
  //   this.closeVideoModal();
  // }
}