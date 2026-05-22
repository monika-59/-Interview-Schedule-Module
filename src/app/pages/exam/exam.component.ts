import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment.service';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})
export class ExamComponent implements OnInit {

  @ViewChild('video') videoRef!: ElementRef;

  // ---------------- STREAMS ----------------
  combinedStream: MediaStream | null = null;
  videoStream: MediaStream | null = null;
  audioStream: MediaStream | null = null;

  // ---------------- RECORDERS ----------------
  videoRecorder: any;
  fullVideo: Blob[] = [];

  // ---------------- FLAGS ----------------
  interviewCompleted = false;
  isSpeaking = false; 
  isGradingPrevious = false; 
  isGeneratingQuestions = false; 
  questionsGenerated = false;    
  isSocketReady = false;

  // ---------------- DATA ----------------
  answer: string = '';
  currentQuestion: any = null;
  currentQuestionIndex: number = 0;
  generatedQuestionsCount: number = 0;
  interviewId: string = '';
  candidateName: string = '';
  interviewDetails: any = null;
  
  // 🔥 FIX: Added Missing Variable Definitions
  selectedCourse: string = ''; 
  interviewQuestions: any[] = [];

  // ---------------- PDF Handling ----------------
  referencePdf: File | null = null; 
  referencePdfName: string = '';
  aiSessionCategory: string = ''; 
  isGenerating: boolean = false;
  displaySubject: string = '';

  // ---------------- TIMING/STATE ----------------
  timeLeft = 50;
  interval: any;
  questionStartTime: number = 0;
  questionEndTime: number = 0;
  currentQuestionId: number | null = null;

  faceStatus: 'idle' | 'checking' | 'success' | 'error' = 'idle';
  faceError: string = '';
  audioLevel: number = 0;

  audioContext!: AudioContext;
  analyser!: AnalyserNode;
  micStream!: MediaStream;
  preCheckInterval: any;
  okDetected = false;
  isOkListenerActive: boolean = false;

  socket!: WebSocket;

  constructor(private http: HttpClient, private route: ActivatedRoute, public router: Router) {}

  ngOnInit() {
    this.initPreCheck();
  }

  // ================= 1. GENERATE QUESTIONS FROM PDF =================
  generateQuestionsFromPdf() {
    if (!this.referencePdf || !this.selectedCourse) {
      alert("Please select a course and attach a reference syllabus PDF.");
      return;
    }
    
    this.isGeneratingQuestions = true;
    const formData = new FormData();
    formData.append('file', this.referencePdf);
    formData.append('num_questions', '5'); 
    formData.append('course', this.selectedCourse); 

    this.http.post<any>(`${environment.apiBaseUrl}/api/upload-and-generate-questions`, formData)
      .subscribe({
        next: (res) => {
          this.isGeneratingQuestions = false;
          this.questionsGenerated = true;
          this.generatedQuestionsCount = res.count;
          this.aiSessionCategory = res.category;
          this.displaySubject = res.display_subject;
          console.log("✅ Questions generated from PDF. Count:", res.count, "Category:", this.aiSessionCategory);
        },
        error: (err) => {
          this.isGeneratingQuestions = false;
          console.error("❌ PDF Processing failed:", err);
          alert("Failed to process PDF. Please try again.");
        }
      });
  }

