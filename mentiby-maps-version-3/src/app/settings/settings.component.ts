import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../services/login';
import { MapService } from '../services/map.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [LoginService, MapService],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  // Account/Profile Info
  username: string = '';
  currentPassword: any = '';
  newPassword: any = '';
  confirmPassword: any = '';

  // Settings properties (loaded from localStorage or defaulted)
  mapTheme: string = 'standard';
  defaultCity: string = 'newyork';
  defaultZoom: number = 13;
  travelMode: string = 'driving';
  distanceUnit: string = 'metric';
  accentColor: string = 'indigo';

  // Feedback states
  successMessage: string = '';
  errorMessage: string = '';

  // Cities coordinates mapping
  cities: { [key: string]: { name: string; lat: number; lng: number } } = {
    newyork: { name: 'New York', lat: 40.7128, lng: -74.0060 },
    london: { name: 'London', lat: 51.5074, lng: -0.1278 },
    newdelhi: { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
    paris: { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
  };

  constructor(
    private loginService: LoginService,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'Guest';
    this.loadSettings();
  }

  loadSettings(): void {
    this.mapTheme = localStorage.getItem('mentiby_mapTheme') || 'standard';
    this.defaultCity = localStorage.getItem('mentiby_defaultCity') || 'newyork';
    this.defaultZoom = parseInt(localStorage.getItem('mentiby_defaultZoom') || '13', 10);
    this.travelMode = localStorage.getItem('mentiby_travelMode') || 'driving';
    this.distanceUnit = localStorage.getItem('mentiby_distanceUnit') || 'metric';
    this.accentColor = localStorage.getItem('mentiby_accentColor') || 'indigo';

    this.applyAccentColor(this.accentColor);
  }

  saveGeneralSettings(): void {
    this.successMessage = '';
    this.errorMessage = '';

    localStorage.setItem('mentiby_mapTheme', this.mapTheme);
    localStorage.setItem('mentiby_defaultCity', this.defaultCity);
    localStorage.setItem('mentiby_defaultZoom', this.defaultZoom.toString());
    localStorage.setItem('mentiby_travelMode', this.travelMode);
    localStorage.setItem('mentiby_distanceUnit', this.distanceUnit);
    localStorage.setItem('mentiby_accentColor', this.accentColor);

    this.applyAccentColor(this.accentColor);
    this.successMessage = 'Settings saved successfully!';
    setTimeout(() => this.successMessage = '', 3000);
  }

  applyAccentColor(color: string): void {
    const root = document.documentElement;
    if (color === 'emerald') {
      root.style.setProperty('--accent-indigo', '#10b981');
      root.style.setProperty('--accent-purple', '#059669');
      root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #10b981 0%, #059669 100%)');
      root.style.setProperty('--accent-hover-gradient', 'linear-gradient(135deg, #059669 0%, #047857 100%)');
    } else if (color === 'orange') {
      root.style.setProperty('--accent-indigo', '#f97316');
      root.style.setProperty('--accent-purple', '#ea580c');
      root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)');
      root.style.setProperty('--accent-hover-gradient', 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)');
    } else {
      // Default Indigo/Purple
      root.style.setProperty('--accent-indigo', '#6366f1');
      root.style.setProperty('--accent-purple', '#a855f7');
      root.style.setProperty('--accent-gradient', 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)');
      root.style.setProperty('--accent-hover-gradient', 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)');
    }
  }

  changePassword(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All password fields are required.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New password and confirmation do not match.';
      return;
    }

    this.loginService.updatePassword(this.username, this.currentPassword, this.newPassword).subscribe({
      next: (response: any) => {
        this.successMessage = 'Password updated successfully!';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.error || 'Failed to update password. Verify current password.';
      }
    });
  }

  exportHistory(): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.mapService.getfullhistory().subscribe({
      next: (response: any) => {
        // Grouped history is in response.data. Find history for current user
        const userData = response.data.find((u: any) => u.userName === this.username);
        const historyData = userData ? userData.locations : [];

        if (historyData.length === 0) {
          this.errorMessage = 'No search history to export.';
          return;
        }

        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${this.username}_mentiby_history.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        this.successMessage = 'Search history exported successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to fetch search history for export.';
      }
    });
  }

  clearHistory(): void {
    if (!confirm('Are you sure you want to clear your entire search history? This action cannot be undone.')) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    this.mapService.clearHistory(this.username).subscribe({
      next: (response: any) => {
        this.successMessage = 'Your search history has been wiped clean.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        this.errorMessage = error.error?.error || 'Failed to clear search history.';
      }
    });
  }
}
