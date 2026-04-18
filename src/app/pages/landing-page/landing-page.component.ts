import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css',
})
export class LandingPageComponent implements OnInit, OnDestroy {
  // ── Navbar state ──
  isScrolled = false;
  // FIX: renamed to mobileMenuOpen (false = hidden by default)
  // matches [class.open]="!mobileMenuHidden" in the HTML
  mobileMenuHidden = true;

  // ── Modal state ──
  modalOpen = false;
  isLogin = true;

  // ── Login form ──
  loginEmail = '';
  loginPassword = '';
  loginLoading = false;

  // ── Register form ──
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerRole = 'student';
  registerLoading = false;

  // ── Canvas & particles ──
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private dots: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
  private W = 0;
  private H = 0;
  private animFrameId = 0;

  // ── Observers ──
  private revealObserver!: IntersectionObserver;
  private statsObserver!: IntersectionObserver;
  private statsAnimated = false;

  constructor(private authService: AuthService, private router: Router) {}

  // ── ESC closes modal ──
  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') this.closeModal();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 30;
  }

  ngOnInit(): void {
    this.initCanvas();
    this.initParticles();
    this.initScrollReveal();
    this.initStatsObserver();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    this.revealObserver?.disconnect();
    this.statsObserver?.disconnect();
  }

  // ── Smooth scroll ──
  scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Mobile menu ──
  toggleMobile() {
    this.mobileMenuHidden = !this.mobileMenuHidden;
  }

  // FIX: close mobile menu when clicking outside
  closeMobileMenu() {
    this.mobileMenuHidden = true;
  }

  // ── Modal controls ──
  openModal(mode: 'login' | 'register') {
    this.isLogin = mode === 'login';
    this.modalOpen = true;
    // FIX: also close mobile menu when opening modal
    this.mobileMenuHidden = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOpen = false;
    document.body.style.overflow = '';
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  switchMode() {
    this.isLogin = !this.isLogin;
    this.loginLoading = false;
    this.registerLoading = false;
  }

  // ── Demo credentials fill ──
  fillDemo(role: 'student' | 'admin') {
    const creds = {
      student: { e: 'demo@student.com', p: 'student123' },
      admin:   { e: 'demo@admin.com',   p: 'admin123'   },
    };
    this.loginEmail    = creds[role].e;
    this.loginPassword = creds[role].p;
  }

  // ── Login ──
  doLogin() {
    this.loginLoading = true;

    const payload = {
      email:    this.loginEmail,
      password: this.loginPassword,
    };

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        this.loginLoading = false;
        alert(`✅ Welcome ${res.user.name}`);

        localStorage.setItem('user', JSON.stringify(res.user));

        if (res.user.role === 'admin') {
          this.router.navigate(['/schedule']);
        } else if (res.user.role === 'member') {
          this.router.navigate(['/CommitteeDashboard']);
        } else {
          this.router.navigate(['/LandingPage']);
        }

        this.closeModal();
      },
      error: () => {
        this.loginLoading = false;
        alert('❌ Invalid email or password');
      },
    });
  }

  // ── Register ──
  doRegister() {
    this.registerLoading = true;
    setTimeout(() => {
      alert(`🎉 Account created! Welcome, ${this.registerName || 'user'}`);
      this.registerLoading = false;
      this.closeModal();
    }, 1200);
  }

  // ── Canvas particle network ──
  private initCanvas() {
    this.canvas = document.getElementById('heroCanvas') as HTMLCanvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d')!;
    this.resizeCanvas();

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.initDots();
    });

    this.initDots();
    this.drawNet();
  }

  private resizeCanvas() {
    this.W = this.canvas.width  = this.canvas.offsetWidth;
    this.H = this.canvas.height = this.canvas.offsetHeight;
  }

  private initDots() {
    this.dots = [];
    for (let i = 0; i < 60; i++) {
      this.dots.push({
        x:  Math.random() * this.W,
        y:  Math.random() * this.H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r:  Math.random() * 2 + 1,
      });
    }
  }

  private drawNet() {
    const { ctx, dots } = this;
    ctx.clearRect(0, 0, this.W, this.H);

    dots.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > this.W) d.vx *= -1;
      if (d.y < 0 || d.y > this.H) d.vy *= -1;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(91,33,182,.35)';
      ctx.fill();
    });

    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx   = dots[i].x - dots[j].x;
        const dy   = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(91,33,182,${(1 - dist / 120) * 0.14})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.drawNet());
  }

  // ── Floating particles ──
  private initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const colors = [
      'rgba(91,33,182,.4)',
      'rgba(6,182,212,.4)',
      'rgba(124,58,237,.35)',
      'rgba(245,158,11,.35)',
    ];

    for (let i = 0; i < 18; i++) {
      const p     = document.createElement('div');
      p.className = 'particle';
      const size  = Math.random() * 6 + 3;
      const dur   = Math.random() * 15 + 10;
      const delay = Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-20px;background:${color};animation-duration:${dur}s;animation-delay:-${delay}s`;
      container.appendChild(p);
    }
  }

  // ── Scroll reveal ──
  private initScrollReveal() {
    this.revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) =>
      this.revealObserver.observe(el)
    );
  }

  // ── Stats counter ──
  private initStatsObserver() {
    const statsEl = document.getElementById('stats-strip');
    if (!statsEl) return;

    this.statsObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          this.runStats();
          this.statsObserver.disconnect();
        }
      }),
      { threshold: 0.3 }
    );

    this.statsObserver.observe(statsEl);

    setTimeout(() => {
      const rect = statsEl.getBoundingClientRect();
      if (rect.top < window.innerHeight) this.runStats();
    }, 600);
  }

  private runStats() {
    if (this.statsAnimated) return;
    this.statsAnimated = true;
    this.animateCount('s1', 5, '+', 2200);
    this.animateCount('s2', 95,    '%', 1800);
    this.animateCount('s3', 5,   '+', 2000);
    // s4 is static (4.9/5)
  }

  private animateCount(elId: string, target: number, suffix: string, dur: number) {
    const el = document.getElementById(elId);
    if (!el) return;

    let start: number | null = null;

    const step = (ts: number) => {
      if (!start) start = ts;
      const p     = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val   = Math.floor(eased * target);
      el.textContent = (val >= 1000 ? val.toLocaleString() : val) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }
}