  // ================= 2. START INTERVIEW WITH HANDSHAKE & COURSE MATCHING =================
 startInterview() {
    // 1. Read the current live scheduled handshake profile record context block
    this.http.get<any>(`${environment.apiBaseUrl}/api/interviews/latest`)
      .subscribe({
        next: (latestRes) => {
          if (!latestRes.success || !latestRes.data?.candidate?.id) {
            alert("Unable to verify an active candidate interview session handshake.");
            return;
          }

          // Capture explicit details out of handshake initialization payload data
          const targetCandidateId = latestRes.data.candidate.id;
          this.interviewId = latestRes.data.interview.id;
          this.interviewDetails = latestRes.data;

          console.log(`🔍 Handshake successful. Resolving question bank assignments for Candidate ID: ${targetCandidateId}`);

          // 2. Fetch all evaluation question models dynamically matched to this candidate's course track
          this.http.get<any>(`${environment.apiBaseUrl}/api/get-questions-by-candidate/${targetCandidateId}`)
            .subscribe({
              next: async (qRes) => {
                if (qRes.success && qRes.questions.length > 0) {
                  // Bind structural elements cleanly to frontend tracking state blocks
                  this.interviewQuestions = qRes.questions;
                  this.candidateName = qRes.candidate_name;
                  this.selectedCourse = qRes.matched_course; // e.g. "B-Tech", "MCA", etc.
                  this.currentQuestionIndex = 0;
                  
                  console.log(`✅ Loaded ${qRes.total_questions} questions for track: ${this.selectedCourse}`);

                  // 3. Mount device hardware loops & connect real-time sockets
                  await this.initStreams();
                  this.startVideoRecording();
                  this.initWebSocket();
                  this.startAudioStreaming();
                  
                  // 4. Trigger assessment flow steps
                  this.loadNextQuestion(); 
                  this.startTimer();
                  
                  clearInterval(this.preCheckInterval);
                } else {
                  alert(`No structured evaluation questions exist in the database bank matching the track: ${qRes.matched_course || 'Unknown'}.`);
                }
              },
              error: (qErr) => {
                console.error("❌ Question mapping lookup execution failure:", qErr);
                alert("An exception occurred while building your target course evaluation profile data.");
              }
            });
        },
        error: (err) => {
          console.error("❌ Pre-interview handshake sequence crashed:", err);
          alert("Failed to initialize system authorization settings.");
        }
      });
  }

  // ================= 3. SAVE & GRADE =================
  saveAnswer() {
    if (!this.currentQuestion || !this.answer.trim()) return;

    this.isGradingPrevious = true;

    const formData = new FormData();
    formData.append('candidate_id', this.interviewDetails.candidate.id.toString());
    formData.append('interview_id', this.interviewDetails.interview.id.toString());
    formData.append('panel_id', this.interviewDetails.panel.id.toString());
    formData.append('question_id', this.currentQuestion.id.toString());
    formData.append('answer_text', this.answer.trim());
    formData.append('time_taken', (50 - this.timeLeft).toString());

    this.http.post<any>(`${environment.apiBaseUrl}/api/submit-and-grade`, formData)
      .subscribe({
        next: () => this.isGradingPrevious = false,
        error: () => this.isGradingPrevious = false
      });
  }

  handleNextQuestion() {
    this.saveAnswer(); 
    this.currentQuestionIndex++;
    this.loadNextQuestion();
    this.resetTimer();
  }

  // ================= 4. LOAD NEXT COMPLIANT QUESTION =================
  loadNextQuestion() {
    // Check local filtered index array limit before hitting remote endpoints
    if (this.interviewQuestions && this.interviewQuestions.length > 0) {
      if (this.currentQuestionIndex < this.interviewQuestions.length) {
        this.currentQuestion = this.interviewQuestions[this.currentQuestionIndex];
        this.answer = '';
        this.speakQuestion(this.currentQuestion.question_text);
        return;
      } else {
        this.finishInterview();
        return;
      }
    }

    // Fallback: API fallback routine routing if local list initialization was bypassed
    console.log("Attempting structural fallback category pull for:", this.selectedCourse);
    this.http.get<any>(`${environment.apiBaseUrl}/next-question/${this.interviewId}?category=${this.selectedCourse}`)
      .subscribe({
        next: (res) => {
          if (res.message === 'Interview completed' || !res.question_text) {
            this.finishInterview();
            return;
          }
          this.currentQuestion = res;
          this.answer = '';
          this.speakQuestion(this.currentQuestion.question_text);
        },
        error: (err) => console.error("HTTP Error fetching individual question fallback row:", err)
      });
  }

