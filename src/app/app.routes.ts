import { Routes } from '@angular/router';
import { ExamComponent } from './pages/exam/exam.component';
import { ScheduleComponent } from './pages/schedule/schedule.component';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { CommitteeDashboardComponent } from './pages/committee-dashboard/committee-dashboard.component';
import { ChairmanDashboardComponent } from './pages/chairman-dashboard/chairman-dashboard.component';

export const routes: Routes = [
    // { path: '', component: ExamComponent },
    // { path: 'schedule', component: ScheduleComponent },
    // { path: 'LandingPage', component: LandingPageComponent },

{ path: 'exam', component: ExamComponent },
    { path: 'schedule', component: ScheduleComponent },
    { path: 'CommitteeDashboard', component: CommitteeDashboardComponent },
    // { path: 'ChairmanDashboard', component: ChairmanDashboardComponent },
    { path: '', component: LandingPageComponent },
      { path: 'CommitteeDashboard/:id', component: CommitteeDashboardComponent },
    { path: 'ChairmanDashboard/:id', component: ChairmanDashboardComponent },
];
