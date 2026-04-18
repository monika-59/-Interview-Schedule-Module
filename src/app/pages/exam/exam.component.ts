import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})
export class ExamComponent {

  @ViewChild('video') videoRef!: ElementRef;

  // ---------------- STREAMS ----------------
  combinedStream: MediaStream | null = null;
  videoStream: MediaStream | null = null;
  audioStream: MediaStream | null = null;

  // ---------------- RECORDERS ----------------
  videoRecorder: any;
  audioRecorder: any;

  fullVideo: Blob[] = [];

  // ---------------- FLAGS ----------------
  audioLoopRunning = false;
  interviewCompleted = false;
  isSpeaking = false; // 🔥 IMPORTANT (TTS control)

  // ---------------- DATA ----------------
  answer: string = '';
  currentQuestion: any = null;

  interviewId: string = '';

  uploadQueue: Blob[] = [];
  processingQueue = false;

  faceCheckInterval: any;

  timeLeft = 40;
  interval: any;

  silenceCounter = 0;
  silenceThreshold = 10;

  questionStartTime: number = 0;
  questionEndTime: number = 0;
  interviewDetails: any = null;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  // ================= START BUTTON CLICK =================
  startInterview() {

    const interviewId = 3; // TODO: replace with dynamic

    this.http.get<any>(`http://127.0.0.1:8000/interview/${interviewId}`)
      .subscribe({
        next: async (res) => {

          this.interviewDetails = res;
          this.interviewId = res.id;

          await this.initStreams();

          this.startVideoRecording();
          this.startAudioLoop();

          this.loadNextQuestion();
          this.startTimer();
          this.startFaceDetection();
        },
        error: (err) => console.error(err)
      });
  }