  // ================= MEDIA & STREAMING =================
  async initStreams() {
    this.combinedStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { noiseSuppression: true, echoCancellation: true }
    });
    this.videoStream = new MediaStream(this.combinedStream.getVideoTracks());
    this.audioStream = new MediaStream(this.combinedStream.getAudioTracks());

    if (this.videoRef) {
      this.videoRef.nativeElement.srcObject = this.videoStream;
    }
  }

  startVideoRecording() {
    this.videoRecorder = new MediaRecorder(this.combinedStream!, { mimeType: 'video/webm;codecs=vp8' });
    this.videoRecorder.ondataavailable = (e: any) => this.fullVideo.push(e.data);
    this.videoRecorder.start(5000);
  }

  initWebSocket() {
    this.socket = new WebSocket('ws://127.0.0.1:8000/ws/audio');
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'Turn' && data.transcript) {
        this.answer += ' ' + data.transcript;
      }
    };
  }

  startAudioStreaming() {
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(this.audioStream!);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(audioContext.destination);
    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
      }
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(pcmData.buffer);
      }
    };
  }

  // ================= PRE-CHECK LOGIC =================
  async initPreCheck() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.videoStream = new MediaStream(stream.getVideoTracks());
      this.micStream = new MediaStream(stream.getAudioTracks());
      if (this.videoRef) this.videoRef.nativeElement.srcObject = this.videoStream;
      this.startFaceDetectionLoop();
      this.startAudioMeter();
      this.startSpeechDetection();
    } catch (err) {
      this.faceStatus = 'error';
      this.faceError = 'Access Denied';
    }
  }

  startFaceDetectionLoop() {
    this.faceStatus = 'checking';
    this.preCheckInterval = setInterval(() => {
      const canvas = document.createElement('canvas');
      const video = this.videoRef.nativeElement;
      if (!video.videoWidth) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      canvas.toBlob(blob => {
        const fd = new FormData(); fd.append('file', blob!, 'f.jpg');
        this.http.post<any>(`${environment.apiBaseUrl}/detect-face`, fd).subscribe(res => {
          this.faceStatus = res.faces === 1 ? 'success' : 'error';
        });
      }, 'image/jpeg');
    }, 2000);
  }

  startAudioMeter() {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.micStream);
    this.analyser = this.audioContext.createAnalyser();
    source.connect(this.analyser);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const update = () => {
      this.analyser.getByteFrequencyData(data);
      this.audioLevel = (data.reduce((a, b) => a + b) / data.length) * 2;
      requestAnimationFrame(update);
    };
    update();
  }

  startSpeechDetection() {
    if (this.isOkListenerActive) return;
    this.isOkListenerActive = true;

    const SpeechRec = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = false; 
    rec.lang = 'en-IN';
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const msg = e.results[e.results.length - 1][0].transcript.toLowerCase();
      console.log("Speech heard during pre-check:", msg);

      if (msg.includes('ok')) {
        if (this.questionsGenerated) {
          console.log("OK detected and questions ready. Starting...");
          this.okDetected = true;
          this.isOkListenerActive = false;
          rec.stop();
          this.startInterview(); 
        } else {
          console.log("OK detected but questions still generating...");
        }
      }
    };

    rec.onend = () => {
      if (!this.okDetected && !this.interviewCompleted) {
        console.log("Restarting OK listener...");
        rec.start();
      } else {
        this.isOkListenerActive = false;
      }
    };

    rec.onerror = (err: any) => console.error("Speech Recognition Error:", err.error);
    rec.start();
  }

  // ================= UTILS =================
  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) this.timeLeft--;
      else this.handleNextQuestion();
    }, 1000);
  }

  resetTimer() {
    clearInterval(this.interval);
    this.timeLeft = 50;
    this.startTimer();
  }

  get formattedTime() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  speakQuestion(text: string) {
    window.speechSynthesis.cancel();
    const s = new SpeechSynthesisUtterance(text);
    s.lang = 'en-IN';
    window.speechSynthesis.speak(s);
  }

  finishInterview() {
    this.interviewCompleted = true;
    if (this.videoRecorder?.state !== 'inactive') this.videoRecorder.stop();
    if (this.socket) this.socket.close();

    this.stopAllStreams();
    this.uploadFinalVideo();
    alert('🎉 Interview Completed!');
    this.router.navigate(['']);
  }

  uploadFinalVideo() {
    const blob = new Blob(this.fullVideo, { type: 'video/webm' });
    const fd = new FormData(); fd.append('file', blob, 'final.webm');
    this.http.post(`${environment.apiBaseUrl}/save-video/${this.interviewId}`, fd).subscribe();
  }

  goToDashboard() {
    this.router.navigate(['']);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.referencePdf = file;
      this.generateQuestionsFromPdf(); // Routes formatting parameters directly inside clean context handler
    }
  }

  stopAllStreams() {
    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
    }
    if (this.audioContext) this.audioContext.close();
    clearInterval(this.preCheckInterval);
    clearInterval(this.interval);
    
    this.combinedStream = null;
    this.videoStream = null;
    this.audioStream = null;
  }
}