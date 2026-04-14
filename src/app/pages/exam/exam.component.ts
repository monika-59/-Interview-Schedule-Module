import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})
export class ExamComponent implements OnInit {

  @ViewChild('video') videoRef!: ElementRef;

  stream: MediaStream | null = null;
  mediaRecorder: any;
  recordedChunks: any[] = [];

  answer: string = '';
  currentQuestion: any = null;

  timeLeft: number = 120;
  interval: any;
  captureInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadRandomQuestion();
    this.startTimer();
  }

  // ---------------- QUESTION ----------------
  loadRandomQuestion() {
    console.log('📥 Fetching question from backend...');

    this.http.get<any>('http://127.0.0.1:8000/questions/random')
      .subscribe({
        next: (res) => {
          console.log('✅ Question received:', res);
          this.currentQuestion = res;
          this.answer = '';
        },
        error: (err) => {
          console.error('❌ Error fetching question:', err);
        }
      });
  }

  nextQuestion() {
    this.stopMonitoring();
    this.loadRandomQuestion();
    this.resetTimer();
  }

  // ---------------- TIMER ----------------
  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        console.warn('⏰ Time up! Auto moving...');
        this.nextQuestion();
      }
    }, 1000);
  }

  resetTimer() {
    clearInterval(this.interval);
    this.timeLeft = 120;
    this.startTimer();
  }

  get formattedTime() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // ---------------- START MONITORING ----------------
  startMonitoring() {

    console.log('🎥 Starting monitoring with recording...');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {

        this.stream = stream;
        this.videoRef.nativeElement.srcObject = stream;

        // 🎬 RECORDING START
        this.mediaRecorder = new MediaRecorder(stream);
        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event: any) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          console.log('🛑 Recording stopped');

          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          console.log('📦 Video size:', blob.size);

          this.uploadVideo(blob);
        };

        this.mediaRecorder.start();
        console.log('▶️ Recording started');

        // Face detection interval
        this.captureInterval = setInterval(() => {
          this.captureFrame();
        }, 2000);
      });
  }

  // ---------------- STOP MONITORING ----------------
  stopMonitoring() {

    console.log('🛑 Stopping monitoring...');

    // Stop recording
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('🎬 MediaRecorder stopped');
    }

    // Stop capture interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
      console.log('⏹️ Capture interval stopped');
    }

    // Stop camera
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      console.log('📷 Camera stopped');
    }

    // Clear video
    if (this.videoRef && this.videoRef.nativeElement) {
      this.videoRef.nativeElement.srcObject = null;
    }

    console.log('✅ Monitoring stopped');
  }

  // ---------------- FACE DETECTION ----------------
  captureFrame() {
    const video = this.videoRef.nativeElement;

    if (!video.videoWidth || !video.videoHeight) {
      console.warn('⚠️ Video not ready');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;

      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');

      this.http.post<any>('http://127.0.0.1:8000/detect-face', formData)
        .subscribe({
          next: (res) => {
            console.log('👤 Faces:', res.faces);

            if (res.faces === 0) {
              console.warn('❌ No face');
            } else if (res.faces > 1) {
              console.warn('❌ Multiple faces');
            } else {
              console.log('✅ Normal');
            }
          },
          error: (err) => {
            console.error('❌ Face API error:', err);
          }
        });

    }, 'image/jpeg');
  }

  // ---------------- UPLOAD VIDEO ----------------
  uploadVideo(blob: Blob) {

    console.log('🚀 Uploading video...');

    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    this.http.post<any>('http://127.0.0.1:8000/speech-to-text', formData)
      .subscribe({
        next: (res) => {
          console.log('🧠 Whisper text:', res.text);

          this.answer = res.text;

          this.saveAnswer(res.text);
        },
        error: (err) => {
          console.error('❌ Upload error:', err);
        }
      });
  }

  // ---------------- SAVE ANSWER ----------------
  saveAnswer(text: string) {

    const payload = {
      candidate_id: 'CAND001',
      question_id: this.currentQuestion?.id,
      answer_text: text,
      time_taken: 120 - this.timeLeft
    };

    console.log('💾 Saving answer:', payload);

    this.http.post('http://127.0.0.1:8000/answers', payload)
      .subscribe({
        next: () => console.log('✅ Saved'),
        error: (err) => console.error('❌ Save error:', err)
      });
  }
} 