  // ================= INIT STREAM =================
  async initStreams() {

    if (this.combinedStream) return;

    this.combinedStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true
      }
    });

    // 🎥 VIDEO ONLY STREAM (NO AUDIO PLAYBACK)
    this.videoStream = new MediaStream(
      this.combinedStream.getVideoTracks()
    );

    // 🎤 AUDIO ONLY STREAM
    this.audioStream = new MediaStream(
      this.combinedStream.getAudioTracks()
    );

    setTimeout(() => {
      if (this.videoRef && this.videoStream) {
        this.videoRef.nativeElement.srcObject = this.videoStream;
        this.videoRef.nativeElement.muted = true; // 🔥 extra safety
      }
    }, 100);
  }

  // ================= VIDEO RECORDING =================
  startVideoRecording() {

    if (!this.combinedStream) return;

    this.videoRecorder = new MediaRecorder(this.combinedStream, {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 500000
    });

    this.videoRecorder.ondataavailable = (event: any) => {
      if (event.data.size > 0) {
        this.fullVideo.push(event.data);
      }
    };

    this.videoRecorder.start(5000);
  }

  // ================= AUDIO LOOP =================
  startAudioLoop() {

    if (this.audioLoopRunning || !this.audioStream) return;

    this.audioLoopRunning = true;

    const recordChunk = () => {

      // 🔥 STOP if speaking (TTS)
      if (!this.audioLoopRunning || this.interviewCompleted) {
  return;
}

if (this.isSpeaking) {
  setTimeout(recordChunk, 500); // retry instead of blocking
  return;
}

      this.audioRecorder = new MediaRecorder(this.audioStream!, {
        mimeType: 'audio/webm;codecs=opus'
      });

      let chunks: Blob[] = [];

      this.audioRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 1000) {
          chunks.push(event.data);
        }
      };

      this.audioRecorder.onstop = () => {

        if (this.isSpeaking) return; // 🔥 double safety

        const blob = new Blob(chunks, { type: 'audio/webm' });

        if (blob.size > 2000) {
          this.uploadQueue.push(blob);
          this.processQueue();
        }

        setTimeout(recordChunk, 300);
      };

      this.audioRecorder.start();

      setTimeout(() => {
        if (this.audioRecorder?.state === 'recording') {
          this.audioRecorder.requestData();
        }
      }, 7000);

      setTimeout(() => {
        if (this.audioRecorder?.state !== 'inactive') {
          this.audioRecorder.stop();
        }
      }, 8000);
    };

    recordChunk();
  }

  // ================= PROCESS QUEUE =================
  processQueue() {

    if (this.processingQueue || this.uploadQueue.length === 0) return;

    const blob = this.uploadQueue.shift()!;
    this.processingQueue = true;

    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');

    this.http.post<any>('http://127.0.0.1:8000/speech-to-text', formData)
      .subscribe({
        next: (res) => {

          if (res.text && res.text.trim()) {

            this.silenceCounter = 0;

            if (!this.answer.toLowerCase().includes(res.text.toLowerCase())) {

              if (this.answer.length > 500) {
                this.answer = this.answer.slice(-300);
              }

              this.answer += ' ' + res.text;
            }

          } else {
            this.silenceCounter += 8;
          }

          this.processingQueue = false;
          setTimeout(() => this.processQueue(), 500);
        },
        error: () => {
          console.error("❌ STT failed");
          this.processingQueue = false;
          setTimeout(() => this.processQueue(), 500);
        }
      });
  }

  // ================= QUESTIONS =================
  loadNextQuestion() {

  this.http.get<any>(`http://127.0.0.1:8000/next-question/${this.interviewId}`)
    .subscribe(res => {

      if (res.message === 'Interview completed') {
        this.finishInterview();
        return;
      }

      this.currentQuestion = res;
      this.answer = '';

      this.questionStartTime = Date.now();

      setTimeout(() => {
        this.speakQuestion(this.currentQuestion.question_text);

        // 🔥 ENSURE STT resumes after speaking
        setTimeout(() => {
          if (!this.audioLoopRunning && !this.interviewCompleted) {
            console.warn("🔁 Restarting STT loop after question");
            this.startAudioLoop();
          }
        }, 2000);

      }, 500);
    });
}

  handleNextQuestion() {
    this.questionEndTime = Date.now();
    this.saveAnswer();
    this.loadNextQuestion();
    this.resetTimer();
  }

  // ================= SAVE =================
  saveAnswer() {

    const payload = {
      candidate_id: this.interviewDetails?.candidate_id,
      panel_id: this.interviewDetails?.panel_id,
      interview_id: this.interviewDetails?.id,
      question_id: this.currentQuestion?.id,
      answer_text: this.answer.trim(),
      time_taken: 40 - this.timeLeft,
      start_time: this.questionStartTime,
      end_time: this.questionEndTime
    };

    this.http.post('http://127.0.0.1:8000/answers', payload).subscribe();
  }

  // ================= TIMER =================
  startTimer() {
    this.interval = setInterval(() => {
      if (this.timeLeft > 0) this.timeLeft--;
      else this.handleNextQuestion();
    }, 1000);
  }

  resetTimer() {
    clearInterval(this.interval);
    this.timeLeft = 40;
    this.startTimer();
  }

  get formattedTime() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // ================= FINISH =================
  finishInterview() {

    this.interviewCompleted = true;
    this.audioLoopRunning = false;

    if (this.videoRecorder) this.videoRecorder.stop();

    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach(track => track.stop());
    }

    this.uploadFinalVideo();
    alert('🎉 Interview Completed!');
  }

  // ================= UPLOAD =================
  uploadFinalVideo() {

    const finalBlob = new Blob(this.fullVideo, { type: 'video/webm' });

    const formData = new FormData();
    formData.append('file', finalBlob, 'final.webm');

    this.http.post(`http://127.0.0.1:8000/save-video/${this.interviewId}`, formData)
      .subscribe();
  }

  // ================= TTS =================
  speakQuestion(text: string) {

  this.isSpeaking = true;

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'en-US';

  speech.onend = () => {

    console.log("🗣 TTS finished");

    setTimeout(() => {
      this.isSpeaking = false;

      // 🔥 FORCE restart STT loop if stuck
      if (!this.audioLoopRunning && !this.interviewCompleted) {
        console.warn("🔁 Restarting STT after TTS");
        this.startAudioLoop();
      }

    }, 500);
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

  startFaceDetection() {

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    this.faceCheckInterval = setInterval(() => {

      if (!this.videoRef?.nativeElement) return;

      const video = this.videoRef.nativeElement;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {

        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        this.http.post<any>('http://127.0.0.1:8000/detect-face', formData)
          .subscribe(res => {

            const faces = res.faces;

            // 🟢 CASES
            if (faces === 0) {
              alert("⚠ No face detected");
            }

            if (faces > 1) {
              alert("🚨 Multiple faces detected!");

              // later you can enable alert:
              // alert("Multiple faces detected!");
            }

          });

      }, 'image/jpeg');

    }, 3000); // every 3 seconds
  }
}